const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkULContent() {
  try {
    // Get the specific guide about common training splits
    const guide = await prisma.knowledgeItem.findFirst({
      where: { title: { contains: 'Common Training Splits', mode: 'insensitive' } },
      include: { chunks: { orderBy: { chunkIndex: 'asc' } } }
    });
    
    if (guide) {
      console.log('=== A Guide to Common Training Splits ===');
      console.log('Title:', guide.title);
      console.log('Total chunks:', guide.chunks.length);
      console.log('');
      
      guide.chunks.forEach((chunk, i) => {
        console.log(`--- Chunk ${chunk.chunkIndex} ---`);
        console.log(chunk.content.substring(0, 600) + '...');
        console.log('');
      });
    }
    
    // Also check for the Effective Split Programming guide
    const splitGuide = await prisma.knowledgeItem.findFirst({
      where: { title: { contains: 'Effective Split Programming', mode: 'insensitive' } },
      include: { chunks: { orderBy: { chunkIndex: 'asc' } } }
    });
    
    if (splitGuide) {
      console.log('\n=== A Guide to Effective Split Programming ===');
      console.log('Title:', splitGuide.title);
      console.log('Total chunks:', splitGuide.chunks.length);
      console.log('');
      
      splitGuide.chunks.forEach((chunk, i) => {
        console.log(`--- Chunk ${chunk.chunkIndex} ---`);
        console.log(chunk.content.substring(0, 600) + '...');
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkULContent();
