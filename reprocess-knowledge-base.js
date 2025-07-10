/**
 * Script to re-process knowledge base with improved chunking strategy
 * 
 * This script will re-chunk all existing knowledge items using the new
 * improved chunking parameters for better retrieval performance.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function reprocessKnowledgeBase() {
  console.log('🔄 Re-processing knowledge base with improved chunking...\n');
  
  try {
    // Get all knowledge items that need re-processing
    const knowledgeItems = await prisma.knowledgeItem.findMany({
      where: {
        status: 'READY',
        type: 'TEXT' // Only process text items
      },
      include: {
        chunks: true
      }
    });
    
    console.log(`📚 Found ${knowledgeItems.length} knowledge items to re-process`);
    
    // Import the text chunking function (using dynamic import for TypeScript)
    const { chunkText } = await import('./src/lib/text-chunking.js');
    const { generateQueryEmbedding } = await import('./src/lib/vector-embeddings.js');
    
    let processedCount = 0;
    let errorCount = 0;
    
    for (const item of knowledgeItems) {
      try {
        console.log(`🔄 Processing: ${item.title} (${item.id})`);
        
        if (!item.content) {
          console.log(`  ⚠️  No content found, skipping...`);
          continue;
        }
        
        // Delete existing chunks
        await prisma.knowledgeChunk.deleteMany({
          where: { knowledgeItemId: item.id }
        });
        
        // Create new chunks with improved settings
        const chunks = chunkText(item.content, {
          chunkSize: 512,      // Smaller chunks for better semantic precision
          chunkOverlap: 100,   // Good overlap for context preservation
          preserveSentences: true,
          preserveParagraphs: true,
          minChunkSize: 50
        });
        
        console.log(`  📄 Created ${chunks.length} chunks (was ${item.chunks.length})`);
        
        // Create chunk records and generate embeddings
        for (const chunk of chunks) {
          try {
            // Create the chunk record
            const chunkRecord = await prisma.knowledgeChunk.create({
              data: {
                content: chunk.content,
                chunkIndex: chunk.index,
                knowledgeItemId: item.id,
                embeddingData: null // Will be set below
              }
            });
            
            // Generate and store embedding
            const embedding = await generateQueryEmbedding(chunk.content);
            await prisma.knowledgeChunk.update({
              where: { id: chunkRecord.id },
              data: { embeddingData: JSON.stringify(embedding) }
            });
            
          } catch (chunkError) {
            console.error(`    ❌ Error processing chunk ${chunk.index}:`, chunkError.message);
          }
        }
        
        processedCount++;
        console.log(`  ✅ Completed processing ${item.title}`);
        
        // Add a small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        errorCount++;
        console.error(`❌ Error processing ${item.title}:`, error.message);
      }
    }
    
    console.log(`\n📊 Re-processing Summary:`);
    console.log(`  ✅ Successfully processed: ${processedCount} items`);
    console.log(`  ❌ Errors: ${errorCount} items`);
    console.log(`  📚 Total items: ${knowledgeItems.length}`);
    
    if (processedCount > 0) {
      console.log(`\n🎉 Re-processing completed! Your knowledge base should now have better retrieval performance.`);
      console.log(`\nNext steps:`);
      console.log(`1. Test the improved RAG system with: node test-improved-rag.js`);
      console.log(`2. Try asking questions about "perception of effort" or "forearm training"`);
      console.log(`3. The system should now retrieve more relevant articles`);
    }
    
  } catch (error) {
    console.error('❌ Error during re-processing:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the re-processing
reprocessKnowledgeBase().catch(console.error);
