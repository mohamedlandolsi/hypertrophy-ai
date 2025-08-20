const { PrismaClient } = require('@prisma/client');

async function checkChunks() {
  const prisma = new PrismaClient();
  
  try {
    // Count total chunks
    const totalChunks = await prisma.knowledgeChunk.count();
    console.log(`Total knowledge chunks: ${totalChunks}`);
    
    if (totalChunks > 0) {
      // Sample a few chunks
      const sampleChunks = await prisma.knowledgeChunk.findMany({
        take: 3,
        include: {
          knowledgeItem: {
            select: { title: true, type: true }
          }
        }
      });
      
      console.log('\nSample chunks:');
      sampleChunks.forEach((chunk, index) => {
        console.log(`${index + 1}. Knowledge Item: "${chunk.knowledgeItem.title}" (${chunk.knowledgeItem.type})`);
        console.log(`   Chunk content: ${chunk.content.substring(0, 100)}...`);
        console.log(`   Has embedding: ${chunk.embeddingData ? 'Yes' : 'No'}`);
        console.log(`   Embedding length: ${chunk.embeddingData ? chunk.embeddingData.length : 0}`);
      });
    } else {
      console.log('❌ No knowledge chunks found! The TEXT items were not properly processed into chunks.');
    }
    
  } catch (error) {
    console.error('Error checking chunks:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkChunks();
