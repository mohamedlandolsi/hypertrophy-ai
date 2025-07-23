import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { 
  ApiErrorHandler, 
  AuthenticationError, 
  logger 
} from '@/lib/error-handler';
import { chunkFitnessContent } from '@/lib/text-chunking';
import { generateEmbedding } from '@/lib/vector-embeddings';

// GET - Fetch all knowledge items for the authenticated user
export async function GET(request: NextRequest) {
  const context = ApiErrorHandler.createContext(request);
  
  try {
    logger.info('Knowledge items fetch requested', context);
    
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new AuthenticationError();
    }

    logger.info('Fetching knowledge items', { ...context, userId: user.id });

    // Ensure user exists in our database
    await prisma.user.upsert({
      where: { id: user.id },
      update: {},
      create: { id: user.id }
    });

    // Fetch knowledge items for the user
    const knowledgeItems = await prisma.knowledgeItem.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    logger.info('Knowledge items fetched successfully', { 
      ...context, 
      userId: user.id,
      itemCount: knowledgeItems.length 
    });

    return NextResponse.json({ knowledgeItems });
  } catch (error) {
    return ApiErrorHandler.handleError(error, context);
  }
}

// POST - Create a new knowledge item (text content) with chunking and embedding
export async function POST(request: NextRequest) {
  const context = ApiErrorHandler.createContext(request);
  
  try {
    logger.info('Knowledge item creation requested', context);
    
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new AuthenticationError();
    }

    const { title, content, type } = await request.json();

    if (!title || !content || !type) {
      return NextResponse.json(
        { error: 'Title, content, and type are required' },
        { status: 400 }
      );
    }

    logger.info('Processing knowledge item', { 
      ...context, 
      userId: user.id, 
      title, 
      contentLength: content.length 
    });

    // Ensure user exists in our database
    await prisma.user.upsert({
      where: { id: user.id },
      update: {},
      create: { id: user.id }
    });

    // Create knowledge item first
    const knowledgeItem = await prisma.knowledgeItem.create({
      data: {
        title,
        content,
        type: type.toUpperCase(),
        status: 'PROCESSING', // Set to processing while we chunk and embed
        userId: user.id,
      }
    });

    // PHASE 3: Clean and Re-Chunk Logic
    try {
      // Step 1: Delete any existing chunks for this knowledge item (clean slate)
      await prisma.knowledgeChunk.deleteMany({
        where: {
          knowledgeItemId: knowledgeItem.id
        }
      });

      // Step 2: Process and chunk the content
      const chunks = chunkFitnessContent(content);
      
      logger.info('Content chunked', { 
        ...context, 
        userId: user.id, 
        knowledgeItemId: knowledgeItem.id,
        chunkCount: chunks.length 
      });

      // Step 3: Generate embeddings and create chunks
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        
        try {
          // Prefix chunk content with document title for better context
          const prefixedContent = `${title}\n\n${chunk.content}`;
          
          // Generate embedding for this prefixed chunk
          const embeddingResult = await generateEmbedding(prefixedContent);
          
          // Create knowledge chunk with embedding
          await prisma.knowledgeChunk.create({
            data: {
              knowledgeItemId: knowledgeItem.id,
              content: chunk.content,
              chunkIndex: i,
              embeddingData: JSON.stringify(embeddingResult.embedding) // Store as JSON for now
            }
          });
          
        } catch (embeddingError) {
          console.error(`Error creating embedding for chunk ${i}:`, embeddingError);
          // Continue with other chunks even if one fails
        }
      }

      // Step 4: Update knowledge item status to READY
      await prisma.knowledgeItem.update({
        where: { id: knowledgeItem.id },
        data: { status: 'READY' }
      });

      logger.info('Knowledge item processing completed', { 
        ...context, 
        userId: user.id, 
        knowledgeItemId: knowledgeItem.id,
        chunkCount: chunks.length 
      });

    } catch (processingError) {
      console.error('Error processing knowledge item:', processingError);
      
      // Update status to ERROR if processing fails
      await prisma.knowledgeItem.update({
        where: { id: knowledgeItem.id },
        data: { status: 'ERROR' }
      });
      
      throw processingError;
    }

    return NextResponse.json({ knowledgeItem });
    
  } catch (error) {
    return ApiErrorHandler.handleError(error, context);
  }
}
