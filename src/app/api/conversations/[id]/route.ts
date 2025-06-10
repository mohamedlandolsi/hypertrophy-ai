import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(
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
    const chatId = id;

    // Verify the chat belongs to the user before deleting
    const chat = await prisma.chat.findFirst({
      where: {
        id: chatId,
        userId: user.id
      }
    });

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    // Delete the chat and all associated messages (cascade delete)
    await prisma.chat.delete({
      where: {
        id: chatId
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Chat deleted successfully' 
    });

  } catch (error) {
    console.error('Delete conversation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
