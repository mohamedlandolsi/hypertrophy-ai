const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debug() {
  console.log('🔍 Debugging knowledge items...\n');
  
  try {
    // Get total count
    const total = await prisma.knowledgeItem.count();
    console.log('Total knowledge items:', total);
    
    // Get count by type
    const byType = await prisma.knowledgeItem.groupBy({
      by: ['type'],
      _count: { type: true }
    });
    console.log('By type:', byType);
    
    // Get sample with file paths
    const withFilePaths = await prisma.knowledgeItem.count({
      where: { filePath: { not: null } }
    });
    console.log('Items with filePath:', withFilePaths);
    
    // Get sample with FILE type
    const fileTypeCount = await prisma.knowledgeItem.count({
      where: { type: 'FILE' }
    });
    console.log('Items with FILE type:', fileTypeCount);
    
    // Get sample with both conditions
    const bothConditions = await prisma.knowledgeItem.count({
      where: { 
        type: 'FILE',
        filePath: { not: null } 
      }
    });
    console.log('Items with FILE type AND filePath:', bothConditions);
    
    // Get sample items
    const samples = await prisma.knowledgeItem.findMany({
      select: { id: true, type: true, filePath: true, fileName: true, title: true },
      take: 5
    });
    console.log('\nSample items:');
    samples.forEach((item, i) => {
      console.log(`${i + 1}. Type: ${item.type}, FilePath: ${item.filePath}, Title: ${item.title}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debug();
