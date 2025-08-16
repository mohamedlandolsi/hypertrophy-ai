const { PrismaClient } = require('@prisma/client');

async function createMythsCategory() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Checking if myths category exists...');
    
    // Check if myths category already exists
    const existingCategory = await prisma.knowledgeCategory.findFirst({
      where: { name: 'myths' }
    });
    
    if (existingCategory) {
      console.log('✅ Myths category already exists:', existingCategory);
      return existingCategory;
    }
    
    console.log('📝 Creating myths category...');
    
    // Create the myths category
    const mythsCategory = await prisma.knowledgeCategory.create({
      data: {
        id: 'myths', // Use 'myths' as the ID as well
        name: 'myths',
        description: 'Common fitness myths and misconceptions that should be corrected',
        updatedAt: new Date()
      }
    });
    
    console.log('✅ Successfully created myths category:', mythsCategory);
    
    // Also check how many total categories we have
    const totalCategories = await prisma.knowledgeCategory.count();
    console.log(`📊 Total categories in database: ${totalCategories}`);
    
    return mythsCategory;
    
  } catch (error) {
    console.error('❌ Error creating myths category:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
createMythsCategory()
  .then(() => {
    console.log('🎉 Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
