/**
 * Enhanced file processing with chunking and vector embeddings
 * 
 * This module extends the basic file processing to include text chunking
 * and vector embedding generation for semantic search capabilities.
 */

import { extractTextFromFile } from './file-processor';
import { chunkFitnessContent, validateChunks, type TextChunk } from './text-chunking';
import { generateEmbeddingsBatch } from './vector-embeddings';
import { storeEmbedding } from './vector-search';
import { prisma } from './prisma';

export interface ProcessingResult {
  success: boolean;
  knowledgeItemId: string;
  chunksCreated: number;
  embeddingsGenerated: number;
  processingTime: number;
  errors: string[];
  warnings: string[];
}

export interface ProcessingOptions {
  generateEmbeddings: boolean;
  chunkSize: number;
  chunkOverlap: number;
  batchSize: number;
}

const DEFAULT_PROCESSING_OPTIONS: ProcessingOptions = {
  generateEmbeddings: true,
  chunkSize: 512,      // Updated to improved chunking parameters
  chunkOverlap: 100,   // Updated to improved chunking parameters
  batchSize: 10
};

/**
 * Process a file with chunking and embedding generation
 * 
 * @param fileBuffer File buffer
 * @param mimeType File MIME type
 * @param fileName File name
 * @param knowledgeItemId Knowledge item ID
 * @param options Processing options
 * @returns Promise<ProcessingResult>
 */
export async function processFileWithEmbeddings(
  fileBuffer: Buffer,
  mimeType: string,
  fileName: string,
  knowledgeItemId: string,
  options: Partial<ProcessingOptions> = {}
): Promise<ProcessingResult> {
  const startTime = Date.now();
  const opts = { ...DEFAULT_PROCESSING_OPTIONS, ...options };
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    console.log(`🔄 Processing file with embeddings: ${fileName}`);

    // Step 1: Extract text from file
    const extractedText = await extractTextFromFile(fileBuffer, mimeType, fileName);
    
    if (!extractedText || extractedText.trim().length === 0) {
      return {
        success: false,
        knowledgeItemId,
        chunksCreated: 0,
        embeddingsGenerated: 0,
        processingTime: Date.now() - startTime,
        errors: ['No text content could be extracted from the file'],
        warnings: []
      };
    }

    // Handle special cases where text extraction failed but file was saved
    if (extractedText.includes('[PDF file uploaded successfully but text extraction failed') ||
        extractedText.includes('[Unable to extract text from PDF') ||
        extractedText.includes('[File type') && extractedText.includes('is not supported')) {
      
      warnings.push('Text extraction was limited - document saved for viewing only');
      
      // Create a single chunk with the message for completeness
      await prisma.knowledgeChunk.create({
        data: {
          knowledgeItemId,
          content: extractedText,
          chunkIndex: 0,
          embeddingData: null // No embedding for non-text content
        }
      });

      return {
        success: true,
        knowledgeItemId,
        chunksCreated: 1,
        embeddingsGenerated: 0,
        processingTime: Date.now() - startTime,
        errors: [],
        warnings
      };
    }

    // Step 2: Chunk the text
    console.log(`📄 Chunking text (${extractedText.length} characters)...`);
    const chunks = chunkFitnessContent(extractedText);
    
    if (chunks.length === 0) {
      errors.push('Text chunking failed - no chunks were created');
      return {
        success: false,
        knowledgeItemId,
        chunksCreated: 0,
        embeddingsGenerated: 0,
        processingTime: Date.now() - startTime,
        errors,
        warnings
      };
    }

    console.log(`✂️ Created ${chunks.length} chunks`);

    // Step 3: Validate chunks
    const validation = validateChunks(chunks);
    warnings.push(...validation.warnings);

    if (!validation.isValid) {
      console.log('⚠️ Chunk validation warnings:', validation.warnings);
    }

    // Step 4: Create knowledge chunks in database
    console.log('💾 Saving chunks to database...');
    const knowledgeChunks = await createKnowledgeChunks(knowledgeItemId, chunks);
    
    if (knowledgeChunks.length === 0) {
      errors.push('Failed to save chunks to database');
      return {
        success: false,
        knowledgeItemId,
        chunksCreated: 0,
        embeddingsGenerated: 0,
        processingTime: Date.now() - startTime,
        errors,
        warnings
      };
    }

    let embeddingsGenerated = 0;

    // Step 5: Generate embeddings if enabled
    if (opts.generateEmbeddings) {
      console.log('🧠 Generating embeddings...');
      embeddingsGenerated = await generateAndStoreEmbeddings(
        knowledgeChunks,
        opts.batchSize
      );

      if (embeddingsGenerated < knowledgeChunks.length) {
        warnings.push(`Only ${embeddingsGenerated}/${knowledgeChunks.length} embeddings were generated successfully`);
      }
    }

    // Step 6: Update knowledge item status
    await prisma.knowledgeItem.update({
      where: { id: knowledgeItemId },
      data: { status: 'READY' }
    });

    const processingTime = Date.now() - startTime;
    console.log(`✅ Processing complete in ${processingTime}ms`);

    return {
      success: true,
      knowledgeItemId,
      chunksCreated: knowledgeChunks.length,
      embeddingsGenerated,
      processingTime,
      errors,
      warnings
    };

  } catch (error) {
    console.error('❌ Error processing file with embeddings:', error);
    
    // Try to update status to ERROR
    try {
      await prisma.knowledgeItem.update({
        where: { id: knowledgeItemId },
        data: { status: 'ERROR' }
      });
    } catch (updateError) {
      console.error('Failed to update knowledge item status:', updateError);
    }

    return {
      success: false,
      knowledgeItemId,
      chunksCreated: 0,
      embeddingsGenerated: 0,
      processingTime: Date.now() - startTime,
      errors: [error instanceof Error ? error.message : 'Unknown error during processing'],
      warnings
    };
  }
}

