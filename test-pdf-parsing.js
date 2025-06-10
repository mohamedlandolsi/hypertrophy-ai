// Test PDF parsing functionality
const fs = require('fs');
const path = require('path');

async function testPdfParsing() {
  try {
    console.log('Testing PDF parsing...');
    
    // Try to import pdf-parse
    const pdfParse = require('pdf-parse');
    console.log('✅ pdf-parse imported successfully');
    
    // Try to read the existing PDF file
    const pdfPath = path.join(__dirname, 'uploads', '9104e76a-a73e-412b-b8d6-03064ce37347', '1749568772725-SportRxiv+Preprint+RIR+HIT_2.pdf');
    
    if (fs.existsSync(pdfPath)) {
      console.log('✅ PDF file found:', pdfPath);
      
      const buffer = fs.readFileSync(pdfPath);
      console.log('✅ PDF file read successfully, size:', buffer.length, 'bytes');
      
      // Try to parse the PDF
      const data = await pdfParse(buffer);
      console.log('✅ PDF parsed successfully');
      console.log('Text length:', data.text.length);
      console.log('First 200 characters:', data.text.substring(0, 200));
      
    } else {
      console.log('❌ PDF file not found at:', pdfPath);
    }
    
  } catch (error) {
    console.error('❌ Error testing PDF parsing:', error);
  }
}

testPdfParsing();
