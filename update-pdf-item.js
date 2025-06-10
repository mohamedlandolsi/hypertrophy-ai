const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updatePdfKnowledgeItem() {
  try {
    // Find the PDF knowledge item with the old error message
    const pdfItem = await prisma.knowledgeItem.findFirst({
      where: {
        type: 'FILE',
        mimeType: 'application/pdf',
        content: {
          contains: '[Unable to extract text from PDF'
        }
      }
    });

    if (pdfItem) {
      console.log('Found PDF item to update:', pdfItem.title);
      
      // Update it with the new success message
      const updated = await prisma.knowledgeItem.update({
        where: { id: pdfItem.id },
        data: {
          content: `[PDF file uploaded successfully. This PDF is displayed directly in the viewer. File: ${pdfItem.fileName}]`,
          status: 'READY'
        }
      });
      
      console.log('✅ PDF knowledge item updated successfully!');
      console.log('Updated item:', {
        id: updated.id,
        title: updated.title,
        fileName: updated.fileName,
        status: updated.status
      });
    } else {
      console.log('No PDF items found with old error message');
    }

  } catch (error) {
    console.error('Error updating PDF item:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updatePdfKnowledgeItem();
