import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { extractTextFromFile, isFileTypeSupported, getMaxFileSize } from '@/lib/file-processor';
import { processFileWithEmbeddings, type ProcessingResult } from '@/lib/enhanced-file-processor';

// POST - Upload and process files
export async function POST(request: NextRequest) {
  console.log('📁 Upload API called');
  
  try {
    console.log('🔐 Checking authentication...');
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.log('❌ Authentication failed:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('✅ User authenticated:', user.id);

    console.log('📤 Parsing form data...');
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    console.log('📊 Files received:', files.length);

    if (!files || files.length === 0) {
      console.log('❌ No files provided');
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }    console.log('💾 Ensuring user exists in database...');
    // Ensure user exists in our database
    await prisma.user.upsert({
      where: { id: user.id },
      update: {},
      create: { id: user.id }
    });    const uploadedItems = [];
    const skippedFiles = [];

    console.log('📁 Processing files in memory (serverless-compatible)...');

    console.log('🔄 Processing files...');
    for (const file of files) {
      console.log(`📄 Processing file: ${file.name} (${file.type}, ${file.size} bytes)`);
      
      // Validate file size
      const maxSize = getMaxFileSize();
      if (file.size > maxSize) {
        const reason = `File size ${Math.round(file.size / 1024 / 1024)}MB exceeds the ${Math.round(maxSize / 1024 / 1024)}MB limit`;
        console.log(`⚠️ Skipping file ${file.name}: ${reason}`);
        skippedFiles.push({ name: file.name, reason });
        continue;
      }

      // Validate file type
      if (!isFileTypeSupported(file.type)) {
        const reason = `File type ${file.type} is not supported`;
        console.log(`⚠️ Skipping file ${file.name}: ${reason}`);
        skippedFiles.push({ name: file.name, reason });
        continue;
      }

      try {
        console.log(`� Processing file in memory: ${file.name}`);
        
        // Get file buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Create knowledge item in database first (with PROCESSING status)
        const knowledgeItem = await prisma.knowledgeItem.create({
          data: {
            title: file.name,
            type: 'FILE',
            content: null, // Will be populated during processing
            fileName: file.name,
            fileSize: file.size,
            filePath: null, // No file path in serverless mode
            mimeType: file.type,
            status: 'PROCESSING',
            userId: user.id,
          }
        });

        // Process file with enhanced processor (includes chunking and embeddings)
        const processingResult: ProcessingResult = await processFileWithEmbeddings(
          buffer,
          file.type,
          file.name,
          knowledgeItem.id,
          {
            generateEmbeddings: true,
            chunkSize: 800,
            chunkOverlap: 150,
            batchSize: 5 // Smaller batch size for API
          }
        );

        // Update the knowledge item with the extracted content
        if (processingResult.success) {
          // Extract text for content field (for backward compatibility)
          const content = await extractTextFromFile(buffer, file.type, file.name);
          
          await prisma.knowledgeItem.update({
            where: { id: knowledgeItem.id },
            data: { 
              content: content,
              status: 'READY'
            }
          });

          console.log(`✅ Successfully processed: ${file.name} (${processingResult.chunksCreated} chunks, ${processingResult.embeddingsGenerated} embeddings)`);
          
          uploadedItems.push({
            ...knowledgeItem,
            content: content,
            status: 'READY' as const,
            processingResult: {
              chunksCreated: processingResult.chunksCreated,
              embeddingsGenerated: processingResult.embeddingsGenerated,
              processingTime: processingResult.processingTime,
              warnings: processingResult.warnings
            }
          });
        } else {
          console.error(`❌ Processing failed for ${file.name}:`, processingResult.errors);
          
          // Still add the item but mark processing issues
          const content = await extractTextFromFile(buffer, file.type, file.name);
          
          await prisma.knowledgeItem.update({
            where: { id: knowledgeItem.id },
            data: { 
              content: content,
              status: 'ERROR'
            }
          });

          uploadedItems.push({
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
          });
        }
      } catch (fileError) {
        console.error(`❌ Error processing file ${file.name}:`, fileError);
        skippedFiles.push({ 
          name: file.name, 
          reason: `Processing error: ${(fileError as Error).message}` 
        });
      }
    }

    console.log(`🎉 Upload completed. Successfully processed ${uploadedItems.length} file(s), skipped ${skippedFiles.length} file(s)`);
    
    // If no files were processed successfully, return an error
    if (uploadedItems.length === 0) {
      const errorMessage = skippedFiles.length > 0 
        ? `No files could be processed. Issues: ${skippedFiles.map(f => `${f.name}: ${f.reason}`).join('; ')}`
        : 'No files could be processed.';
      
      return NextResponse.json({ 
        error: errorMessage,
        skippedFiles 
      }, { status: 400 });
    }
    
    const responseMessage = uploadedItems.length === files.length
      ? `Successfully uploaded ${uploadedItems.length} file(s)`
      : `Successfully uploaded ${uploadedItems.length} out of ${files.length} file(s)`;
    
    return NextResponse.json({ 
      message: responseMessage,
      knowledgeItems: uploadedItems,
      skippedFiles: skippedFiles.length > 0 ? skippedFiles : undefined
    });
  } catch (error) {
    console.error('❌ Upload API error:', error);
    return NextResponse.json(
      { error: 'Failed to upload files: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
