import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Get the authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get pagination parameters from URL
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const skip = (page - 1) * limit;

    // Ensure user exists in our database
    await prisma.user.upsert({
      where: { id: user.id },
      update: {},
      create: { id: user.id }
    });

    // Get total count for pagination info
    const totalCount = await prisma.chat.count({
      where: {
        userId: user.id,
      }
    });

    // Fetch conversations for the user with pagination
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
      },
      skip,
      take: limit,
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

    const hasMore = skip + limit < totalCount;
    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({ 
      conversations: formattedConversations,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasMore
      }
    });

  } catch (error) {
    console.error('Conversations API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
