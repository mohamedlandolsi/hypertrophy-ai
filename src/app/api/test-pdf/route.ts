import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Test PDF processing
    const pdfPath = path.join(process.cwd(), 'uploads', '9104e76a-a73e-412b-b8d6-03064ce37347', '1749568772725-SportRxiv+Preprint+RIR+HIT_2.pdf');
    
    const buffer = await fs.readFile(pdfPath);
    
    // Import pdf-parse - using dynamic import to avoid ESLint error
    const { default: pdfParse } = await import('pdf-parse');
    
    const pdfData = await pdfParse(buffer);
    
    return NextResponse.json({
      success: true,
      textLength: pdfData.text.length,
      firstChars: pdfData.text.substring(0, 200)
    });
    
  } catch (error) {
    console.error('PDF test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
