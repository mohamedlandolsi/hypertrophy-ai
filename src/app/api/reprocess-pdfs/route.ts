import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractTextFromFile } from '@/lib/file-processor';
import { promises as fs } from 'fs';
import path from 'path';

export async function POST() {
  try {
    // Get all PDF knowledge items with errors
    const pdfItems = await prisma.knowledgeItem.findMany({
      where: {
        type: 'FILE',
        mimeType: 'application/pdf',
        OR: [
          { status: 'ERROR' },
          { content: { contains: 'Unable to extract text from PDF' } }
        ]
      }
    });

    const results = [];

    for (const item of pdfItems) {
      try {
        if (!item.fileName) continue;
        
        // Construct file path
        const uploadsDir = path.join(process.cwd(), 'uploads');
        const userDir = path.join(uploadsDir, item.userId);
        const filePath = path.join(userDir, item.fileName);
        
        // Check if file exists
        await fs.access(filePath);
        
        // Read and re-process the file
        const buffer = await fs.readFile(filePath);
        const extractedText = await extractTextFromFile(buffer, item.fileName, item.mimeType || 'application/pdf');
        
        // Update the knowledge item
        await prisma.knowledgeItem.update({
          where: { id: item.id },
          data: {
            content: extractedText,
            status: extractedText.includes('[Unable to extract') || extractedText.includes('[PDF file uploaded successfully but text extraction failed') ? 'ERROR' : 'READY'
          }
        });
        
        results.push({
          id: item.id,
          fileName: item.fileName,
          success: true,
          textLength: extractedText.length
        });
        
      } catch (error) {
        results.push({
          id: item.id,
          fileName: item.fileName,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      results
    });

  } catch (error) {
    console.error('Reprocess error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
