const { PrismaClient } = require('@prisma/client');

async function categorizeCorePrinciples() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔧 Categorizing Core Programming Principles...\n');

    // Get all knowledge items
    const allItems = await prisma.knowledgeItem.findMany({
      select: {
        id: true,
        title: true,
        category: true,
        status: true
      }
    });

    // Define keywords that indicate core programming principles
    const principleKeywords = [
      'volume', 'mev', 'mav', 'mrv', 'minimum effective volume', 'maximum adaptive volume', 'maximum recoverable volume',
      'progression', 'double progression', 'progressive overload',
      'rir', 'rpe', 'intensity', 'rate of perceived exertion', 'reps in reserve',
      'programming', 'periodization', 'program design',
      'fatigue', 'recovery', 'deload',
      'exercise selection', 'exercise hierarchy',
      'training principles', 'hypertrophy principles'
    ];

    // Find items that match core principle criteria
    const coreItems = allItems.filter(item => {
      const title = item.title.toLowerCase();
      return principleKeywords.some(keyword => title.includes(keyword));
    });

    console.log(`📋 Found ${coreItems.length} items that appear to be core principles:`);
    coreItems.forEach((item, index) => {
      console.log(`   ${index + 1}. "${item.title}" (Current category: ${item.category || 'None'})`);
    });

    if (coreItems.length === 0) {
      console.log('⚠️  No core principle items found. You may need to manually identify and categorize them.');
      console.log('\n📝 All knowledge items:');
      allItems.forEach((item, index) => {
        console.log(`   ${index + 1}. "${item.title}" (Category: ${item.category || 'None'})`);
      });
      return;
    }

    console.log('\n🔄 Updating categories to "Programming Principles"...');

    // Update the categories
    const updateResults = await Promise.all(
      coreItems.map(item => 
        prisma.knowledgeItem.update({
          where: { id: item.id },
          data: { category: 'Programming Principles' },
          select: { id: true, title: true, category: true }
        })
      )
    );

    console.log(`✅ Successfully categorized ${updateResults.length} items as "Programming Principles":`);
    updateResults.forEach(item => {
      console.log(`   - "${item.title}"`);
    });

    // Verify the updates
    const verifyCount = await prisma.knowledgeItem.count({
      where: {
        category: 'Programming Principles',
        status: 'READY'
      }
    });

    console.log(`\n✅ Verification: ${verifyCount} items now categorized as "Programming Principles" and ready.`);
    console.log(`\n🚀 Enhanced RAG system is now ready! Core principles will be included in every query.`);
    
  } catch (error) {
    console.error('❌ Error categorizing core principles:', error);
  } finally {
    await prisma.$disconnect();
  }
}

categorizeCorePrinciples();
