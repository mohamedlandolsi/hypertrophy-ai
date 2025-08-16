const { PrismaClient } = require('@prisma/client');

async function testCategoriesAPI() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Testing categories API...');
    
    // First, check what categories exist in the database
    const categories = await prisma.knowledgeCategory.findMany({
      include: {
        KnowledgeItemCategory: {
          include: {
            KnowledgeItem: {
              select: { id: true }
            }
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });
    
    console.log(`📊 Found ${categories.length} categories in database:`);
    
    if (categories.length > 0) {
      categories.forEach((category, index) => {
        console.log(`\n${index + 1}. ${category.name}`);
        console.log(`   - ID: ${category.id}`);
        console.log(`   - Description: ${category.description || 'None'}`);
        console.log(`   - Items: ${category.KnowledgeItemCategory.length}`);
        console.log(`   - Created: ${category.createdAt}`);
      });
    } else {
      console.log('   No categories found in database');
    }
    
    // Transform to match API response format
    const categoriesWithCounts = categories.map(category => ({
      id: category.id,
      name: category.name,
      description: category.description,
      itemCount: category.KnowledgeItemCategory.length,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt
    }));
    
    console.log('\n🛠️ Testing API response format...');
    console.log('Expected API endpoint: GET /api/admin/knowledge-categories');
    console.log('Expected response format: { categories: [...] }');
    console.log('Frontend is looking for: data.categories');
    
    console.log('\nSample API response:');
    console.log(JSON.stringify({ categories: categoriesWithCounts.slice(0, 3) }, null, 2));
    
    return { categories: categoriesWithCounts };
    
  } catch (error) {
    console.error('❌ Error testing categories API:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testCategoriesAPI()
  .then((result) => {
    console.log('\n✅ Categories API test completed successfully');
    console.log(`📈 Summary: ${result.categories.length} categories found`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Categories API test failed:', error);
    process.exit(1);
  });
