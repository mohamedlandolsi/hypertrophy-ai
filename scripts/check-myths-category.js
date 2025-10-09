const { PrismaClient } = require('@prisma/client');

async function checkMythsCategory() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Checking myths category specifically...\n');
    
    const mythsCategory = await prisma.knowledgeCategory.findUnique({
      where: { id: 'myths' }
    });
    console.log('Myths category:', mythsCategory);
    
    // Test validation with myths
    const testIds = ['myths'];
    const found = await prisma.knowledgeCategory.findMany({
      where: { id: { in: testIds } }
    });
    console.log('\nValidation test with myths:', {
      requested: testIds,
      found: found.map(c => c.id),
      pass: found.length === testIds.length
    });
    
    // Test with a mix of categories including myths
    const mixedIds = ['myths', 'cmedd01bi0000f4cwlueuoo93']; // myths + chest
    const foundMixed = await prisma.knowledgeCategory.findMany({
      where: { id: { in: mixedIds } }
    });
    console.log('\nValidation test with mixed IDs:', {
      requested: mixedIds,
      found: foundMixed.map(c => ({ id: c.id, name: c.name })),
      pass: foundMixed.length === mixedIds.length
    });
    
  } catch (error) {
    console.error('💥 Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkMythsCategory();
