import mammoth from 'mammoth';

// PDF parsing with robust fallback handling
async function extractPdfText(buffer: Buffer, fileName: string): Promise<string> {
  try {
    // Use dynamic import for pdf-parse to avoid ESLint require() error
    const { default: pdfParse } = await import('pdf-parse');
    
    // Validate that we have the function
    if (typeof pdfParse !== 'function') {
      throw new Error('PDF parse function is not available');
    }
    
    if (process.env.NODE_ENV === 'development') { console.log(`Attempting to parse PDF: ${fileName}, buffer size: ${buffer.length}`); }
    
    // Try to parse the PDF
    const pdfData = await pdfParse(buffer);
    
    if (process.env.NODE_ENV === 'development') { console.log(`PDF parsed successfully: ${fileName}, text length: ${pdfData?.text?.length || 0}`); }
    
    if (pdfData && pdfData.text && pdfData.text.trim().length > 0) {
      return pdfData.text;
    } else {
      return `[PDF uploaded successfully but no text content was found. This could be an image-based PDF or contain non-text content. File: ${fileName}]`;
    }
    
  } catch (error) {
    console.error('PDF parsing error for file', fileName, ':', error);
    
    // Check if it's specifically a library availability issue
    if (error instanceof Error && (
        error.message.includes('PDF parsing library not available') ||
        error.message.includes('Cannot resolve module') ||
        error.message.includes('pdf-parse') ||
        error.message.includes('MODULE_NOT_FOUND')
    )) {
      return `[Unable to extract text from PDF ${fileName}. PDF parsing library is not properly configured.]`;
    }
    
    // Return a helpful message that explains the situation
    return `[PDF file uploaded successfully but text extraction failed. 

Error: ${error instanceof Error ? error.message : 'Unknown error'}

Possible reasons:
• PDF contains only images or scanned content
• PDF is password-protected or encrypted
• PDF uses unsupported encoding
• PDF parsing library encountered an error

The file has been saved and can still be used for reference. To make this content searchable, consider:
• Converting to a text file (.txt)
• Copying and pasting the text content manually
• Using a different PDF that contains selectable text

File: ${fileName}
Upload time: ${new Date().toISOString()}]`;
  }
}

export async function extractTextFromFile(
  buffer: Buffer, 
  mimeType: string, 
  fileName: string
): Promise<string> {
  try {    switch (mimeType) {
      case 'application/pdf':
        // For PDFs, try to extract text for AI context but still show viewer
        try {
          const extractedText = await extractPdfText(buffer, fileName);
          // If we successfully extracted text, use it for AI context
          if (extractedText && !extractedText.includes('[PDF file uploaded successfully but text extraction failed') && !extractedText.includes('[Unable to extract text from PDF')) {
            return extractedText;
          }        } catch (error) {
          if (process.env.NODE_ENV === 'development') { console.log('PDF text extraction failed, using viewer-only mode:', error); }
        }
        // Fallback: PDF is available for viewing but no text for AI
        return `[PDF document available for viewing. This PDF can be viewed directly in the viewer, but text content is not available for AI analysis. File: ${fileName}]`;
      
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        const docxResult = await mammoth.extractRawText({ buffer });
        return docxResult.value;
      
      case 'application/msword':
        // For legacy .doc files, mammoth might not work perfectly
        // In a production app, you might want to use a different library
        try {
          const docResult = await mammoth.extractRawText({ buffer });
          return docResult.value;        } catch (error) {
          return `[Unable to extract text from ${fileName}. File format may not be fully supported. Error: ${error instanceof Error ? error.message : 'Unknown error'}]`;
        }
      
      case 'text/plain':
      case 'text/markdown':
        return buffer.toString('utf-8');
      
      default:
        return `[File type ${mimeType} is not supported for text extraction.]`;
    }
  } catch (error) {
    console.error(`Error extracting text from ${fileName}:`, error);
    return `[Error extracting text from ${fileName}. Please try again or use a different file format.]`;
  }
}

export function isFileTypeSupported(mimeType: string): boolean {
  const supportedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/markdown'
  ];
  
  return supportedTypes.includes(mimeType);
}

export function getMaxFileSize(): number {
  return 10 * 1024 * 1024; // 10MB
}
