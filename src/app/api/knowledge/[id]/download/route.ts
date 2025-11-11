import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (process.env.NODE_ENV === 'development') { console.log('📥 Download API called'); }
    
    // Get the authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      if (process.env.NODE_ENV === 'development') { console.log('❌ Authentication failed:', authError); }
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    if (process.env.NODE_ENV === 'development') { console.log('📄 Fetching knowledge item:', id); }
    
    // Get the knowledge item
    const knowledgeItem = await prisma.knowledgeItem.findFirst({
      where: {
        id: id,
        userId: user.id,
        type: 'FILE'
      }
    });

    if (!knowledgeItem) {
      if (process.env.NODE_ENV === 'development') { console.log('❌ Knowledge item not found'); }
      return NextResponse.json({ error: 'Knowledge item not found' }, { status: 404 });
    }

    if (!knowledgeItem.fileName || !knowledgeItem.filePath) {
      if (process.env.NODE_ENV === 'development') { console.log('❌ File not available for download'); }
      return NextResponse.json({ error: 'File not available for download' }, { status: 400 });
    }

    if (process.env.NODE_ENV === 'development') { console.log('📥 Downloading file from Supabase Storage:', knowledgeItem.filePath); }
    
    // Download file from Supabase Storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('knowledge-files')
      .download(knowledgeItem.filePath);

    if (downloadError) {
      console.error('❌ Failed to download file from storage:', downloadError);
      return NextResponse.json(
        { error: 'Failed to download file from storage' },
        { status: 500 }
      );
    }

    if (process.env.NODE_ENV === 'development') { console.log('✅ File downloaded successfully from storage'); }

    // Return the file as a response
    return new NextResponse(fileData, {
      headers: {
        'Content-Type': knowledgeItem.mimeType || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${knowledgeItem.fileName}"`,
        'Content-Length': fileData.size.toString(),
      },
    });
  } catch (error) {
    console.error('❌ Download error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
