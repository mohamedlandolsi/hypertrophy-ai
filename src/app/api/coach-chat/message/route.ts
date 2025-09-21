import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { coachChatId, content } = await request.json();

    if (!coachChatId || !content?.trim()) {
      return NextResponse.json({ error: 'Coach chat ID and content are required' }, { status: 400 });
    }

    // Verify the chat exists and user has access to it
    const chat = await prisma.coachChat.findFirst({
      where: {
        id: coachChatId,
        OR: [
          { userId: user.id },
          { coachId: user.id }
        ]
      }
    });

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found or access denied' }, { status: 404 });
    }

    // Create the message
    const message = await prisma.coachMessage.create({
      data: {
        coachChatId,
        content: content.trim(),
        senderId: user.id
      },
      include: {
        sender: {
          select: {
            id: true
          }
        }
      }
    });

    // Update chat's updatedAt timestamp
    await prisma.coachChat.update({
      where: { id: coachChatId },
      data: { updatedAt: new Date() }
    });

    return NextResponse.json(message);
  } catch (error) {
    console.error('Error sending coach message:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
