import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { deleteEmbeddings } from '@/lib/vector-search';

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

// PUT - Update a knowledge item
export async function PUT(
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
    const { title, content } = await request.json();

    // Validate input
    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    // Check if the knowledge item exists and belongs to the user
    const existingItem = await prisma.knowledgeItem.findFirst({
      where: {
        id: id,
        userId: user.id,
        type: 'TEXT', // Only allow updating text items
      }
    });

    if (!existingItem) {
      return NextResponse.json(
        { error: 'Knowledge item not found or cannot be edited' },
        { status: 404 }
      );
    }

    // Update the knowledge item
    const updatedItem = await prisma.knowledgeItem.update({
      where: { id: id },
      data: {
        title: title.trim(),
        content: content,
        status: 'PROCESSING', // Will be updated when embeddings are regenerated
      }
    });

    // TODO: Trigger embedding regeneration in the background
    // For now, we'll set status back to READY after a brief delay
    // In production, this should trigger a background job to regenerate embeddings
    setTimeout(async () => {
      try {
        await prisma.knowledgeItem.update({
          where: { id: id },
          data: { status: 'READY' }
        });
      } catch (error) {
        console.error('Error updating status after edit:', error);
      }
    }, 2000);

    return NextResponse.json({ 
      message: 'Knowledge item updated successfully',
      knowledgeItem: updatedItem 
    });
  } catch (error) {
    console.error('Error updating knowledge item:', error);
    return NextResponse.json(
      { error: 'Failed to update knowledge item' },
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

    // Delete the embeddings first
    console.log(`🗑️ Deleting embeddings for knowledge item: ${id}`);
    try {
      await deleteEmbeddings(id);
      console.log(`✅ Embeddings deleted for knowledge item: ${id}`);
    } catch (embeddingError) {
      console.error(`❌ Failed to delete embeddings for knowledge item ${id}:`, embeddingError);
      // Continue with deleting the knowledge item even if embedding cleanup fails
    }

    // Delete the knowledge item (this will cascade delete the chunks due to Prisma schema)
    console.log(`🗑️ Deleting knowledge item: ${id}`);
    await prisma.knowledgeItem.delete({
      where: {
        id: id,
      }
    });
    console.log(`✅ Knowledge item deleted successfully: ${id}`);

    return NextResponse.json({ message: 'Knowledge item deleted successfully' });
  } catch (error) {
    console.error('Error deleting knowledge item:', error);
    return NextResponse.json(
      { error: 'Failed to delete knowledge item' },
      { status: 500 }
    );
  }
}
