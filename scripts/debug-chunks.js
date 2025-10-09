const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkChunks() {
  console.log('🔍 Checking knowledge chunks...\n');
  
  try {
    // Get total chunk count
    const chunkCount = await prisma.knowledgeChunk.count();
    console.log('Total knowledge chunks:', chunkCount);
    
    if (chunkCount > 0) {
      // Get sample chunks
      const sampleChunks = await prisma.knowledgeChunk.findMany({
        take: 3,
        include: {
          knowledgeItem: {
            select: { title: true }
          }
        }
      });
      
      console.log('\nSample chunks:');
      sampleChunks.forEach((chunk, i) => {
        console.log(`${i + 1}. Content: ${chunk.content.substring(0, 100)}...`);
        console.log(`   From: ${chunk.knowledgeItem.title}`);
        console.log(`   Embedding length: ${chunk.embedding ? JSON.parse(chunk.embedding).length : 'null'}`);
      });
    } else {
      console.log('❌ No knowledge chunks found!');
      console.log('This means the TEXT items were not properly processed into chunks.');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkChunks();
