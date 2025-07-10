import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { processFileWithEmbeddings } from '@/lib/enhanced-file-processor';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';

/**
 * API route for reprocessing existing knowledge items
 * 
 * This endpoint finds knowledge items that lack chunks/embeddings
 * and processes them with the enhanced file processor
 */

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Reprocessing API called');
    
    // Check authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body for options
    const body = await request.json().catch(() => ({}));
    const { 
      limit = 10,
      forceReprocess = false,
      specificItemId = null
    } = body;

    console.log(`🔍 Finding knowledge items to reprocess (limit: ${limit}, force: ${forceReprocess})...`);

    // Find knowledge items that need reprocessing
    let knowledgeItems;
    
    if (specificItemId) {
      // Reprocess a specific item
      knowledgeItems = await prisma.knowledgeItem.findMany({
        where: {
          id: specificItemId,
          userId: user.id
        }
      });
    } else if (forceReprocess) {
      // Reprocess all items (up to limit)
      knowledgeItems = await prisma.knowledgeItem.findMany({
        where: {
          userId: user.id,
          type: 'FILE',
          filePath: { not: null }
        },
        take: limit,
        orderBy: { createdAt: 'desc' }
      });
    } else {
      // Find items without chunks (normal reprocessing)
      knowledgeItems = await prisma.knowledgeItem.findMany({
        where: {
          userId: user.id,
          type: 'FILE',
          filePath: { not: null },
          chunks: {
            none: {}
          }
        },
        take: limit,
        orderBy: { createdAt: 'desc' }
      });
    }

    if (knowledgeItems.length === 0) {
      return NextResponse.json({
        message: 'No knowledge items found that need reprocessing',
        processed: [],
        skipped: []
      });
    }

    console.log(`📄 Found ${knowledgeItems.length} items to reprocess`);

    const processed = [];
    const skipped = [];

    for (const item of knowledgeItems) {
      console.log(`🔄 Processing: ${item.title} (${item.id})`);

      try {
        // Check if file still exists
        if (!item.filePath || !existsSync(item.filePath)) {
          console.log(`⚠️ File not found for ${item.title}: ${item.filePath}`);
          skipped.push({
            id: item.id,
            title: item.title,
            reason: 'File not found on disk'
          });
          continue;
        }

        // Read file from disk
        const fileBuffer = await readFile(item.filePath);

        // Update status to PROCESSING
        await prisma.knowledgeItem.update({
          where: { id: item.id },
          data: { status: 'PROCESSING' }
        });

        // If force reprocessing, delete existing chunks first
        if (forceReprocess) {
          await prisma.knowledgeChunk.deleteMany({
            where: { knowledgeItemId: item.id }
          });
        }

        // Process with enhanced processor
        const processingResult = await processFileWithEmbeddings(
          fileBuffer,
          item.mimeType || 'application/octet-stream',
          item.fileName || item.title,
          item.id,
          {
            generateEmbeddings: true,
            chunkSize: 512,      // Updated to improved chunking parameters
            chunkOverlap: 100,   // Updated to improved chunking parameters
            batchSize: 5
          }
        );

        processed.push({
          id: item.id,
          title: item.title,
          success: processingResult.success,
          chunksCreated: processingResult.chunksCreated,
          embeddingsGenerated: processingResult.embeddingsGenerated,
          processingTime: processingResult.processingTime,
          warnings: processingResult.warnings,
          errors: processingResult.errors
        });

        console.log(`✅ Reprocessed: ${item.title} (${processingResult.chunksCreated} chunks, ${processingResult.embeddingsGenerated} embeddings)`);

      } catch (error) {
        console.error(`❌ Failed to reprocess ${item.title}:`, error);
        
        // Update status to ERROR
        try {
          await prisma.knowledgeItem.update({
            where: { id: item.id },
            data: { status: 'ERROR' }
          });
        } catch (updateError) {
          console.error('Failed to update status to ERROR:', updateError);
        }

        skipped.push({
          id: item.id,
          title: item.title,
          reason: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const summary = {
      totalFound: knowledgeItems.length,
      processed: processed.length,
      skipped: skipped.length,
      successfulProcessing: processed.filter(p => p.success).length
    };

    console.log(`🎉 Reprocessing complete:`, summary);

    return NextResponse.json({
      message: `Reprocessing complete: ${summary.successfulProcessing}/${summary.totalFound} items successfully processed`,
      summary,
      processed,
      skipped: skipped.length > 0 ? skipped : undefined
    });

  } catch (error) {
    console.error('❌ Reprocessing API error:', error);
    return NextResponse.json(
      { error: 'Failed to reprocess items: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

// GET - Check reprocessing status
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Count knowledge items by processing status
    const [
      totalItems,
      itemsWithChunks,
      processingItems,
      errorItems,
      itemsWithoutFiles
    ] = await Promise.all([
      prisma.knowledgeItem.count({
        where: { userId: user.id, type: 'FILE' }
      }),
      prisma.knowledgeItem.count({
        where: {
          userId: user.id,
          type: 'FILE',
          chunks: { some: {} }
        }
      }),
      prisma.knowledgeItem.count({
        where: { userId: user.id, status: 'PROCESSING' }
      }),
      prisma.knowledgeItem.count({
        where: { userId: user.id, status: 'ERROR' }
      }),
      prisma.knowledgeItem.count({
        where: {
          userId: user.id,
          type: 'FILE',
          OR: [
            { filePath: null },
            { filePath: '' }
          ]
        }
      })
    ]);

    const needsReprocessing = totalItems - itemsWithChunks - itemsWithoutFiles;

    return NextResponse.json({
      statistics: {
        totalItems,
        itemsWithChunks,
        needsReprocessing,
        processingItems,
        errorItems,
        itemsWithoutFiles
      },
      canReprocess: needsReprocessing > 0 || errorItems > 0
    });

  } catch (error) {
    console.error('❌ Reprocessing status API error:', error);
    return NextResponse.json(
      { error: 'Failed to get reprocessing status: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
