const { PrismaClient } = require('@prisma/client');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Generate embedding for text using Gemini's embedding model
 */
async function generateEmbedding(text) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    if (!text || text.trim().length === 0) {
      throw new Error('Text cannot be empty for embedding generation');
    }

    const model = genAI.getGenerativeModel({ 
      model: 'text-embedding-004'
    });

    const result = await model.embedContent(text);
    
    if (!result.embedding || !result.embedding.values) {
      throw new Error('Failed to generate embedding: No embedding values returned');
    }

    return {
      embedding: result.embedding.values,
      text: text
    };
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

async function applyTitlePrefixing() {
  console.log('🔄 Applying Title Prefixing to Existing Knowledge Base...\n');

  try {
    // Get all chunks that need updating
    const chunks = await prisma.knowledgeChunk.findMany({
      where: {
        embeddingData: { not: null },
        knowledgeItem: { status: 'READY' }
      },
      include: {
        knowledgeItem: {
          select: { 
            id: true, 
            title: true 
          }
        }
      },
      orderBy: [
        { knowledgeItem: { title: 'asc' } },
        { chunkIndex: 'asc' }
      ]
    });

    console.log(`📊 Found ${chunks.length} chunks to update`);

    if (chunks.length === 0) {
      console.log('✅ No chunks need updating');
      return;
    }

    // Filter out chunks that already have title prefixing
    const chunksNeedingUpdate = chunks.filter(chunk => 
      !chunk.content.startsWith(chunk.knowledgeItem.title)
    );

    console.log(`📊 Chunks needing title prefixing: ${chunksNeedingUpdate.length}`);

    if (chunksNeedingUpdate.length === 0) {
      console.log('✅ All chunks already have title prefixing');
      return;
    }

    // Group by knowledge item for progress tracking
    const chunksByItem = chunksNeedingUpdate.reduce((groups, chunk) => {
      const itemId = chunk.knowledgeItem.id;
      if (!groups[itemId]) {
        groups[itemId] = {
          title: chunk.knowledgeItem.title,
          chunks: []
        };
      }
      groups[itemId].chunks.push(chunk);
      return groups;
    }, {});

    console.log(`📚 Processing ${Object.keys(chunksByItem).length} knowledge items...\n`);

    let totalUpdated = 0;
    let totalErrors = 0;
    const batchSize = 5; // Process in small batches to avoid rate limits

    for (const [itemId, { title, chunks }] of Object.entries(chunksByItem)) {
      console.log(`\n📖 Processing: "${title}" (${chunks.length} chunks)`);
      
      let itemUpdated = 0;
      let itemErrors = 0;

      // Process chunks in batches
      for (let i = 0; i < chunks.length; i += batchSize) {
        const batch = chunks.slice(i, i + batchSize);
        
        console.log(`   🔄 Batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(chunks.length/batchSize)} (${batch.length} chunks)`);

        // Process batch in parallel
        const batchPromises = batch.map(async (chunk) => {
          try {
            // Create prefixed content for embedding (but keep original content in DB)
            const prefixedContent = `${title}\n\n${chunk.content}`;
            
            // Generate new embedding with title prefix
            const embeddingResult = await generateEmbedding(prefixedContent);
            
            // Update the chunk with new embedding
            await prisma.knowledgeChunk.update({
              where: { id: chunk.id },
              data: {
                embeddingData: JSON.stringify(embeddingResult.embedding)
              }
            });

            return { success: true, chunkId: chunk.id };
          } catch (error) {
            console.error(`     ❌ Error updating chunk ${chunk.id}:`, error.message);
            return { success: false, error: error.message };
          }
        });

        // Wait for batch to complete
        const batchResults = await Promise.all(batchPromises);
        
        // Count results
        const batchSuccess = batchResults.filter(r => r.success).length;
        const batchErrors = batchResults.filter(r => !r.success).length;
        
        itemUpdated += batchSuccess;
        itemErrors += batchErrors;
        
        console.log(`   ✅ Batch complete: ${batchSuccess} updated, ${batchErrors} errors`);

        // Add delay between batches to respect rate limits
        if (i + batchSize < chunks.length) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
        }
      }

      totalUpdated += itemUpdated;
      totalErrors += itemErrors;

      console.log(`📊 "${title}" complete: ${itemUpdated}/${chunks.length} updated, ${itemErrors} errors`);
    }

    console.log(`\n🎉 Title Prefixing Complete!`);
    console.log(`📊 Final Results:`);
    console.log(`   ✅ Successfully updated: ${totalUpdated} chunks`);
    console.log(`   ❌ Errors: ${totalErrors} chunks`);
    console.log(`   📈 Success rate: ${((totalUpdated / (totalUpdated + totalErrors)) * 100).toFixed(1)}%`);

    // Verify a few samples
    console.log(`\n🔍 Verification - Sampling updated chunks:`);
    const verificationSamples = await prisma.knowledgeChunk.findMany({
      where: {
        id: { in: chunksNeedingUpdate.slice(0, 3).map(c => c.id) }
      },
      include: {
        knowledgeItem: { select: { title: true } }
      }
    });

    verificationSamples.forEach((chunk, i) => {
      const hasEmbedding = chunk.embeddingData !== null;
      console.log(`   Sample ${i + 1}: ${hasEmbedding ? '✅' : '❌'} "${chunk.knowledgeItem.title}"`);
    });

  } catch (error) {
    console.error('❌ Title prefixing failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Add graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n⏹️ Received interrupt signal, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

applyTitlePrefixing().catch(console.error);
