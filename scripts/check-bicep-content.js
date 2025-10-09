const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkBicepContent() {
  try {
    console.log('🔍 CHECKING BICEP CONTENT IN KNOWLEDGE BASE');
    console.log('============================================');
    
    const userId = '3e9ab191-e4e9-4eb4-a8eb-e95cbc39c7ba';
    
    // Get all knowledge items
    const allItems = await prisma.knowledgeItem.findMany({
      where: { userId: userId, status: 'READY' },
      select: { id: true, title: true }
    });
    
    console.log(`Total knowledge items: ${allItems.length}`);
    
    // Check for bicep/arm related items
    const bicepTerms = ['bicep', 'biceps', 'arm', 'arms'];
    const bicepItems = allItems.filter(item => 
      bicepTerms.some(term => 
        item.title.toLowerCase().includes(term)
      )
    );
    
    console.log('\n📚 Bicep/Arm related items:');
    if (bicepItems.length > 0) {
      bicepItems.forEach(item => {
        console.log(`• "${item.title}"`);
      });
    } else {
      console.log('❌ No bicep or arm specific guides found');
    }
    
    // Check for items mentioning bicep in content
    console.log('\n🔍 Checking content for bicep mentions...');
    const contentMentions = await prisma.knowledgeChunk.findMany({
      where: {
        knowledgeItem: { userId: userId, status: 'READY' },
        OR: [
          { content: { contains: 'bicep', mode: 'insensitive' } },
          { content: { contains: 'biceps', mode: 'insensitive' } }
        ]
      },
      include: { knowledgeItem: { select: { title: true } } },
      take: 5
    });
    
    if (contentMentions.length > 0) {
      console.log(`✅ Found ${contentMentions.length} content mentions of bicep/biceps:`);
      contentMentions.forEach((chunk, index) => {
        console.log(`   ${index + 1}. "${chunk.knowledgeItem.title}" - Chunk ${chunk.chunkIndex}`);
      });
    } else {
      console.log('❌ No bicep content found in chunks');
    }
    
    // Show some training guide titles for reference
    console.log('\n📋 Sample training guides available:');
    const trainingGuides = allItems
      .filter(item => item.title.toLowerCase().includes('training'))
      .slice(0, 10);
    
    trainingGuides.forEach(item => {
      console.log(`• "${item.title}"`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBicepContent();
