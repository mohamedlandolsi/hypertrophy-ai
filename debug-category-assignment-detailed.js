const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugCategoryAssignment() {
  console.log('🔍 Debugging category assignment issue...\n');
  
  try {
    // Check if categories exist
    const categories = await prisma.knowledgeCategory.findMany();
    console.log('📋 Available categories:');
    categories.forEach(cat => {
      console.log(`  - ID: ${cat.id}, Name: ${cat.name}`);
    });
    
    // Check knowledge items
    const items = await prisma.knowledgeItem.findMany({
      take: 3,
      include: {
        KnowledgeItemCategory: {
          include: {
            KnowledgeCategory: true
          }
        }
      }
    });
    
    console.log('\n📚 Sample knowledge items:');
    items.forEach(item => {
      console.log(`  - ID: ${item.id}, Title: ${item.title}`);
      console.log(`    Current categories: ${item.KnowledgeItemCategory.map(c => c.KnowledgeCategory.name).join(', ') || 'None'}`);
    });
    
    // Test a simple category assignment
    if (items.length > 0 && categories.length > 0) {
      const itemId = items[0].id;
      const categoryId = categories[0].id;
      
      console.log(`\n🧪 Testing assignment: Item ${itemId} + Category ${categoryId}`);
      
      try {
        // Check if relationship already exists
        const existing = await prisma.knowledgeItemCategory.findUnique({
          where: {
            knowledgeItemId_knowledgeCategoryId: {
              knowledgeItemId: itemId,
              knowledgeCategoryId: categoryId
            }
          }
        });
        
        if (existing) {
          console.log('✅ Relationship already exists');
        } else {
          // Try to create the relationship
          const created = await prisma.knowledgeItemCategory.create({
            data: {
              id: `${itemId}_${categoryId}`,
              knowledgeItemId: itemId,
              knowledgeCategoryId: categoryId
            }
          });
          console.log('✅ Relationship created successfully:', created);
        }
      } catch (error) {
        console.log('❌ Error creating relationship:', error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Database error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugCategoryAssignment().catch(console.error);
