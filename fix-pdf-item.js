const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

async function fixPdfKnowledgeItem() {
  try {
    // Get the PDF item
    const pdfItem = await prisma.knowledgeItem.findFirst({
      where: {
        id: 'cmbqo2pj80003f49c2gukaqvk'
      }
    });

    if (!pdfItem) {
      console.log('PDF item not found');
      return;
    }

    console.log('Found PDF item:', pdfItem.title);

    // Read the PDF file
    const filePath = path.join(__dirname, 'uploads', pdfItem.userId, '1749568772725-SportRxiv+Preprint+RIR+HIT_2.pdf');
    console.log('Reading file from:', filePath);

    if (!fs.existsSync(filePath)) {
      console.log('File does not exist at path:', filePath);
      return;
    }

    const buffer = fs.readFileSync(filePath);
    console.log('File read successfully, size:', buffer.length);

    // Extract text using pdf-parse
    const pdfParse = require('pdf-parse');
    const pdfData = await pdfParse(buffer);
    
    console.log('PDF parsed successfully');
    console.log('Text length:', pdfData.text.length);
    console.log('First 200 characters:', pdfData.text.substring(0, 200));

    // Update the knowledge item
    await prisma.knowledgeItem.update({
      where: { id: pdfItem.id },
      data: {
        content: pdfData.text,
        status: 'READY'
      }
    });

    console.log('✅ Knowledge item updated successfully!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixPdfKnowledgeItem();
