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
import { canUserSendMessage, incrementUserMessageCount, getUserPlan } from '@/lib/subscription';

// Configure API route to handle large file uploads
export const maxDuration = 60; // 60 seconds timeout for image processing
export const runtime = 'nodejs';

// Increase body size limit for this API route (Vercel allows up to 50MB for body parsing)
export const dynamic = 'force-dynamic';
export const preferredRegion = 'auto';

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

    // Early validation for guest users to avoid unnecessary processing
    if (!user) {
      logger.info('Guest user attempted to send message - redirecting to login', { ...context, isGuest: true });
      return NextResponse.json(
        { error: 'Authentication required', message: 'Please log in to send messages' },
        { status: 401 }
      );
    }

    // Get user plan early for file size validation - fetch both user data and plan info in parallel
    let currentUserPlan: 'FREE' | 'PRO' = 'FREE';
    let maxFileSize = 5 * 1024 * 1024; // Default 5MB for guests
    
    const [planInfo, messageCheck] = await Promise.all([
      getUserPlan().catch(error => {
        console.warn("⚠️ Could not get user plan, using FREE defaults:", error);
        return null;
      }),
      canUserSendMessage().catch(() => ({ 
        canSend: false, 
        reason: 'Error checking message limits',
        messagesRemaining: 0,
        freeMessagesRemaining: 0
      }))
    ]);

    if (planInfo) {
      currentUserPlan = planInfo.plan;
      maxFileSize = planInfo.limits.maxFileSize * 1024 * 1024; // Convert MB to bytes
      console.log("📋 User plan:", currentUserPlan, "- Max file size:", planInfo.limits.maxFileSize + "MB");
    }

    // Parse request body - handle both JSON and FormData
    let body: {
      conversationId?: string;
      message: string;
      isGuest?: boolean;
      selectedModel?: 'flash' | 'pro';
    };
    const imageFiles: File[] = [];
    const imageBuffers: Buffer[] = [];
    const imageMimeTypes: string[] = [];
    
    const contentType = request.headers.get('content-type');
    console.log("📦 Content-Type:", contentType);
    
    if (contentType?.includes('multipart/form-data')) {
      // Handle multipart/form-data for image uploads
      console.log("🧾 Raw Request Body: [multipart]");
      
      try {
        const formData = await request.formData();
        body = {
          conversationId: formData.get('conversationId') as string,
          message: formData.get('message') as string,
          isGuest: formData.get('isGuest') === 'true',
          selectedModel: formData.get('selectedModel') as 'flash' | 'pro',
        };
        
        // Handle multiple images
        const imageCount = parseInt(formData.get('imageCount') as string || '0');
        console.log("🖼️ Image count:", imageCount);
        
        for (let i = 0; i < imageCount; i++) {
          const imageFile = formData.get(`image_${i}`) as File;
          if (imageFile) {
            console.log(`📷 Processing image ${i + 1}: ${imageFile.name} (${(imageFile.size / 1024 / 1024).toFixed(2)}MB)`);
            
            // Validate image file with user's plan-specific limits
            ApiErrorHandler.validateFile(imageFile, {
              maxSize: maxFileSize,
              allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
            });
            
            imageFiles.push(imageFile);
            imageBuffers.push(Buffer.from(await imageFile.arrayBuffer()));
            imageMimeTypes.push(imageFile.type);
          }
        }
      } catch (error: unknown) {
        // Handle specific upload size errors
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        // Check for various types of size-related errors
        if (errorMessage?.includes('413') || 
            errorMessage?.toLowerCase().includes('too large') ||
            errorMessage?.toLowerCase().includes('request entity too large') ||
            errorMessage?.toLowerCase().includes('payload too large') ||
            errorMessage?.toLowerCase().includes('body size limit')) {
          
          const maxSizeMB = Math.floor(maxFileSize / 1024 / 1024);
          
          // Provide specific error message based on plan and platform limits
          let errorMsg = `Image file is too large. `;
          
          if (maxSizeMB >= 50) {
            // For PRO users who hit platform limits
            errorMsg += `Your ${currentUserPlan} plan allows ${maxSizeMB}MB files, but the platform has a 50MB limit. Please compress your image to under 50MB.`;
          } else {
            // For FREE users or smaller limits
            errorMsg += `Maximum allowed size is ${maxSizeMB}MB for your ${currentUserPlan} plan. Consider compressing your image or upgrading your plan.`;
          }
          
          throw new ValidationError(errorMsg, 'fileSize');
        }
        
        // Log the full error for debugging
        console.error("❌ Form data parsing error:", errorMessage);
        throw error;
      }
    } else {
      // Handle JSON for text-only messages
      const rawBody = await request.text();
      console.log("🧾 Raw Request Body:", rawBody);
      body = JSON.parse(rawBody);
    }
    
    console.log("✅ Parsed Body:", body);
    
    const { conversationId: rawConversationId, message, isGuest = false, selectedModel } = body;
    
    // Properly handle empty conversationId (treat empty string as null/undefined)
    const conversationId = rawConversationId && rawConversationId.trim() !== '' ? rawConversationId : undefined;

    console.log("🧠 conversationId:", conversationId);
    console.log("👤 userId:", user?.id);
    console.log("📝 message length:", message?.length);
    console.log("🎭 isGuest:", isGuest);
    console.log("🤖 selectedModel:", selectedModel);

    logger.info('Received conversationId from frontend:', { conversationId, userId: user?.id, messageLength: message?.length });

    // Validate required fields - allow empty message if images are present
    if (!message || typeof message !== 'string') {
      // Check if we have images - if so, allow empty message
      if (imageBuffers.length === 0) {
        throw new ValidationError('Message is required and must be a non-empty string', 'message');
      }
    }

    // Trim the message and check if we have content (text or images)
    const trimmedMessage = message?.trim() || '';
    if (trimmedMessage.length === 0 && imageBuffers.length === 0) {
      throw new ValidationError('Either a message or an image is required', 'content');
    }

    if (message && message.length > 2000) {
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

    logger.info('Processing authenticated user chat request', { ...context, userId: user.id });

    // Check message limits for authenticated users (already checked in parallel above)
    if (!messageCheck.canSend) {
      return NextResponse.json({
        error: 'MESSAGE_LIMIT_REACHED',
        message: messageCheck.reason,
        messagesRemaining: messageCheck.messagesRemaining || 0,
        freeMessagesRemaining: messageCheck.freeMessagesRemaining || 0,
        requiresUpgrade: true
      }, { status: 429 });
    }

    // Ensure user exists in our database and get their plan - run in parallel with chat lookup if needed
    const dbUserPromise = prisma.user.upsert({
      where: { id: user.id },
      update: {},
      create: { id: user.id },
      select: { plan: true }
    });
    
    const finalUserPlan = (await dbUserPromise).plan;

    let chatId = conversationId;
    let existingMessages: Array<{ role: string; content: string }> = [];

    // If conversationId is provided, fetch existing messages
    if (conversationId) {
      console.log("🔍 Looking for existing chat with ID:", conversationId);
      console.log("🔍 conversationId type:", typeof conversationId);
      console.log("🔍 conversationId length:", conversationId.length);
      
      const existingChat = await prisma.chat.findFirst({
        where: {
          id: conversationId,
          userId: user.id,
        },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
            select: {
              role: true,
              content: true,
              imageData: true,
              imageMimeType: true
            }
          }
        }
      });

      console.log("🔍 Query result:", existingChat ? "Found" : "Not found");
      
      if (!existingChat) {
        console.warn("🚨 Chat not found or does not belong to user", {
          conversationId,
          userId: user.id,
          conversationIdType: typeof conversationId,
          conversationIdLength: conversationId?.length
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

    // Prepare image data for storage
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

    // Prepare conversation history for Gemini and save user message in parallel
    const allMessages = [...existingMessages, { role: 'USER', content: trimmedMessage || (imageBuffers.length > 0 ? '[Image]' : '') }];
    const conversationForGemini = formatConversationForGemini(allMessages);

    // Save user message and get AI response in parallel for better performance
    const [userMessage, aiResult] = await Promise.all([
      // Save user message to database
      prisma.message.create({
        data: {
          content: trimmedMessage || (imageBuffers.length > 0 ? '[Image]' : ''),
          role: 'USER',
          chatId: chatId as string,
          imageData: imageDataToStore,
          imageMimeType: imageMimeTypeToStore,
        }
      }),
      // Get AI response from Gemini - NEW RAG SYSTEM WITH CITATIONS (with user's plan)
      // Pass all images to Gemini API (it supports multiple images)
      sendToGeminiWithCitations(conversationForGemini, user.id, imageBuffers, imageMimeTypes, finalUserPlan, selectedModel)
    ]);

    // Validate AI response before saving
    if (!aiResult || !aiResult.content || aiResult.content.trim().length === 0) {
      console.error("❌ Empty or invalid AI response received:", aiResult);
      throw new Error("AI generated an empty response. Please try again.");
    }

    console.log(`✅ AI response validated: ${aiResult.content.length} characters`);

    // Save assistant message and increment message count in parallel
    const [assistantMessage] = await Promise.all([
      prisma.message.create({
        data: {
          content: aiResult.content,
          role: 'ASSISTANT',
          chatId: chatId as string,
        }
      }),
      // Increment user's daily message count (for subscription tracking)
      incrementUserMessageCount()
    ]);

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