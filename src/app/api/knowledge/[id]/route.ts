import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

// GET - Fetch a specific knowledge item
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const knowledgeItem = await prisma.knowledgeItem.findFirst({
      where: {
        id: id,
        userId: user.id,
      }
    });

    if (!knowledgeItem) {
      return NextResponse.json(
        { error: 'Knowledge item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ knowledgeItem });
  } catch (error) {
    console.error('Error fetching knowledge item:', error);
    return NextResponse.json(
      { error: 'Failed to fetch knowledge item' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a knowledge item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    // Check if the knowledge item exists and belongs to the user
    const knowledgeItem = await prisma.knowledgeItem.findFirst({
      where: {
        id: id,
        userId: user.id,
      }
    });

    if (!knowledgeItem) {
      return NextResponse.json(
        { error: 'Knowledge item not found' },
        { status: 404 }
      );
    }

    // Delete the knowledge item
    await prisma.knowledgeItem.delete({
      where: {
        id: id,
      }
    });

    return NextResponse.json({ message: 'Knowledge item deleted successfully' });
  } catch (error) {
    console.error('Error deleting knowledge item:', error);
    return NextResponse.json(
      { error: 'Failed to delete knowledge item' },
      { status: 500 }
    );
  }
}
