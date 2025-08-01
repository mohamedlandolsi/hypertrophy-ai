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
    const imageFiles: File[] = [];
    const imageBuffers: Buffer[] = [];
    const imageMimeTypes: string[] = [];
    
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
      
      // Handle multiple images
      const imageCount = parseInt(formData.get('imageCount') as string || '0');
      console.log("🖼️ Image count:", imageCount);
      
      for (let i = 0; i < imageCount; i++) {
        const imageFile = formData.get(`image_${i}`) as File;
        if (imageFile) {
          // Validate image file
          ApiErrorHandler.validateFile(imageFile, {
            maxSize: 5 * 1024 * 1024, // 5MB
            allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
          });
          
          imageFiles.push(imageFile);
          imageBuffers.push(Buffer.from(await imageFile.arrayBuffer()));
          imageMimeTypes.push(imageFile.type);
        }
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

    // Guest users must login to send messages
    if (isGuest || !user) {
      logger.info('Guest user attempted to send message - redirecting to login', { ...context, isGuest: true });
      return NextResponse.json(
        { error: 'Authentication required', message: 'Please log in to send messages' },
        { status: 401 }
      );
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

    // Ensure user exists in our database and get their plan
    const dbUser = await prisma.user.upsert({
      where: { id: user.id },
      update: {},
      create: { id: user.id },
      select: { plan: true }
    });
    
    const userPlan = dbUser.plan;

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
    let imageDataToStore: string | null = null;
    let imageMimeTypeToStore: string | null = null;
    
    if (imageBuffers.length > 0) {
      if (imageBuffers.length === 1) {
        // Single image - store directly for backward compatibility
        imageDataToStore = imageBuffers[0].toString('base64');
        imageMimeTypeToStore = imageMimeTypes[0];
      } else {
        // Multiple images - store as JSON
        const imagesJson = imageBuffers.map((buffer, index) => ({
          data: buffer.toString('base64'),
          mimeType: imageMimeTypes[index],
          name: imageFiles[index]?.name || `Image ${index + 1}`
        }));
        imageDataToStore = JSON.stringify(imagesJson);
        imageMimeTypeToStore = 'application/json'; // Indicates multiple images stored as JSON
      }
    }
    
    const userMessage = await prisma.message.create({
      data: {
        content: message,
        role: 'USER',
        chatId: chatId as string,
        imageData: imageDataToStore,
        imageMimeType: imageMimeTypeToStore,
      }
    });    // Prepare conversation history for Gemini
    const allMessages = [...existingMessages, userMessage];
    const conversationForGemini = formatConversationForGemini(allMessages);

    // Get AI response from Gemini - NEW RAG SYSTEM WITH CITATIONS (with user's plan)
    // Pass all images to Gemini API (it supports multiple images)
    const aiResult = await sendToGeminiWithCitations(conversationForGemini, user.id, imageBuffers, imageMimeTypes, userPlan);

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
      hasImage: imageBuffers.length > 0,
      responseLength: aiResult.content.length,
      citationsCount: aiResult.citations?.length || 0
    });

    // Format the user message response based on how images were stored
    const userMessageResponse: {
      id: string;
      content: string;
      role: string;
      createdAt: Date;
      imageData?: string;
      imageMimeType?: string;
      images?: Array<{ data: string; mimeType: string; name: string }>;
    } = {
      id: userMessage.id,
      content: userMessage.content,
      role: userMessage.role,
      createdAt: userMessage.createdAt,
    };
    
    if (userMessage.imageData && userMessage.imageMimeType) {
      if (userMessage.imageMimeType === 'application/json') {
        // Multiple images stored as JSON
        try {
          const imagesJson = JSON.parse(userMessage.imageData) as Array<{ data: string; mimeType: string; name: string }>;
          userMessageResponse.images = imagesJson.map((img) => ({
            data: `data:${img.mimeType};base64,${img.data}`,
            mimeType: img.mimeType,
            name: img.name
          }));
          // For backward compatibility, also set single image fields to the first image
          if (imagesJson.length > 0) {
            userMessageResponse.imageData = `data:${imagesJson[0].mimeType};base64,${imagesJson[0].data}`;
            userMessageResponse.imageMimeType = imagesJson[0].mimeType;
          }
        } catch (error) {
          console.error('Error parsing images JSON:', error);
        }
      } else {
        // Single image stored directly
        userMessageResponse.imageData = `data:${userMessage.imageMimeType};base64,${userMessage.imageData}`;
        userMessageResponse.imageMimeType = userMessage.imageMimeType;
        // Also provide in new structured format
        userMessageResponse.images = [{
          data: `data:${userMessage.imageMimeType};base64,${userMessage.imageData}`,
          mimeType: userMessage.imageMimeType,
          name: 'Image'
        }];
      }
    }

    // Return JSON response instead of streaming for better compatibility
    // The frontend will handle the message display
    return NextResponse.json({
      content: aiResult.content,
      conversationId: chatId,
      citations: aiResult.citations || [],
      userMessage: userMessageResponse,
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