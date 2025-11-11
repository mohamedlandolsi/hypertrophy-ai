import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ApiErrorHandler } from '@/lib/error-handler';
import { prisma } from '@/lib/prisma';

interface EdgeFunctionResponse {
  success: boolean;
  chunksCreated: number;
  embeddingsGenerated: number;
  processingTime: number;
  errors: string[];
}

// POST /api/knowledge/process-with-edge
export async function POST(request: NextRequest) {
  const context = ApiErrorHandler.createContext(request);
  
  try {
    const { filePath, fileName, mimeType, knowledgeItemId } = await request.json();
    
    if (!filePath || !fileName || !mimeType) {
      return NextResponse.json(
        { error: 'Missing required parameters: filePath, fileName, mimeType' },
        { status: 400 }
      );
    }

    // Verify authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let knowledgeItem;

    // If knowledgeItemId is provided, find existing item; otherwise create new one
    if (knowledgeItemId) {
      knowledgeItem = await prisma.knowledgeItem.findFirst({
        where: {
          id: knowledgeItemId,
          userId: user.id
        }
      });

      if (!knowledgeItem) {
        return NextResponse.json(
          { error: 'Knowledge item not found' },
          { status: 404 }
        );
      }
    } else {
      // Create new knowledge item for Edge Function processing
      knowledgeItem = await prisma.knowledgeItem.create({
        data: {
          title: fileName,
          type: 'FILE',
          fileName: fileName,
          filePath: filePath,
          mimeType: mimeType,
          status: 'PROCESSING',
          userId: user.id,
        }
      });
      
      if (process.env.NODE_ENV === 'development') { console.log(`✅ Created new knowledge item: ${knowledgeItem.id}`); }
    }

    // Update status to processing if not already
    if (knowledgeItem.status !== 'PROCESSING') {
      await prisma.knowledgeItem.update({
        where: { id: knowledgeItem.id },
        data: { status: 'PROCESSING' }
      });
    }

    // Prepare request for Edge Function
    const edgeRequest = {
      knowledgeItemId: knowledgeItem.id
    };

    // Get the Supabase project URL for Edge Functions
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl) {
      throw new Error('Supabase URL not configured');
    }

    // Call the Edge Function
    const edgeFunctionUrl = `${supabaseUrl}/functions/v1/file-processor`;
    
    if (process.env.NODE_ENV === 'development') { console.log('🚀 Calling Edge Function for file processing:', fileName); }
    
    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify(edgeRequest)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Edge Function failed:', errorText);
      
      // Update knowledge item status to failed
      await prisma.knowledgeItem.update({
        where: { id: knowledgeItemId },
        data: { status: 'ERROR' }
      });
      
      throw new Error(`Edge Function failed: ${response.status} ${errorText}`);
    }

    const result: EdgeFunctionResponse = await response.json();
    
    if (process.env.NODE_ENV === 'development') { console.log('✅ Edge Function completed:', result); }

    if (result.success) {
      // Update knowledge item status to ready
      await prisma.knowledgeItem.update({
        where: { id: knowledgeItemId },
        data: { status: 'READY' }
      });

      return NextResponse.json({
        message: 'File processed successfully with Edge Function',
        result: {
          knowledgeItemId,
          fileName,
          chunksCreated: result.chunksCreated,
          embeddingsGenerated: result.embeddingsGenerated,
          processingTime: result.processingTime,
          success: true
        }
      });
    } else {
      // Update knowledge item status to failed
      await prisma.knowledgeItem.update({
        where: { id: knowledgeItemId },
        data: { status: 'ERROR' }
      });

      return NextResponse.json(
        { 
          error: 'Edge Function processing failed',
          details: result.errors 
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ Edge Function processing error:', error);
    return ApiErrorHandler.handleError(error, context);
  }
}

// GET /api/knowledge/process-with-edge - Get status
export async function GET(request: NextRequest) {
  const context = ApiErrorHandler.createContext(request);
  
  try {
    const { searchParams } = new URL(request.url);
    const knowledgeItemId = searchParams.get('id');
    
    if (!knowledgeItemId) {
      return NextResponse.json(
        { error: 'Knowledge item ID required' },
        { status: 400 }
      );
    }

    // Verify authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get knowledge item with chunks
    const knowledgeItem = await prisma.knowledgeItem.findFirst({
      where: {
        id: knowledgeItemId,
        userId: user.id
      },
      include: {
        chunks: {
          select: {
            id: true,
            chunkIndex: true,
            createdAt: true,
            embeddingData: true
          },
          orderBy: {
            chunkIndex: 'asc'
          }
        }
      }
    });

    if (!knowledgeItem) {
      return NextResponse.json(
        { error: 'Knowledge item not found' },
        { status: 404 }
      );
    }

    const chunksWithEmbeddings = knowledgeItem.chunks.filter(chunk => chunk.embeddingData);

    return NextResponse.json({
      id: knowledgeItem.id,
      fileName: knowledgeItem.fileName,
      status: knowledgeItem.status,
      createdAt: knowledgeItem.createdAt,
      updatedAt: knowledgeItem.updatedAt,
      totalChunks: knowledgeItem.chunks.length,
      chunksWithEmbeddings: chunksWithEmbeddings.length,
      processingComplete: knowledgeItem.status === 'READY' || knowledgeItem.status === 'ERROR'
    });

  } catch (error) {
    console.error('❌ Status check error:', error);
    return ApiErrorHandler.handleError(error, context);
  }
}
