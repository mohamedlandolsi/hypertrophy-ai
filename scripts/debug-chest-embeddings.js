const { PrismaClient } = require('@prisma/client');
const { cosineSimilarity, generateEmbedding } = require('./src/lib/vector-embeddings');
const prisma = new PrismaClient();

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
      },
      include: {
        chunks: {
          take: 5,
          select: {
            id: true,
            content: true,
            embeddingData: true,
            chunkIndex: true
          }
        }
      }
    });

    if (!chestKnowledgeItem) {
      console.log('❌ No chest training knowledge item found');
      return;
    }

    console.log(`✅ Found: "${chestKnowledgeItem.title}"`);
    console.log(`📚 Total chunks: ${chestKnowledgeItem.chunks.length}`);

    // 2. Test with a chest training query
    const query = 'What are the best chest exercises for muscle growth?';
    console.log(`\n🔍 Testing query: "${query}"`);
    
    const queryResult = await generateEmbedding(query);
    const queryEmbedding = queryResult.embedding;
    
    console.log(`📊 Query embedding dimensions: ${queryEmbedding.length}`);
    console.log(`🔢 First 5 values: [${queryEmbedding.slice(0, 5).map(v => v.toFixed(4)).join(', ')}...]`);

    // 3. Test similarity with chest training chunks
    console.log('\n🧪 Testing similarity with chest training chunks:');
    for (const chunk of chestKnowledgeItem.chunks) {
      if (!chunk.embeddingData) {
        console.log(`  ❌ Chunk ${chunk.chunkIndex}: No embedding data`);
        continue;
      }

      try {
        const chunkEmbedding = JSON.parse(chunk.embeddingData);
        const similarity = cosineSimilarity(queryEmbedding, chunkEmbedding);
        const percentage = (similarity * 100).toFixed(2);
        
        console.log(`  📈 Chunk ${chunk.chunkIndex}: ${percentage}% similarity`);
        console.log(`     Preview: "${chunk.content.substring(0, 100)}..."`);
        
        if (similarity > 0.3) {
          console.log('     🎯 High relevance chunk!');
        }
      } catch (error) {
        console.log(`  ❌ Chunk ${chunk.chunkIndex}: Error parsing embedding - ${error.message}`);
      }
    }

    // 4. Also test with foundational training (the one that always appears)
    console.log('\n🔍 Comparing with foundational training chunks:');
    const foundationalItem = await prisma.knowledgeItem.findFirst({
      where: {
        title: {
          contains: 'Foundational Training',
          mode: 'insensitive'
        }
      },
      include: {
        chunks: {
          take: 3,
          select: {
            id: true,
            content: true,
            embeddingData: true,
            chunkIndex: true
          }
        }
      }
    });

    if (foundationalItem) {
      for (const chunk of foundationalItem.chunks) {
        if (chunk.embeddingData) {
          try {
            const chunkEmbedding = JSON.parse(chunk.embeddingData);
            const similarity = cosineSimilarity(queryEmbedding, chunkEmbedding);
            const percentage = (similarity * 100).toFixed(2);
            
            console.log(`  📊 Foundational Chunk ${chunk.chunkIndex}: ${percentage}% similarity`);
          } catch (error) {
            console.log(`  ❌ Error: ${error.message}`);
          }
        }
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugChestTrainingEmbeddings();
