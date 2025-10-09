const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPdfKnowledgeItems() {
  try {
    const pdfItems = await prisma.knowledgeItem.findMany({
      where: {
        type: 'FILE',
        mimeType: 'application/pdf'
      },
      select: {
        id: true,
        title: true,
        fileName: true,
        status: true,
        content: true
      }
    });

    console.log('Found PDF knowledge items:', pdfItems.length);
    
    pdfItems.forEach(item => {
      console.log('\n--- PDF Item ---');
      console.log('ID:', item.id);
      console.log('Title:', item.title);
      console.log('File Name:', item.fileName);
      console.log('Status:', item.status);
      console.log('Content Preview:', item.content?.substring(0, 200) + '...');
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPdfKnowledgeItems();
