import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {    // Get the authenticated user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Ensure user exists in our database
    await prisma.user.upsert({
      where: { id: user.id },
      update: {},
      create: { id: user.id }
    });

    const { id: conversationId } = await params;

    // Fetch the conversation with all messages
    const conversation = await prisma.chat.findFirst({
      where: {
        id: conversationId,
        userId: user.id,
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Format messages for the frontend
    const messages = conversation.messages.map(msg => ({
      id: msg.id,
      role: msg.role.toLowerCase(), // Convert 'USER'/'ASSISTANT' to 'user'/'assistant'
      content: msg.content,
      createdAt: msg.createdAt,
      imageData: msg.imageData ? `data:${msg.imageMimeType};base64,${msg.imageData}` : undefined,
      imageMimeType: msg.imageMimeType || undefined,
    }));

    return NextResponse.json({
      conversation: {
        id: conversation.id,
        title: conversation.title,
        createdAt: conversation.createdAt,
        messages
      }
    });

  } catch (error) {
    console.error('Conversation messages API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
