#!/usr/bin/env node

/**
 * Knowledge Base Re-processing Script
 * 
 * This script re-processes all existing documents in the knowledge base
 * using the new Supabase Edge Function for improved performance and reliability.
 * 
 * Usage: npm run reprocess-kb
 */

const { createClient } = require('@supabase/supabase-js');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

// Initialize clients
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const prisma = new PrismaClient();

/**
 * Clear all existing knowledge chunks to avoid duplication
 */
async function clearExistingChunks() {
  console.log('🧹 Clearing existing knowledge chunks...');
  
  try {
    // Delete all knowledge chunks
    const deletedChunks = await prisma.knowledgeChunk.deleteMany({});
    console.log(`✅ Deleted ${deletedChunks.count} existing knowledge chunks`);
    
    // TODO: If using Neo4j, add graph database clearing here
    // Example:
    // await clearGraphDatabase();
    
  } catch (error) {
    console.error('❌ Error clearing existing chunks:', error);
    throw error;
  }
}

/**
 * Clear Neo4j graph database (if applicable)
 * Uncomment and modify if you're using Neo4j
 */
/*
async function clearGraphDatabase() {
  console.log('🧹 Clearing Neo4j graph database...');
  
  try {
    // Add your Neo4j clearing logic here
    // Example:
    // const session = driver.session();
    // await session.run('MATCH (n) DETACH DELETE n');
    // await session.close();
    
    console.log('✅ Cleared Neo4j graph database');
  } catch (error) {
    console.error('❌ Error clearing graph database:', error);
    throw error;
  }
}
*/

/**
 * Fetch all knowledge items from the database
 */
async function fetchAllKnowledgeItems() {
  console.log('📋 Fetching all knowledge items...');
  
  const items = await prisma.knowledgeItem.findMany({
    where: {
      OR: [
        // File-based items
        {
          type: 'FILE',
          filePath: { not: null }
        },
        // Text-based items with content
        {
          type: 'TEXT',
          content: { not: null }
        }
      ]
    },
    orderBy: {
      createdAt: 'asc'
    }
  });
  
  console.log(`📊 Found ${items.length} knowledge items to process`);
  console.log(`   📁 FILE items: ${items.filter(i => i.type === 'FILE').length}`);
  console.log(`   📝 TEXT items: ${items.filter(i => i.type === 'TEXT').length}`);
  
  return items;
}

/**
 * Process a single knowledge item using the Edge Function or direct processing
 */
async function processKnowledgeItem(item, index, total) {
  console.log(`\n🔄 Processing ${index + 1}/${total}: "${item.title}"`);
  console.log(`   📋 Type: ${item.type}`);
  
  if (item.type === 'FILE') {
    console.log(`   📁 File: ${item.fileName || 'Unknown'}`);
    console.log(`   📍 Path: ${item.filePath}`);
  } else {
    console.log(`   📝 Content length: ${item.content?.length || 0} characters`);
  }
  
  try {
    // Update status to processing
    await prisma.knowledgeItem.update({
      where: { id: item.id },
      data: { status: 'PROCESSING' }
    });
    
    if (item.type === 'FILE' && item.filePath) {
      // Process file-based items using Edge Function
      return await processFileItem(item);
    } else if (item.type === 'TEXT' && item.content) {
      // Process text-based items using direct content processing
      return await processTextItem(item);
    } else {
      console.log(`   ⏭️ Skipping - no content to process`);
      return { success: true, skipped: true };
    }
    
  } catch (error) {
    console.error(`   ❌ Unexpected error:`, error);
    
    try {
      // Update status to error
      await prisma.knowledgeItem.update({
        where: { id: item.id },
        data: { status: 'ERROR' }
      });
    } catch (updateError) {
      console.error(`   ❌ Failed to update status:`, updateError);
    }
    
    return { success: false, error: error.message };
  }
}

/**
 * Process a file-based knowledge item using the Edge Function
 */
