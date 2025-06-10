import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get the authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    // Get the knowledge item
    const knowledgeItem = await prisma.knowledgeItem.findFirst({
      where: {
        id: id,
        userId: user.id,
        type: 'FILE'
      }
    });

    if (!knowledgeItem) {
      return NextResponse.json({ error: 'Knowledge item not found' }, { status: 404 });
    }

    if (!knowledgeItem.fileName) {
      return NextResponse.json({ error: 'File not available for download' }, { status: 400 });
    }

    // Construct file path
    const uploadsDir = path.join(process.cwd(), 'uploads');
    const userDir = path.join(uploadsDir, user.id);
    const filePath = path.join(userDir, knowledgeItem.fileName);

    try {
      // Check if file exists
      await fs.access(filePath);
        // Read the file
      const fileBuffer = await fs.readFile(filePath);
      
      // Check if this is for viewing (inline) or downloading
      const url = new URL(request.url);
      const inline = url.searchParams.get('inline') === 'true';
      
      // Set appropriate headers
      const headers = new Headers();
      
      if (inline && knowledgeItem.mimeType === 'application/pdf') {
        // For PDF viewing in iframe
        headers.set('Content-Disposition', `inline; filename="${knowledgeItem.fileName}"`);
        headers.set('Content-Type', 'application/pdf');
      } else {
        // For file download
        headers.set('Content-Disposition', `attachment; filename="${knowledgeItem.fileName}"`);
        headers.set('Content-Type', knowledgeItem.mimeType || 'application/octet-stream');
      }
      
      headers.set('Content-Length', fileBuffer.length.toString());
      headers.set('Cache-Control', 'private, max-age=3600'); // Cache for 1 hour

      return new NextResponse(fileBuffer, { headers });
    } catch (fileError) {
      console.error('File access error:', fileError);
      return NextResponse.json({ error: 'File not found on disk' }, { status: 404 });
    }
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
