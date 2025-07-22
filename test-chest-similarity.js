const { PrismaClient } = require('@prisma/client');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const prisma = new PrismaClient();

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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

async function generateQueryEmbedding(text) {
  try {
    const model = genAI.getGenerativeModel({ 
      model: 'text-embedding-004'
    });

    const result = await model.embedContent(text);
    return result.embedding.values;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

async function testChestQuerySimilarity() {
  try {
    console.log('🔍 Testing chest training query similarity');
    
    // Test queries
    const queries = [
      'What are the best chest exercises for muscle growth?',
      'How do I train my chest muscles effectively?',
      'chest workout routine for hypertrophy',
      'pectoral muscle training guide'
    ];

    // Get chest training chunks
    const chestChunks = await prisma.knowledgeChunk.findMany({
      where: {
        knowledgeItem: {
          title: {
            contains: 'Chest Training',
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
      take: 5
    });

    console.log(`📚 Found ${chestChunks.length} chest training chunks`);

    for (const query of queries) {
      console.log(`\n🔍 Testing query: "${query}"`);
      
      // Generate query embedding
      const queryEmbedding = await generateQueryEmbedding(query);
      console.log(`📊 Query embedding dimensions: ${queryEmbedding.length}`);
      
      let maxSimilarity = -1;
      let bestChunk = null;

      // Test similarity with each chest chunk
      for (const chunk of chestChunks) {
        if (chunk.embeddingData) {
          try {
            const chunkEmbedding = JSON.parse(chunk.embeddingData);
            const similarity = cosineSimilarity(queryEmbedding, chunkEmbedding);
            
            if (similarity > maxSimilarity) {
              maxSimilarity = similarity;
              bestChunk = chunk;
            }
            
            console.log(`  📈 Chunk ${chunk.chunkIndex}: ${(similarity * 100).toFixed(2)}%`);
          } catch (error) {
            console.log(`  ❌ Chunk ${chunk.chunkIndex}: Error - ${error.message}`);
          }
        }
      }

      if (bestChunk) {
        console.log(`🏆 Best match: Chunk ${bestChunk.chunkIndex} with ${(maxSimilarity * 100).toFixed(2)}% similarity`);
        console.log(`   Preview: "${bestChunk.content.substring(0, 120)}..."`);
        
        if (maxSimilarity > 0.5) {
          console.log('   🎯 Would be retrieved with 50% threshold!');
        } else if (maxSimilarity > 0.3) {
          console.log('   ⚠️ Would be retrieved with 30% threshold');
        } else {
          console.log('   ❌ Too low similarity - would not be retrieved');
        }
      }
    }

    // Also test the current similarity threshold
    const ragConfig = await prisma.aIConfiguration.findUnique({
      where: { id: 'singleton' },
      select: { ragSimilarityThreshold: true }
    });

    console.log(`\n⚙️ Current RAG similarity threshold: ${(ragConfig?.ragSimilarityThreshold || 0.5) * 100}%`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testChestQuerySimilarity();