async function processFileItem(item) {
  // Call the Edge Function
  const { data, error } = await supabase.functions.invoke('file-processor', {
    body: {
      filePath: item.filePath,
      fileName: item.fileName || `document-${item.id}`,
      mimeType: item.mimeType || 'application/octet-stream',
      userId: 'system-reprocess',
      knowledgeItemId: item.id
    }
  });
  
  if (error) {
    console.error(`   ❌ Edge Function error:`, error);
    
    // Update status to error
    await prisma.knowledgeItem.update({
      where: { id: item.id },
      data: { status: 'ERROR' }
    });
    
    return { success: false, error: error.message || 'Edge Function failed' };
  }
  
  if (!data?.success) {
    const errorMsg = data?.errors?.join(', ') || 'Unknown processing error';
    console.error(`   ❌ Processing failed:`, errorMsg);
    
    // Update status to error
    await prisma.knowledgeItem.update({
      where: { id: item.id },
      data: { status: 'ERROR' }
    });
    
    return { success: false, error: errorMsg };
  }
  
  // Update status to ready
  await prisma.knowledgeItem.update({
    where: { id: item.id },
    data: { status: 'READY' }
  });
  
  console.log(`   ✅ Success! Created ${data.chunksCreated} chunks, ${data.embeddingsGenerated} embeddings in ${data.processingTime}ms`);
  
  return { success: true, result: data };
}

/**
 * Process a text-based knowledge item by creating chunks and embeddings directly
 */
async function processTextItem(item) {
  console.log(`   🔄 Processing text content directly...`);
  
  try {
    // Import required modules
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY environment variable is not set.");
    }
    
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // Clean and prepare content
    const content = item.content.trim();
    if (!content || content.length < 50) {
      console.log(`   ⏭️ Skipping - content too short (${content.length} chars)`);
      return { success: true, skipped: true };
    }
    
    console.log(`   📝 Processing ${content.length} characters of content...`);
    
    // Simple chunking function for text content
    function createSimpleChunks(text, maxChunkSize = 1000) {
      // Clean HTML and special characters
      let cleanText = text
        .replace(/<[^>]*>/g, ' ')  // Remove HTML tags
        .replace(/&[^;]+;/g, ' ')  // Remove HTML entities
        .replace(/\s+/g, ' ')      // Replace multiple whitespace with single space
        .trim();
      
      const chunks = [];
      const sentences = cleanText.split(/[.!?]+/).filter(s => s.trim().length > 0);
      let currentChunk = '';
      
      for (const sentence of sentences) {
        const cleanSentence = sentence.trim();
        if (currentChunk.length + cleanSentence.length > maxChunkSize && currentChunk.length > 0) {
          chunks.push(currentChunk.trim());
          currentChunk = cleanSentence;
        } else {
          currentChunk += (currentChunk ? '. ' : '') + cleanSentence;
        }
      }
      
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
      }
      
      return chunks.map((chunk, index) => ({ 
        content: chunk,
        index,
        metadata: { title: item.title || `Chunk ${index + 1}` }
      }));
    }
    
    // Create chunks
    const chunks = createSimpleChunks(content);
    
    console.log(`   📦 Created ${chunks.length} chunks`);
    
    if (chunks.length === 0) {
      console.log(`   ⏭️ No chunks created, marking as ready`);
      await prisma.knowledgeItem.update({
        where: { id: item.id },
        data: { status: 'READY' }
      });
      return { success: true, skipped: true };
    }
    
    // Generate embeddings for chunks
    console.log(`   🧠 Generating embeddings...`);
    const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
    
    const chunksCreated = [];
    let embeddingsGenerated = 0;
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      try {
        // Generate embedding using only the content
        const result = await embeddingModel.embedContent(chunk.content);
        const embedding = JSON.stringify(result.embedding.values);
        
        // Create knowledge chunk
        const knowledgeChunk = await prisma.knowledgeChunk.create({
          data: {
            content: chunk.content,
            embeddingData: embedding,
            chunkIndex: i,
            knowledgeItemId: item.id
          }
        });
        
        chunksCreated.push(knowledgeChunk);
        embeddingsGenerated++;
        
        // Add small delay to avoid rate limiting
        if (i < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
      } catch (error) {
        console.error(`   ❌ Error processing chunk ${i + 1}:`, error);
        // Continue with other chunks
      }
    }
    
    // Update status to ready
    await prisma.knowledgeItem.update({
      where: { id: item.id },
      data: { status: 'READY' }
    });
    
    console.log(`   ✅ Success! Created ${chunksCreated.length} chunks with ${embeddingsGenerated} embeddings`);
    
    return { 
      success: true, 
      result: { 
        chunksCreated: chunksCreated.length, 
        embeddingsGenerated: embeddingsGenerated, 
        processingTime: 0 
      } 
    };
    
  } catch (error) {
    console.error(`   ❌ Text processing error:`, error);
    
    // Update status to error
    await prisma.knowledgeItem.update({
      where: { id: item.id },
      data: { status: 'ERROR' }
    });
    
    return { success: false, error: error.message };
  }
}

/**
 * Add a delay between processing items to avoid overwhelming the system
 */
async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Main processing function
 */
async function reprocessKnowledgeBase() {
  const startTime = Date.now();
  
  console.log('🚀 Starting Knowledge Base Re-processing...');
  console.log('📅 Started at:', new Date().toISOString());
  
  const stats = {
    total: 0,
    processed: 0,
    successful: 0,
    failed: 0,
    skipped: 0,
    errors: []
  };
  
  try {
    // Step 1: Clear existing chunks
    await clearExistingChunks();
    
    // Step 2: Fetch all knowledge items
    const knowledgeItems = await fetchAllKnowledgeItems();
    
    if (knowledgeItems.length === 0) {
      console.log('ℹ️ No knowledge items found to process');
      return;
    }
    
    stats.total = knowledgeItems.length;
    
    // Step 3: Process each item
    console.log('\n🔄 Starting document processing...');
    
    for (let i = 0; i < knowledgeItems.length; i++) {
      const item = knowledgeItems[i];
      
      stats.processed++;
      
      // Process the item
      const result = await processKnowledgeItem(item, i, stats.total);
      
      if (result.success) {
        if (result.skipped) {
          stats.skipped++;
        } else {
          stats.successful++;
        }
      } else {
        stats.failed++;
        stats.errors.push({
          id: item.id,
          title: item.title,
          error: result.error || 'Unknown error'
        });
      }
      
      // Add delay between items to avoid rate limiting
      if (i < knowledgeItems.length - 1) {
        await delay(1000); // 1 second delay
      }
      
      // Progress update every 5 items
      if ((i + 1) % 5 === 0 || i === knowledgeItems.length - 1) {
        const progress = ((i + 1) / stats.total * 100).toFixed(1);
        console.log(`\n📊 Progress: ${progress}% (${i + 1}/${stats.total})`);
        console.log(`   ✅ Successful: ${stats.successful}`);
        console.log(`   ❌ Failed: ${stats.failed}`);
        console.log(`   ⏭️ Skipped: ${stats.skipped}`);
      }
    }
    
  } catch (error) {
    console.error('\n💥 Fatal error during processing:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
  
  // Final report
  const endTime = Date.now();
  const duration = Math.round((endTime - startTime) / 1000);
  
  console.log('\n' + '='.repeat(60));
  console.log('📋 FINAL PROCESSING REPORT');
  console.log('='.repeat(60));
  console.log(`📅 Completed at: ${new Date().toISOString()}`);
  console.log(`⏱️ Total time: ${duration} seconds`);
  console.log(`📊 Total items: ${stats.total}`);
  console.log(`🔄 Processed: ${stats.processed}`);
  console.log(`✅ Successful: ${stats.successful}`);
  console.log(`❌ Failed: ${stats.failed}`);
  console.log(`⏭️ Skipped: ${stats.skipped}`);
  
  if (stats.errors.length > 0) {
    console.log('\n❌ ERRORS:');
    stats.errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error.title} (${error.id})`);
      console.log(`      Error: ${error.error}`);
    });
  }
  
  if (stats.successful === stats.processed && stats.failed === 0) {
    console.log('\n🎉 All documents processed successfully!');
  } else if (stats.successful > 0) {
    console.log('\n⚠️ Partial success - some documents failed to process');
  } else {
    console.log('\n💥 Processing failed for all documents');
  }
  
  console.log('='.repeat(60));
}

/**
 * Error handler for uncaught exceptions
 */
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the script
if (require.main === module) {
  reprocessKnowledgeBase()
    .then(() => {
      console.log('\n✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Script failed:', error);
      process.exit(1);
    });
}
