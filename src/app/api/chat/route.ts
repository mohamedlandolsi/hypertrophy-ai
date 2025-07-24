import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { sendToGeminiWithCitations, formatConversationForGemini } from '@/lib/gemini';
import { 
  ApiErrorHandler, 
  ValidationError, 
  AuthenticationError,
  logger 
} from '@/lib/error-handler';
import { canUserSendMessage, incrementUserMessageCount } from '@/lib/subscription';

export async function POST(request: NextRequest) {
  const context = ApiErrorHandler.createContext(request);
  let user: { id: string } | null = null;
  
  try {
    console.log("🛬 Chat API hit");
    
    logger.info('Chat API request received', context);
    
    // Get the authenticated user (but don't require it for guest users)
    const supabase = await createClient();
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    user = authUser;

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
    console.log("📦 Content-Type:", contentType);
    
    if (contentType?.includes('multipart/form-data')) {
      // Handle multipart/form-data for image uploads
      console.log("🧾 Raw Request Body: [multipart]");
      const formData = await request.formData();
      body = {
        conversationId: formData.get('conversationId') as string,
        message: formData.get('message') as string,
        isGuest: formData.get('isGuest') === 'true',
      };
      
      imageFile = formData.get('image') as File;
      if (imageFile) {
        // Validate image file
        ApiErrorHandler.validateFile(imageFile, {
          maxSize: 5 * 1024 * 1024, // 5MB
          allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        });
        
        imageBuffer = Buffer.from(await imageFile.arrayBuffer());
        imageMimeType = imageFile.type;
      }
    } else {
      // Handle JSON for text-only messages
      const rawBody = await request.text();
      console.log("🧾 Raw Request Body:", rawBody);
      body = JSON.parse(rawBody);
    }
    
    console.log("✅ Parsed Body:", body);
    
    const { conversationId, message, isGuest = false } = body;

    console.log("🧠 conversationId:", conversationId);
    console.log("👤 userId:", user?.id);
    console.log("📝 message length:", message?.length);
    console.log("🎭 isGuest:", isGuest);

    logger.info('Received conversationId from frontend:', { conversationId, userId: user?.id, messageLength: message?.length });

    // Validate required fields
    if (!message || typeof message !== 'string') {
      throw new ValidationError('Message is required and must be a non-empty string', 'message');
    }

    if (message.length > 2000) {
      throw new ValidationError('Message is too long (maximum 2000 characters)', 'message');
    }

    // Handle guest users (no database operations)
    if (isGuest || !user) {
      logger.info('Processing guest user chat request', { ...context, isGuest: true });
      // For guest users, just get AI response without saving to database
      const conversationForGemini = [{ role: 'user' as const, content: message }];
      
      // Get AI response from Gemini (pass undefined for user ID since it's a guest)
      const aiResult = await sendToGeminiWithCitations(conversationForGemini, undefined, imageBuffer, imageMimeType);

      // Return JSON response for guest users
      return NextResponse.json({
        content: aiResult.content,
        conversationId: null, // No conversation ID for guests
        citations: aiResult.citations || [],
        userMessage: {
          id: Date.now().toString(), // Temporary ID
          content: message,
          role: 'USER',
          createdAt: new Date().toISOString(),
        },
        assistantMessage: {
          id: (Date.now() + 1).toString(), // Temporary ID
          content: aiResult.content,
          role: 'ASSISTANT',
          createdAt: new Date().toISOString(),
        }
      });
    }

    // Handle authenticated users (existing logic)
    if (authError) {
      throw new AuthenticationError('Authentication error');
    }

    if (!user) {
      throw new AuthenticationError('User not authenticated');
    }

    logger.info('Processing authenticated user chat request', { ...context, userId: user.id });

    // Check message limits for authenticated users
    const messageCheck = await canUserSendMessage();
    if (!messageCheck.canSend) {
      return NextResponse.json({
        error: 'MESSAGE_LIMIT_REACHED',
        message: messageCheck.reason,
        messagesRemaining: messageCheck.messagesRemaining || 0,
        requiresUpgrade: true
      }, { status: 429 });
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
      console.log("🔍 Looking for existing chat with ID:", conversationId);
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

      if (!existingChat) {
        console.warn("🚨 Chat not found or does not belong to user", {
          conversationId,
          userId: user.id,
        });
        logger.warn('Invalid conversationId provided by user', { ...context, userId: user.id, conversationId });
        throw new ValidationError(`Chat not found for ID: ${conversationId}. Please refresh the page and try again.`);
      }
      
      console.log("✅ Found existing chat with", existingChat.messages.length, "messages");
      existingMessages = existingChat.messages;
    } else {
      // Create a new chat if no conversationId provided
      console.log("🆕 Creating new chat");
      const newChat = await prisma.chat.create({
        data: {
          title: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
          userId: user.id,
        }
      });
      console.log("✅ Created new chat with ID:", newChat.id);
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

    // Get AI response from Gemini - NEW RAG SYSTEM WITH CITATIONS
    const aiResult = await sendToGeminiWithCitations(conversationForGemini, user.id, imageBuffer, imageMimeType);

    // Save assistant message to database
    const assistantMessage = await prisma.message.create({
      data: {
        content: aiResult.content,
        role: 'ASSISTANT',
        chatId: chatId as string,
      }
    });

    // Increment user's daily message count (for subscription tracking)
    await incrementUserMessageCount();

    logger.info('Chat API request completed successfully', { 
      ...context, 
      userId: user.id,
      chatId,
      messageLength: message.length,
      hasImage: !!imageBuffer,
      responseLength: aiResult.content.length,
      citationsCount: aiResult.citations?.length || 0
    });

    // Return JSON response instead of streaming for better compatibility
    // The frontend will handle the message display
    return NextResponse.json({
      content: aiResult.content,
      conversationId: chatId,
      citations: aiResult.citations || [],
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
    return ApiErrorHandler.handleError(error, { ...context, userId: user?.id });
  }
}