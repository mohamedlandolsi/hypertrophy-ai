import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

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

    // In serverless mode, files are processed in memory and not stored on disk
    // File downloads are not available in this configuration
    return NextResponse.json({ 
      error: 'File downloads are not available in serverless mode. Files are processed in memory for text extraction only.' 
    }, { status: 400 });
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
