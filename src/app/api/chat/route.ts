import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { sendToGemini, formatConversationForGemini } from '@/lib/gemini';

export async function POST(request: NextRequest) {
  try {
    // Get the authenticated user (but don't require it for guest users)
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    // Parse request body - handle both JSON and FormData
    let body: {
      conversationId?: string;
      message: string;
      isGuest?: boolean;
    };
    let imageFile: File | null = null;
    let imageBuffer: Buffer | null = null;
    let imageMimeType: string | null = null;
    
    const contentType = request.headers.get('content-type');
    
    if (contentType?.includes('multipart/form-data')) {
      // Handle multipart/form-data for image uploads
      const formData = await request.formData();
      body = {
        conversationId: formData.get('conversationId') as string,
        message: formData.get('message') as string,
        isGuest: formData.get('isGuest') === 'true',
      };
      
      imageFile = formData.get('image') as File;
      if (imageFile) {
        imageBuffer = Buffer.from(await imageFile.arrayBuffer());
        imageMimeType = imageFile.type;
      }
    } else {
      // Handle JSON for text-only messages
      body = await request.json();
    }
    
    const { conversationId, message, isGuest = false } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Handle guest users (no database operations)
    if (isGuest || !user) {
      // For guest users, just get AI response without saving to database
      const conversationForGemini = [{ role: 'user' as const, content: message }];
      
      // Get AI response from Gemini (pass undefined for user ID since it's a guest)
      const assistantReply = await sendToGemini(conversationForGemini, undefined, imageBuffer, imageMimeType);

      return NextResponse.json({
        conversationId: null, // No conversation ID for guests
        assistantReply,
        userMessage: {
          id: Date.now().toString(), // Temporary ID
          content: message,
          role: 'USER',
          createdAt: new Date().toISOString(),
        },
        assistantMessage: {
          id: (Date.now() + 1).toString(), // Temporary ID
          content: assistantReply,
          role: 'ASSISTANT',
          createdAt: new Date().toISOString(),
        }
      });
    }

    // Handle authenticated users (existing logic)
    if (authError) {
      return NextResponse.json({ error: 'Authentication error' }, { status: 401 });
    }

    // Ensure user exists in our database
    await prisma.user.upsert({
      where: { id: user.id },
      update: {},
      create: { id: user.id }
    });

    let chatId = conversationId;
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
        chatId: chatId as string,
        imageData: imageBuffer ? imageBuffer.toString('base64') : null,
        imageMimeType: imageMimeType,
      }
    });    // Prepare conversation history for Gemini
    const allMessages = [...existingMessages, userMessage];
    const conversationForGemini = formatConversationForGemini(allMessages);

    // Get AI response from Gemini with user context for knowledge base
    const assistantReply = await sendToGemini(conversationForGemini, user.id, imageBuffer, imageMimeType);

    // Save assistant message to database
    const assistantMessage = await prisma.message.create({
      data: {
        content: assistantReply,
        role: 'ASSISTANT',
        chatId: chatId as string,
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
        imageData: userMessage.imageData ? `data:${userMessage.imageMimeType};base64,${userMessage.imageData}` : undefined,
        imageMimeType: userMessage.imageMimeType || undefined,
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