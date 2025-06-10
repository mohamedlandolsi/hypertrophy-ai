import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { sendToGemini, formatConversationForGemini } from '@/lib/gemini';

export async function POST(request: NextRequest) {
  try {
    // Get the authenticated user
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
    });

    // Parse request body
    const body = await request.json();
    const { conversationId, message } = body;    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }    let chatId = conversationId;
    let existingMessages: Array<{ role: string; content: string }> = [];

    // If conversationId is provided, fetch existing messages
    if (conversationId) {
      const existingChat = await prisma.chat.findFirst({
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

      if (existingChat) {
        existingMessages = existingChat.messages;      } else {
        return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
      }
    } else {
      // Create a new chat if no conversationId provided
      const newChat = await prisma.chat.create({
        data: {
          title: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
          userId: user.id,        }
      });
      chatId = newChat.id;
    }

    // Add user message to database
    const userMessage = await prisma.message.create({
      data: {
        content: message,
        role: 'USER',
        chatId: chatId,
      }
    });

    // Prepare conversation history for Gemini
    const allMessages = [...existingMessages, userMessage];
    const conversationForGemini = formatConversationForGemini(allMessages);

    // Get AI response from Gemini
    const assistantReply = await sendToGemini(conversationForGemini);

    // Save assistant message to database
    const assistantMessage = await prisma.message.create({
      data: {
        content: assistantReply,
        role: 'ASSISTANT',
        chatId: chatId,
      }
    });

    // Return the response
    return NextResponse.json({
      conversationId: chatId,
      assistantReply,
      userMessage: {
        id: userMessage.id,
        content: userMessage.content,
        role: userMessage.role,
        createdAt: userMessage.createdAt,
      },
      assistantMessage: {
        id: assistantMessage.id,
        content: assistantMessage.content,
        role: assistantMessage.role,
        createdAt: assistantMessage.createdAt,
      }
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}