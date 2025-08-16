const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCategories() {
  console.log('🔍 Checking all categories in database...\n');
  
  const categories = await prisma.knowledgeCategory.findMany({
    orderBy: { name: 'asc' }
  });
  
  console.log('📋 All categories:');
  categories.forEach((cat, index) => {
    console.log(`  ${index + 1}. ID: ${cat.id} (length: ${cat.id.length})`);
    console.log(`     Name: ${cat.name}`);
    console.log(`     Created: ${cat.createdAt}`);
    console.log('');
  });
  
  console.log(`Total categories: ${categories.length}`);
  
  // Check for any duplicate names
  const names = categories.map(c => c.name);
  const duplicates = names.filter((name, index) => names.indexOf(name) !== index);
  if (duplicates.length > 0) {
    console.log('⚠️ Duplicate names found:', duplicates);
  }
  
  // Check for any invalid IDs
  const invalidIds = categories.filter(c => !c.id || c.id.trim() !== c.id || c.id.length === 0);
  if (invalidIds.length > 0) {
    console.log('⚠️ Invalid IDs found:', invalidIds);
  }
  
  await prisma.$disconnect();
}

checkCategories().catch(console.error);
