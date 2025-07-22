const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function cosineSimilarity(vectorA, vectorB) {
  if (vectorA.length !== vectorB.length) {
    throw new Error('Vectors must have the same dimension');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vectorA.length; i++) {
    dotProduct += vectorA[i] * vectorB[i];
    normA += vectorA[i] * vectorA[i];
    normB += vectorB[i] * vectorB[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (normA * normB);
}

async function debugChestTrainingEmbeddings() {
  try {
    console.log('🔍 Testing chest training knowledge retrieval');
    
    // 1. Find chest training knowledge item
    const chestKnowledgeItem = await prisma.knowledgeItem.findFirst({
      where: {
        title: {
          contains: 'Chest Training',
          mode: 'insensitive'
        }
      }
    });

    if (!chestKnowledgeItem) {
      console.log('❌ No chest training knowledge item found');
      return;
    }

    console.log(`✅ Found: "${chestKnowledgeItem.title}"`);
    
    // 2. Get chunks for this item
    const chestChunks = await prisma.knowledgeChunk.findMany({
      where: {
        knowledgeItemId: chestKnowledgeItem.id
      },
      select: {
        id: true,
        content: true,
        embeddingData: true,
        chunkIndex: true
      },
      take: 5
    });

    console.log(`📚 Found ${chestChunks.length} chest training chunks`);

    // 3. Check embedding quality
    let chunksWithEmbeddings = 0;
    let embeddingDimensions = 0;
    
    for (const chunk of chestChunks) {
      if (chunk.embeddingData) {
        chunksWithEmbeddings++;
        try {
          const embedding = JSON.parse(chunk.embeddingData);
          if (embeddingDimensions === 0) {
            embeddingDimensions = embedding.length;
          }
          console.log(`  ✅ Chunk ${chunk.chunkIndex}: Has ${embedding.length}D embedding`);
          console.log(`     Preview: "${chunk.content.substring(0, 100)}..."`);
          
          // Show first few embedding values
          const firstValues = embedding.slice(0, 5).map(v => v.toFixed(4));
          console.log(`     Embedding sample: [${firstValues.join(', ')}...]`);
          
        } catch (error) {
          console.log(`  ❌ Chunk ${chunk.chunkIndex}: Invalid embedding data`);
        }
      } else {
        console.log(`  ❌ Chunk ${chunk.chunkIndex}: No embedding data`);
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   - Chunks with embeddings: ${chunksWithEmbeddings}/${chestChunks.length}`);
    console.log(`   - Embedding dimensions: ${embeddingDimensions}`);

    // 4. Compare with foundational training chunks
    const foundationalChunks = await prisma.knowledgeChunk.findMany({
      where: {
        knowledgeItem: {
          title: {
            contains: 'Foundational Training',
            mode: 'insensitive'
          }
        }
      },
      select: {
        id: true,
        content: true,
        embeddingData: true,
        chunkIndex: true
      },
      take: 3
    });

    console.log(`\n📚 Found ${foundationalChunks.length} foundational training chunks for comparison`);
    
    // Simple manual similarity test
    if (chestChunks.length > 0 && foundationalChunks.length > 0) {
      const chestEmbedding1 = chestChunks[0].embeddingData ? JSON.parse(chestChunks[0].embeddingData) : null;
      const foundationalEmbedding1 = foundationalChunks[0].embeddingData ? JSON.parse(foundationalChunks[0].embeddingData) : null;
      
      if (chestEmbedding1 && foundationalEmbedding1) {
        const similarity = cosineSimilarity(chestEmbedding1, foundationalEmbedding1);
        console.log(`\n🧪 Cross-similarity test:`);
        console.log(`   Chest chunk vs Foundational chunk: ${(similarity * 100).toFixed(2)}%`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugChestTrainingEmbeddings();
