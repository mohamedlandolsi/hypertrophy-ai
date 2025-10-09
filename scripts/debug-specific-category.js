const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findCategoryById() {
  console.log('🔍 Looking for category with ID from frontend logs...\n');
  
  const targetId = 'cmedd419000ef4cm1yb7g5b';
  console.log('Target ID:', targetId, '(length:', targetId.length, ')');
  
  // Try to find this exact category
  const category = await prisma.knowledgeCategory.findUnique({
    where: { id: targetId }
  });
  
  if (category) {
    console.log('✅ Category found:', category);
  } else {
    console.log('❌ Category NOT found with that ID');
    
    // Let's see what categories we actually have
    console.log('\n📋 Current categories in DB:');
    const allCategories = await prisma.knowledgeCategory.findMany();
    allCategories.forEach(cat => {
      console.log(`  - ID: ${cat.id} (length: ${cat.id.length}), Name: ${cat.name}`);
    });
    
    // Let's also search for any category that might be similar
    console.log('\n🔍 Searching for similar IDs:');
    const similarCategories = allCategories.filter(cat => 
      cat.id.includes('cmedd') || targetId.includes(cat.id.substring(0, 10))
    );
    
    if (similarCategories.length > 0) {
      console.log('Similar categories found:');
      similarCategories.forEach(cat => {
        console.log(`  - ${cat.id} (${cat.name})`);
      });
    } else {
      console.log('No similar categories found');
    }
  }
  
  await prisma.$disconnect();
}

findCategoryById().catch(console.error);
