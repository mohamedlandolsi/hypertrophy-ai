import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {    // Get the authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ensure user exists in our database
    await prisma.user.upsert({
      where: { id: user.id },
      update: {},
      create: { id: user.id }
    });    // Fetch conversations for the user
    const conversations = await prisma.chat.findMany({
      where: {
        userId: user.id,
      },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1, // Get only the last message for preview
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Format the response
    const formattedConversations = conversations.map(chat => ({
      id: chat.id,
      title: chat.title,
      createdAt: chat.createdAt,
      updatedAt: chat.messages[0]?.createdAt || chat.createdAt,
      lastMessage: chat.messages[0]?.content || null,
      messageCount: chat.messages.length
    }));

    return NextResponse.json({ conversations: formattedConversations });

  } catch (error) {
    console.error('Conversations API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
