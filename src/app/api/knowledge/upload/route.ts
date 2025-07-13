import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { extractTextFromFile, isFileTypeSupported, getMaxFileSize } from '@/lib/file-processor';
import { processFileWithEmbeddings, type ProcessingResult } from '@/lib/enhanced-file-processor';
import { 
  canUserUploadFile, 
  canUserCreateKnowledgeItem, 
  incrementUserUploadCount 
} from '@/lib/subscription';

interface ProcessFileRequest {
  filePath: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

// POST - Process uploaded files from Supabase Storage
export async function POST(request: NextRequest) {
  console.log('� Upload processing API called');
  
  try {
    console.log('🔐 Checking authentication...');
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.log('❌ Authentication failed:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('✅ User authenticated:', user.id);

    const body: ProcessFileRequest = await request.json();
    const { filePath, fileName, fileSize, mimeType } = body;

    console.log('📊 Processing file from storage:', fileName);

    if (!filePath || !fileName || !fileSize || !mimeType) {
      console.log('❌ Missing required fields');
      return NextResponse.json(
        { error: 'filePath, fileName, fileSize, and mimeType are required' },
        { status: 400 }
      );
    }    console.log('💾 Ensuring user exists in database...');
    // Ensure user exists in our database
    await prisma.user.upsert({
      where: { id: user.id },
      update: {},
      create: { id: user.id }
    });

    // Check subscription limits before processing
    console.log('🔒 Checking subscription limits...');
    
    const fileSizeInMB = fileSize / (1024 * 1024);
    
    // Check upload limits
    const uploadCheck = await canUserUploadFile(fileSizeInMB);
    if (!uploadCheck.canUpload) {
      console.log('❌ Upload not allowed:', uploadCheck.reason);
      return NextResponse.json({ 
        error: uploadCheck.reason,
        upgradeRequired: true,
        maxFileSize: uploadCheck.maxFileSize,
        uploadsRemaining: uploadCheck.uploadsRemaining
      }, { status: 429 }); // Too Many Requests
    }
    
    // Check knowledge item limits
    const knowledgeCheck = await canUserCreateKnowledgeItem();
    if (!knowledgeCheck.canCreate) {
      console.log('❌ Knowledge item creation not allowed:', knowledgeCheck.reason);
      return NextResponse.json({ 
        error: knowledgeCheck.reason,
        upgradeRequired: true,
        itemsRemaining: knowledgeCheck.itemsRemaining
      }, { status: 429 }); // Too Many Requests
    }

    console.log('✅ Subscription limits OK');

    // Validate file size against plan limits (double check)
    const maxSize = getMaxFileSize();
    if (fileSize > maxSize) {
      const reason = `File size ${Math.round(fileSize / 1024 / 1024)}MB exceeds the ${Math.round(maxSize / 1024 / 1024)}MB limit`;
      console.log(`⚠️ File ${fileName}: ${reason}`);
      return NextResponse.json({ error: reason }, { status: 400 });
    }

    // Validate file type
    if (!isFileTypeSupported(mimeType)) {
      const reason = `File type ${mimeType} is not supported`;
      console.log(`⚠️ File ${fileName}: ${reason}`);
      return NextResponse.json({ error: reason }, { status: 400 });
    }

    try {
      console.log(`📥 Downloading file from storage: ${filePath}`);
      
      // Download file from Supabase Storage
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('knowledge-files')
        .download(filePath);

      if (downloadError) {
        console.error('❌ Failed to download file from storage:', downloadError);
        return NextResponse.json(
          { error: 'Failed to download file from storage' },
          { status: 500 }
        );
      }

      // Convert blob to buffer
      const buffer = Buffer.from(await fileData.arrayBuffer());
      console.log(`✅ File downloaded successfully, size: ${buffer.length} bytes`);

      // Create knowledge item in database first (with PROCESSING status)
      const knowledgeItem = await prisma.knowledgeItem.create({
        data: {
          title: fileName,
          type: 'FILE',
          content: null, // Will be populated during processing
          fileName: fileName,
          fileSize: fileSize,
          filePath: filePath, // Store Supabase Storage path
          mimeType: mimeType,
          status: 'PROCESSING',
          userId: user.id,
        }
      });

      console.log(`🔄 Processing file with embeddings: ${fileName}`);

      // Process file with enhanced processor (includes chunking and embeddings)
      const processingResult: ProcessingResult = await processFileWithEmbeddings(
        buffer,
        mimeType,
        fileName,
        knowledgeItem.id,
        {
          generateEmbeddings: true,
          chunkSize: 512,        // Updated to use improved chunking
          chunkOverlap: 100,     // Updated to use improved chunking
          batchSize: 5 // Smaller batch size for API
        }
      );

      // Update the knowledge item with the extracted content
      if (processingResult.success) {
        // Extract text for content field (for backward compatibility)
        const content = await extractTextFromFile(buffer, mimeType, fileName);
        
        await prisma.knowledgeItem.update({
          where: { id: knowledgeItem.id },
          data: { 
            content: content,
            status: 'READY'
          }
        });

        console.log(`✅ Successfully processed: ${fileName} (${processingResult.chunksCreated} chunks, ${processingResult.embeddingsGenerated} embeddings)`);
        
        // Increment user's upload count for subscription tracking
        try {
          await incrementUserUploadCount();
          console.log('📊 User upload count incremented');
        } catch (error) {
          console.warn('⚠️ Failed to increment upload count:', error);
          // Don't fail the entire request for this
        }
        
        const result = {
          ...knowledgeItem,
          content: content,
          status: 'READY' as const,
          processingResult: {
            chunksCreated: processingResult.chunksCreated,
            embeddingsGenerated: processingResult.embeddingsGenerated,
            processingTime: processingResult.processingTime,
            warnings: processingResult.warnings
          }
        };

        return NextResponse.json({ 
          message: `Successfully processed ${fileName}`,
          knowledgeItem: result
        });
      } else {
        console.error(`❌ Processing failed for ${fileName}:`, processingResult.errors);
        
        // Still add the item but mark processing issues
        const content = await extractTextFromFile(buffer, mimeType, fileName);
        
        await prisma.knowledgeItem.update({
          where: { id: knowledgeItem.id },
          data: { 
            content: content,
            status: 'ERROR'
          }
        });

        const result = {
          ...knowledgeItem,
          content: content,
          status: 'ERROR' as const,
          processingResult: {
            chunksCreated: processingResult.chunksCreated,
            embeddingsGenerated: processingResult.embeddingsGenerated,
            processingTime: processingResult.processingTime,
            warnings: processingResult.warnings,
            errors: processingResult.errors
          }
        };

        return NextResponse.json({ 
          message: `Processed ${fileName} with errors`,
          knowledgeItem: result,
          errors: processingResult.errors
        });
      }
    } catch (fileError) {
      console.error(`❌ Error processing file ${fileName}:`, fileError);
      return NextResponse.json({ 
        error: `Processing error: ${(fileError as Error).message}` 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('❌ Upload processing API error:', error);
    return NextResponse.json(
      { error: 'Failed to process file: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