/**
 * Create knowledge chunks in the database
 * 
 * @param knowledgeItemId Knowledge item ID
 * @param chunks Text chunks
 * @returns Promise<Array<{id: string, content: string, chunkIndex: number}>>
 */
async function createKnowledgeChunks(
  knowledgeItemId: string,
  chunks: TextChunk[]
): Promise<Array<{ id: string; content: string; chunkIndex: number }>> {
  try {
    const chunkData = chunks.map(chunk => ({
      knowledgeItemId,
      content: chunk.content,
      chunkIndex: chunk.index,
      embeddingData: null
    }));

    // Use createMany for better performance
    await prisma.knowledgeChunk.createMany({
      data: chunkData
    });

    // Fetch the created chunks with their IDs
    const createdChunks = await prisma.knowledgeChunk.findMany({
      where: { knowledgeItemId },
      select: { id: true, content: true, chunkIndex: true },
      orderBy: { chunkIndex: 'asc' }
    });

    return createdChunks;

  } catch (error) {
    console.error('Error creating knowledge chunks:', error);
    throw new Error(`Failed to create knowledge chunks: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate and store embeddings for knowledge chunks
 * 
 * @param chunks Knowledge chunks
 * @param batchSize Batch size for embedding generation
 * @returns Promise<number> Number of embeddings successfully generated
 */
async function generateAndStoreEmbeddings(
  chunks: Array<{ id: string; content: string; chunkIndex: number }>,
  batchSize: number = 10
): Promise<number> {
  let successCount = 0;

  try {
    // Extract texts for embedding generation
    const texts = chunks.map(chunk => chunk.content);
    const metadata = chunks.map(chunk => ({
      chunkId: chunk.id,
      chunkIndex: chunk.chunkIndex
    }));

    console.log(`🔄 Generating embeddings for ${texts.length} chunks...`);

    // Generate embeddings in batches
    const embeddingResults = await generateEmbeddingsBatch(texts, metadata, batchSize);

    // Store embeddings
    for (let i = 0; i < embeddingResults.length; i++) {
      const result = embeddingResults[i];
      const chunk = chunks[i];

      if (result.metadata?.error) {
        console.warn(`⚠️ Skipping embedding for chunk ${chunk.id}: ${result.metadata.error}`);
        continue;
      }

      try {
        await storeEmbedding(chunk.id, result.embedding);
        successCount++;
      } catch (storeError) {
        console.error(`❌ Failed to store embedding for chunk ${chunk.id}:`, storeError);
      }

      // Progress logging
      if (i % 10 === 0 || i === embeddingResults.length - 1) {
        console.log(`📊 Embedding progress: ${i + 1}/${embeddingResults.length}`);
      }
    }

    console.log(`✅ Successfully generated and stored ${successCount} embeddings`);

  } catch (error) {
    console.error('❌ Error generating embeddings:', error);
  }

  return successCount;
}

/**
 * Reprocess an existing knowledge item with embeddings
 * 
 * @param knowledgeItemId Knowledge item ID
 * @param options Processing options
 * @returns Promise<ProcessingResult>
 */
export async function reprocessWithEmbeddings(
  knowledgeItemId: string,
  options: Partial<ProcessingOptions> = {}
): Promise<ProcessingResult> {
  const startTime = Date.now();

  try {
    // Get the existing knowledge item
    const knowledgeItem = await prisma.knowledgeItem.findUnique({
      where: { id: knowledgeItemId },
      select: { content: true, fileName: true, status: true }
    });

    if (!knowledgeItem) {
      return {
        success: false,
        knowledgeItemId,
        chunksCreated: 0,
        embeddingsGenerated: 0,
        processingTime: Date.now() - startTime,
        errors: ['Knowledge item not found'],
        warnings: []
      };
    }

    if (!knowledgeItem.content) {
      return {
        success: false,
        knowledgeItemId,
        chunksCreated: 0,
        embeddingsGenerated: 0,
        processingTime: Date.now() - startTime,
        errors: ['No content available for reprocessing'],
        warnings: []
      };
    }

    console.log(`🔄 Reprocessing knowledge item: ${knowledgeItem.fileName || 'Unknown'}`);

    // Delete existing chunks
    await prisma.knowledgeChunk.deleteMany({
      where: { knowledgeItemId }
    });

    // Set status to processing
    await prisma.knowledgeItem.update({
      where: { id: knowledgeItemId },
      data: { status: 'PROCESSING' }
    });

    // Process the content as if it's a text file
    const fakeBuffer = Buffer.from(knowledgeItem.content, 'utf-8');
    
    return await processFileWithEmbeddings(
      fakeBuffer,
      'text/plain',
      knowledgeItem.fileName || 'reprocessed-content.txt',
      knowledgeItemId,
      options
    );

  } catch (error) {
    console.error('❌ Error reprocessing with embeddings:', error);

    return {
      success: false,
      knowledgeItemId,
      chunksCreated: 0,
      embeddingsGenerated: 0,
      processingTime: Date.now() - startTime,
      errors: [error instanceof Error ? error.message : 'Unknown error during reprocessing'],
      warnings: []
    };
  }
}

/**
 * Get processing statistics for a knowledge item
 * 
 * @param knowledgeItemId Knowledge item ID
 * @returns Promise<object> Processing statistics
 */
export async function getProcessingStats(knowledgeItemId: string): Promise<{
  status: string;
  totalChunks: number;
  chunksWithEmbeddings: number;
  avgChunkSize: number;
  processingComplete: boolean;
  embeddingCoverage: number;
}> {
  try {
    const knowledgeItem = await prisma.knowledgeItem.findUnique({
      where: { id: knowledgeItemId },
      include: {
        chunks: {
          select: {
            content: true,
            embeddingData: true
          }
        }
      }
    });

    if (!knowledgeItem) {
      return {
        status: 'NOT_FOUND',
        totalChunks: 0,
        chunksWithEmbeddings: 0,
        avgChunkSize: 0,
        processingComplete: false,
        embeddingCoverage: 0
      };
    }

    const totalChunks = knowledgeItem.chunks.length;
    const chunksWithEmbeddings = knowledgeItem.chunks.filter(
      chunk => chunk.embeddingData !== null
    ).length;
    
    const avgChunkSize = totalChunks > 0
      ? Math.round(
          knowledgeItem.chunks.reduce((sum, chunk) => sum + chunk.content.length, 0) / totalChunks
        )
      : 0;

    const embeddingCoverage = totalChunks > 0 ? chunksWithEmbeddings / totalChunks : 0;
    const processingComplete = knowledgeItem.status === 'READY';

    return {
      status: knowledgeItem.status,
      totalChunks,
      chunksWithEmbeddings,
      avgChunkSize,
      processingComplete,
      embeddingCoverage: Math.round(embeddingCoverage * 100) / 100
    };

  } catch (error) {
    console.error('Error getting processing stats:', error);
    return {
      status: 'ERROR',
      totalChunks: 0,
      chunksWithEmbeddings: 0,
      avgChunkSize: 0,
      processingComplete: false,
      embeddingCoverage: 0
    };
  }
}
