const { PrismaClient } = require('@prisma/client');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const prisma = new PrismaClient();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

function cosineSimilarity(vectorA, vectorB) {
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
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (normA * normB);
}

async function debugChestSpecificity() {
  try {
    console.log('🔍 DEBUG: Why chest queries don\'t find chest content');
    console.log('======================================================');
    
    const userId = '3e9ab191-e4e9-4eb4-a8eb-e95cbc39c7ba';
    
    // Test different chest-related queries
    const queries = [
      'chest training exercises',
      'pectoral muscle development',
      'chest workout routine',
      'how to train chest muscles',
      'best chest exercises for hypertrophy'
    ];
    
    const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
    
    // Get chest-specific chunks
    const chestChunks = await prisma.knowledgeChunk.findMany({
      where: {
        knowledgeItem: {
          userId: userId,
          title: { contains: 'Chest', mode: 'insensitive' }
        },
        embeddingData: { not: null }
      },
      include: { knowledgeItem: { select: { title: true } } },
      take: 10
    });
    
    console.log(`📚 Found ${chestChunks.length} chest-specific chunks`);
    
    for (const query of queries) {
      console.log(`\n🔍 Testing: "${query}"`);
      
      // Generate query embedding
      const result = await model.embedContent(query);
      const queryEmbedding = result.embedding.values;
      
      let bestChestMatch = null;
      let bestChestSimilarity = -1;
      
      // Test against chest chunks
      for (const chunk of chestChunks) {
        try {
          const chunkEmbedding = JSON.parse(chunk.embeddingData);
          const similarity = cosineSimilarity(queryEmbedding, chunkEmbedding);
          
          if (similarity > bestChestSimilarity) {
            bestChestSimilarity = similarity;
            bestChestMatch = chunk;
          }
        } catch (error) {
          // Skip invalid embeddings
        }
      }
      
      if (bestChestMatch) {
        const percentage = (bestChestSimilarity * 100).toFixed(2);
        console.log(`   🏆 Best chest match: ${percentage}% - "${bestChestMatch.knowledgeItem.title}"`);
        console.log(`       Preview: "${bestChestMatch.content.substring(0, 120)}..."`);
        
        if (bestChestSimilarity >= 0.05) {
          console.log('   ✅ Would be retrieved with 5% threshold');
        } else {
          console.log('   ❌ Below 5% threshold - would not be retrieved');
        }
      }
    }
    
    // Also check what content is in the chest guide
    console.log('\n📖 Chest training content sample:');
    const sampleChestChunk = chestChunks[0];
    if (sampleChestChunk) {
      console.log(`Title: "${sampleChestChunk.knowledgeItem.title}"`);
      console.log(`Content preview: "${sampleChestChunk.content.substring(0, 300)}..."`);
    }
    
    // Compare with a general training query that works
    console.log('\n🔄 COMPARISON: Testing general training query...');
    const generalQuery = 'muscle training principles for hypertrophy';
    const generalResult = await model.embedContent(generalQuery);
    const generalEmbedding = generalResult.embedding.values;
    
    // Test against foundational chunks
    const foundationalChunks = await prisma.knowledgeChunk.findMany({
      where: {
        knowledgeItem: {
          userId: userId,
          title: { contains: 'Foundational', mode: 'insensitive' }
        },
        embeddingData: { not: null }
      },
      include: { knowledgeItem: { select: { title: true } } },
      take: 5
    });
    
    let bestFoundationalMatch = null;
    let bestFoundationalSimilarity = -1;
    
    for (const chunk of foundationalChunks) {
      try {
        const chunkEmbedding = JSON.parse(chunk.embeddingData);
        const similarity = cosineSimilarity(generalEmbedding, chunkEmbedding);
        
        if (similarity > bestFoundationalSimilarity) {
          bestFoundationalSimilarity = similarity;
          bestFoundationalMatch = chunk;
        }
      } catch (error) {
        // Skip invalid embeddings
      }
    }
    
    if (bestFoundationalMatch) {
      const percentage = (bestFoundationalSimilarity * 100).toFixed(2);
      console.log(`🎯 General query gets: ${percentage}% match with foundational content`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugChestSpecificity();
