const { PrismaClient } = require('@prisma/client');

async function quickTest() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Quick triceps content check...');
    
    // Check KnowledgeItem titles for triceps/biasing content
    const tricepsItems = await prisma.knowledgeItem.findMany({
      where: {
        OR: [
          { title: { contains: 'triceps', mode: 'insensitive' } },
          { title: { contains: 'biasing', mode: 'insensitive' } },
          { title: { contains: 'arms', mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        title: true,
        type: true
      }
    });
    
    console.log(`Found ${tricepsItems.length} triceps/biasing/arms related items:`);
    tricepsItems.forEach((item, i) => {
      console.log(`${i + 1}. ${item.title} (${item.type}) (ID: ${item.id})`);
    });
    
    // Also check chunk content for triceps mentions
    const tricepsChunks = await prisma.knowledgeChunk.findMany({
      where: {
        OR: [
          { content: { contains: 'triceps', mode: 'insensitive' } },
          { content: { contains: 'biasing', mode: 'insensitive' } }
        ]
      },
      include: {
        knowledgeItem: {
          select: {
            title: true
          }
        }
      },
      take: 10
    });
    
    console.log(`\nFound ${tricepsChunks.length} chunks with triceps/biasing content:`);
    tricepsChunks.forEach((chunk, i) => {
      console.log(`${i + 1}. From: ${chunk.knowledgeItem.title} (Chunk ID: ${chunk.id})`);
      console.log(`   Content preview: ${chunk.content.substring(0, 150)}...`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

quickTest();
