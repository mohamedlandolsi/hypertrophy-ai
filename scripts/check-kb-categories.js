const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkKBCategories() {
  try {
    console.log('📋 Available KB Categories:');
    console.log('========================');
    
    const categories = await prisma.knowledgeCategory.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        _count: {
          select: {
            KnowledgeItemCategory: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });
    
    categories.forEach(cat => {
      console.log(`🏷️  ${cat.name} (${cat._count.KnowledgeItemCategory} items)`);
      if (cat.description) {
        console.log(`   📝 ${cat.description}`);
      }
      console.log('');
    });
    
    console.log(`Total categories: ${categories.length}`);
    
  } catch (error) {
    console.error('❌ Error checking categories:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkKBCategories();
