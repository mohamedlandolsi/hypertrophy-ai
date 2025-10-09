const { PrismaClient } = require('@prisma/client');

async function debugCategoryAssignment() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Debugging category assignment issue...\n');
    
    // Get all available categories
    console.log('📊 Available categories in database:');
    const categories = await prisma.knowledgeCategory.findMany({
      select: { id: true, name: true }
    });
    
    console.log(`Found ${categories.length} categories:`);
    categories.forEach(cat => {
      console.log(`  - ${cat.id}: ${cat.name}`);
    });
    
    // Get a sample knowledge item
    console.log('\n📄 Sample knowledge items:');
    const knowledgeItems = await prisma.knowledgeItem.findMany({
      take: 3,
      select: { 
        id: true, 
        title: true,
        KnowledgeItemCategory: {
          include: {
            KnowledgeCategory: true
          }
        }
      }
    });
    
    knowledgeItems.forEach(item => {
      console.log(`  - ${item.id}: ${item.title}`);
      if (item.KnowledgeItemCategory.length > 0) {
        console.log(`    Current categories: ${item.KnowledgeItemCategory.map(kic => kic.KnowledgeCategory.name).join(', ')}`);
      } else {
        console.log(`    No categories assigned`);
      }
    });
    
    // Test category validation logic
    console.log('\n🧪 Testing category validation...');
    const testCategoryIds = categories.slice(0, 2).map(cat => cat.id);
    console.log(`Testing with category IDs: [${testCategoryIds.join(', ')}]`);
    
    const foundCategories = await prisma.knowledgeCategory.findMany({
      where: { id: { in: testCategoryIds } }
    });
    
    console.log(`Found ${foundCategories.length} categories out of ${testCategoryIds.length} requested`);
    
    if (foundCategories.length !== testCategoryIds.length) {
      console.log('❌ Validation would fail - category count mismatch');
      console.log('Requested IDs:', testCategoryIds);
      console.log('Found IDs:', foundCategories.map(cat => cat.id));
    } else {
      console.log('✅ Validation would pass');
    }
    
  } catch (error) {
    console.error('💥 Error during debugging:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugCategoryAssignment();
