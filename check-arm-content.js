const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkArmContent() {
  console.log('🔍 Checking ARM content in knowledge base...');
  
  try {
    // Check for arm/bicep/tricep related content
    const armChunks = await prisma.knowledgeChunk.findMany({
      where: {
        knowledgeItem: { status: 'READY' },
        OR: [
          { content: { contains: 'bicep', mode: 'insensitive' } },
          { content: { contains: 'tricep', mode: 'insensitive' } },
          { content: { contains: 'arm', mode: 'insensitive' } },
          { content: { contains: 'curl', mode: 'insensitive' } },
          { content: { contains: 'extension', mode: 'insensitive' } }
        ]
      },
      include: {
        knowledgeItem: { select: { title: true } }
      },
      take: 10
    });

    console.log(`Found ${armChunks.length} arm-related chunks:`);
    
    if (armChunks.length === 0) {
      console.log('❌ No arm-specific content found in knowledge base');
      console.log('💡 This explains why arm training queries return no citations');
      
      // Check what content IS available
      const allTitles = await prisma.knowledgeItem.findMany({
        where: { status: 'READY' },
        select: { title: true }
      });
      
      console.log('\n📚 Available knowledge base content:');
      allTitles.forEach((item, index) => {
        console.log(`${index + 1}. ${item.title}`);
      });
      
    } else {
      armChunks.forEach((chunk, index) => {
        console.log(`${index + 1}. From: "${chunk.knowledgeItem.title}"`);
        const preview = chunk.content.substring(0, 100);
        console.log(`   Content: ${preview}...`);
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('Error checking arm content:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkArmContent();
