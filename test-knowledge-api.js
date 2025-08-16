const { PrismaClient } = require('@prisma/client');

async function testKnowledgeAPI() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Testing knowledge items API...');
    
    // First, check what knowledge items exist in the database
    const knowledgeItems = await prisma.knowledgeItem.findMany({
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
    
    console.log(`📊 Found ${knowledgeItems.length} knowledge items in database:`);
    
    if (knowledgeItems.length > 0) {
      knowledgeItems.forEach((item, index) => {
        console.log(`\n${index + 1}. ${item.title}`);
        console.log(`   - ID: ${item.id}`);
        console.log(`   - Type: ${item.type}`);
        console.log(`   - Status: ${item.status}`);
        console.log(`   - User ID: ${item.userId}`);
        console.log(`   - Created: ${item.createdAt}`);
        
        if (item.KnowledgeItemCategory && item.KnowledgeItemCategory.length > 0) {
          const categories = item.KnowledgeItemCategory.map(kic => kic.KnowledgeCategory.name);
          console.log(`   - Categories: ${categories.join(', ')}`);
        } else {
          console.log(`   - Categories: None`);
        }
      });
    } else {
      console.log('   No knowledge items found in database');
    }
    
    // Check for users
    const users = await prisma.user.findMany({
      select: { id: true, role: true },
      take: 5
    });
    
    console.log(`\n👥 Found ${users.length} users in database:`);
    users.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.id} (${user.role})`);
    });
    
    // Test the API endpoint structure
    console.log('\n🛠️ Testing API endpoint structure...');
    console.log('Expected API endpoint: GET /api/knowledge');
    console.log('Expected response format: { knowledgeItems: [...] }');
    console.log('Frontend is looking for: data.knowledgeItems');
    
    return { knowledgeItems, users };
    
  } catch (error) {
    console.error('❌ Error testing knowledge API:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testKnowledgeAPI()
  .then((result) => {
    console.log('\n✅ Knowledge API test completed successfully');
    console.log(`📈 Summary: ${result.knowledgeItems.length} items, ${result.users.length} users`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Knowledge API test failed:', error);
    process.exit(1);
  });
