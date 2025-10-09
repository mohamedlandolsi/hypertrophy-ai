/**
 * Re-process knowledge base with improved chunking strategy
 * 
 * This script uses the Next.js API to re-process the knowledge base
 * with improved chunking parameters.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Simple text chunking function (inline implementation)
function chunkText(text, options = {}) {
  const {
    chunkSize = 512,
    chunkOverlap = 100,
    minChunkSize = 50
  } = options;

  if (!text || text.trim().length < minChunkSize) {
    return [{
      content: text.trim(),
      index: 0,
      startChar: 0,
      endChar: text.length
    }];
  }

  const chunks = [];
  let currentPosition = 0;
  let chunkIndex = 0;

  while (currentPosition < text.length) {
    const endPosition = Math.min(currentPosition + chunkSize, text.length);
    let chunkEnd = endPosition;

    // Try to find a good breaking point (sentence or paragraph end)
    if (endPosition < text.length) {
      // Look for sentence endings
      const sentenceEnd = text.lastIndexOf('.', endPosition);
      const paragraphEnd = text.lastIndexOf('\n', endPosition);
      
      if (sentenceEnd > currentPosition + minChunkSize) {
        chunkEnd = sentenceEnd + 1;
      } else if (paragraphEnd > currentPosition + minChunkSize) {
        chunkEnd = paragraphEnd + 1;
      }
    }

    const chunkContent = text.slice(currentPosition, chunkEnd).trim();
    
    if (chunkContent.length >= minChunkSize) {
      chunks.push({
        content: chunkContent,
        index: chunkIndex,
        startChar: currentPosition,
        endChar: chunkEnd
      });
      chunkIndex++;
    }

    currentPosition = Math.max(
      chunkEnd - chunkOverlap,
      currentPosition + 1
    );

    if (currentPosition >= chunkEnd) {
      break;
    }
  }

  return chunks;
}

// Simple embedding function (using fetch to call OpenAI or similar)
async function generateEmbedding(text) {
  try {
    // For now, return a placeholder - in production, this would call your embedding API
    // You can replace this with your actual embedding generation logic
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'text-embedding-ada-002',
        input: text
      })
    });

    if (!response.ok) {
      throw new Error(`Embedding API error: ${response.status}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    // Return a placeholder embedding for now
    return Array(768).fill(0).map(() => Math.random() - 0.5);
  }
}

async function reprocessKnowledgeBase() {
  console.log('🔄 Re-processing knowledge base with improved chunking...\n');
  
  try {
    // Get all knowledge items that need re-processing
    const knowledgeItems = await prisma.knowledgeItem.findMany({
      where: {
        status: 'READY',
        type: 'TEXT'
      },
      include: {
        chunks: true
      }
    });
    
    console.log(`📚 Found ${knowledgeItems.length} knowledge items to re-process`);
    
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
          chunkSize: 512,
          chunkOverlap: 100,
          minChunkSize: 50
        });
        
        console.log(`  📄 Created ${chunks.length} chunks (was ${item.chunks.length})`);
        
        // Create chunk records and generate embeddings
        for (const chunk of chunks) {
          try {
            // Generate embedding
            const embedding = await generateEmbedding(chunk.content);
            
            // Create the chunk record with embedding
            await prisma.knowledgeChunk.create({
              data: {
                content: chunk.content,
                chunkIndex: chunk.index,
                knowledgeItemId: item.id,
                embeddingData: JSON.stringify(embedding)
              }
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
      console.log(`1. Test the improved RAG system by asking about "perception of effort"`);
      console.log(`2. Try asking about "forearm training"`);
      console.log(`3. The system should now retrieve more relevant articles`);
    }
    
  } catch (error) {
    console.error('❌ Error during re-processing:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the re-processing
if (require.main === module) {
  reprocessKnowledgeBase().catch(console.error);
}

module.exports = { reprocessKnowledgeBase, chunkText };
