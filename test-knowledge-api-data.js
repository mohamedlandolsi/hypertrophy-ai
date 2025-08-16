const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testKnowledgeAPIData() {
  console.log('🧪 Testing knowledge API data structure...\n');
  
  try {
    // Get first user with knowledge items
    const userWithItems = await prisma.user.findFirst({
      where: {
        knowledgeItems: {
          some: {}
        }
      },
      select: { id: true }
    });
    
    if (!userWithItems) {
      console.log('❌ No users with knowledge items found');
      return;
    }
    
    console.log('👤 Testing with user ID:', userWithItems.id);
    
    // Simulate the exact API query
    const knowledgeItems = await prisma.knowledgeItem.findMany({
      where: {
        userId: userWithItems.id,
      },
      include: {
        KnowledgeItemCategory: {
          include: {
            KnowledgeCategory: {
              select: { id: true, name: true }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`📊 Found ${knowledgeItems.length} knowledge items for user\n`);
    
    knowledgeItems.forEach((item, index) => {
      console.log(`📚 Item ${index + 1}:`);
      console.log(`  ID: ${item.id}`);
      console.log(`  Title: ${item.title}`);
      console.log(`  Categories (${item.KnowledgeItemCategory.length}):`);
      
      item.KnowledgeItemCategory.forEach((kic, catIndex) => {
        console.log(`    ${catIndex + 1}. Category ID: ${kic.KnowledgeCategory.id} (length: ${kic.KnowledgeCategory.id.length})`);
        console.log(`       Category Name: ${kic.KnowledgeCategory.name}`);
      });
      console.log('');
    });
    
    // Check for any corrupted IDs
    const allCategoryIds = knowledgeItems.flatMap(item => 
      item.KnowledgeItemCategory.map(kic => kic.KnowledgeCategory.id)
    );
    
    const corruptedIds = allCategoryIds.filter(id => id.length !== 25 && id !== 'myths');
    if (corruptedIds.length > 0) {
      console.log('⚠️ Found corrupted category IDs:');
      corruptedIds.forEach(id => {
        console.log(`  - ${id} (length: ${id.length})`);
      });
    } else {
      console.log('✅ All category IDs look correct');
    }
    
  } catch (error) {
    console.error('❌ Error testing API data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testKnowledgeAPIData().catch(console.error);
