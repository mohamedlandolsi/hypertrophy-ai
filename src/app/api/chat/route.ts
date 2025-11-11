import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { GoogleGenerativeAI, SchemaType, FunctionCallingMode, FunctionDeclaration } from '@google/generative-ai';
import { getContextQASystemPrompt } from '@/lib/ai/core-prompts';
import { rewriteFitnessQuery } from '@/lib/query-rewriting';
import { generateWorkoutProgram, detectWorkoutProgramIntent } from '@/lib/ai/workout-program-generator';
import { 
  extractProfileInformation,
  extractImportantMemory,
  saveProfileExtractions,
  saveConversationMemories,
  getCompleteUserContext
} from '@/lib/ai/memory-extractor';
import { 
  ApiErrorHandler, 
  ValidationError, 
  AuthenticationError,
  logger 
} from '@/lib/error-handler';
import { canUserSendMessage, incrementUserMessageCount } from '@/lib/subscription';

// Configure API route to handle large file uploads
export const maxDuration = 60; // 60 seconds timeout for image processing
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const preferredRegion = 'auto';

// Common muscle groups for strict muscle priority logic
const MUSCLE_GROUPS = [
  'chest', 'pectorals', 'pecs',
  'biceps', 'bicep',
  'triceps', 'tricep', 
  'shoulders', 'delts', 'deltoids',
  'back', 'lats', 'latissimus', 'rhomboids', 'traps', 'trapezius',
  'legs', 'quads', 'quadriceps', 'hamstrings', 'glutes', 'calves',
  'abs', 'core', 'abdominals',
  'forearms', 'forearm'
];

// Initialize Gemini client
if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is not set.");
}
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Validate image file signature (magic bytes) for security
 */
function validateImageSignature(buffer: Buffer, mimeType: string): boolean {
  if (buffer.length < 4) return false;
  
  const signature = buffer.subarray(0, 4);
  const hex = signature.toString('hex').toUpperCase();
  
  // Check common image signatures
  switch (mimeType.toLowerCase()) {
    case 'image/jpeg':
    case 'image/jpg':
      return hex.startsWith('FFD8FF');
    case 'image/png':
      return hex === '89504E47';
    case 'image/gif':
      return hex.startsWith('47494638'); // GIF87a or GIF89a
    case 'image/webp':
      // WebP files start with 'RIFF' and contain 'WEBP'
      if (buffer.length < 12) return false;
      const riff = buffer.subarray(0, 4).toString('ascii');
      const webp = buffer.subarray(8, 12).toString('ascii');
      return riff === 'RIFF' && webp === 'WEBP';
    default:
      return false;
  }
}

/**
 * Generate embedding for query using Gemini
 */
async function getEmbedding(query: string): Promise<number[]> {
  const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
  const result = await embeddingModel.embedContent(query);
  return result.embedding.values;
}

/**
 * Map UI model selection to actual Gemini model names
 */
function getGeminiModelName(selectedModel: string, config: Record<string, unknown>): string {
  const modelMap: Record<string, string> = {
    'flash': 'gemini-2.5-flash',
    'pro': 'gemini-2.5-pro'
  };
  
  // If selectedModel is provided and valid, use it
  if (selectedModel && modelMap[selectedModel]) {
    if (process.env.NODE_ENV === 'development') { console.log(`🎯 Using selected model: ${selectedModel} → ${modelMap[selectedModel]}`); }
    return modelMap[selectedModel];
  }
  
  // Fall back to config or default
  const fallbackModel = (config.proModelName as string) || 'gemini-2.5-pro';
  if (process.env.NODE_ENV === 'development') { console.log(`🔄 Using fallback model: ${fallbackModel}`); }
  return fallbackModel;
}

interface KnowledgeChunk {
  id: string;
  content: string;
  knowledgeItem: {
    title: string;
  };
}

// Tool definition for Gemini function calling  
const updateClientProfileFunction: FunctionDeclaration = {
  name: "updateClientProfile",
  description: "Updates the client's profile information in the database. Use this when the user provides new or updated personal information like their weight, goals, experience level, or injuries.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      field: {
        type: SchemaType.STRING,
        description: "The profile field to update (e.g., weight, age, goal, experienceLevel, injuries)"
      },
      value: {
        type: SchemaType.STRING, 
        description: "The new value for the specified field"
      },
      action: {
        type: SchemaType.STRING,
        description: "Use 'set' to overwrite a value or 'add' to append to a list"
      }
    },
    required: ["field", "value", "action"]
  }
};

/**
 * Handle tool call execution for profile updates
 */
async function executeToolCall(toolCall: { name: string; args: Record<string, unknown> }, userId: string): Promise<string> {
  if (toolCall.name !== 'updateClientProfile') {
    throw new Error(`Unknown tool: ${toolCall.name}`);
  }

  const { field, value, action } = toolCall.args as { field: string; value: string; action: string };

  try {
    // Get or create client memory
    let clientMemory = await prisma.clientMemory.findUnique({
      where: { userId: userId }
    });

    if (!clientMemory) {
      clientMemory = await prisma.clientMemory.create({
        data: { userId: userId }
      });
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {};

    if (action === 'set') {
      // Direct field update
      updateData[field] = value;
    } else if (action === 'add') {
      // Append to existing value (for lists like injuries)
      const currentValue = (clientMemory as Record<string, unknown>)[field] as string;
      if (currentValue) {
        updateData[field] = `${currentValue}, ${value}`;
      } else {
        updateData[field] = value;
      }
    }

    // Update the client memory
    await prisma.clientMemory.update({
      where: { userId: userId },
      data: updateData
    });

    if (process.env.NODE_ENV === 'development') { console.log(`✅ Profile updated: ${field} = ${value} (${action})`); }
    return `Successfully updated ${field} to "${value}" in your profile.`;

  } catch (error) {
    console.error('❌ Profile update error:', error);
    return `Failed to update ${field}. Please try again.`;
  }
}

/**
 * Detect mentioned muscle groups in user prompt for strict muscle priority
 */
function detectMuscleGroups(prompt: string): string[] {
  const lowerPrompt = prompt.toLowerCase();
  return MUSCLE_GROUPS.filter(muscle => lowerPrompt.includes(muscle));
}

/**
 * Perform muscle-specific vector search when strict muscle priority is enabled
 */
async function fetchMuscleSpecificKnowledge(
  query: string,
  muscleGroups: string[],
  maxChunks: number,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  similarityThreshold: number,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  highRelevanceThreshold: number
): Promise<KnowledgeChunk[]> {
  try {
    // Build muscle-specific filter for database query
    const muscleFilter = {
      OR: muscleGroups.map(muscle => ({
        OR: [
          { title: { contains: muscle, mode: 'insensitive' as const } },
          { category: { contains: muscle, mode: 'insensitive' as const } }
        ]
      }))
    };

    // Get muscle-specific knowledge chunks
    const muscleChunks = await prisma.knowledgeChunk.findMany({
      where: {
        knowledgeItem: muscleFilter
      },
      include: {
        knowledgeItem: {
          select: { title: true }
        }
      },
      take: maxChunks
    });

    // Check if we have sufficient high-relevance chunks
    const highRelevanceCount = muscleChunks.length;
    const threshold = Math.max(3, Math.floor(maxChunks * 0.5)); // At least 3 or 50% of maxChunks
    
    if (highRelevanceCount >= threshold) {
      if (process.env.NODE_ENV === 'development') { console.log(`✅ Found ${highRelevanceCount} muscle-specific chunks for: ${muscleGroups.join(', ')}`); }
      return muscleChunks;
    } else {
      if (process.env.NODE_ENV === 'development') { console.log(`⚠️ Insufficient muscle-specific chunks (${highRelevanceCount}/${threshold}), falling back to standard search`); }
      return [];
    }
  } catch (error) {
    console.error('❌ Error in muscle-specific search:', error);
    return [];
  }
}

/**
 * Format knowledge context for Gemini prompt
 */
function formatKnowledgeContext(chunks: KnowledgeChunk[]): string {
  if (chunks.length === 0) {
    return '';
  }

  const formattedChunks = chunks.map(chunk => 
    `${chunk.content}\n---`
  ).join('\n');

  return `[KNOWLEDGE]\n${formattedChunks}\n[/KNOWLEDGE]`;
}

/**
 * Format conversation history for Gemini API
 */
function formatConversationHistory(messages: Array<{ role: string; content: string }>): Array<{ role: string; parts: Array<{ text: string }> }> {
  return messages.slice(-10).map(msg => ({
    role: msg.role === 'USER' ? 'user' : 'model',
    parts: [{ text: msg.content }]
  }));
}

export async function POST(request: NextRequest) {
  const context = ApiErrorHandler.createContext(request);
  let user: { id: string } | null = null;
  
  try {
    if (process.env.NODE_ENV === 'development') { console.log("🛬 Chat API hit - New RAG Pipeline"); }
    logger.info('Chat API request received', context);
    
    // 1. Authentication Check
    const supabase = await createClient();
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    user = authUser;

    if (!user) {
      logger.info('Guest user attempted to send message - redirecting to login', { ...context, isGuest: true });
      return NextResponse.json(
        { error: 'Authentication required', message: 'Please log in to send messages' },
        { status: 401 }
      );
    }

    if (authError) {
      throw new AuthenticationError('Authentication error');
    }

    // 2. Parse Request Body
    const contentType = request.headers.get('content-type');
    let body: Record<string, unknown>;
    const imageFiles: File[] = [];
    const imageBuffers: Buffer[] = [];
    const imageMimeTypes: string[] = [];

    if (contentType?.includes('multipart/form-data')) {
      // Handle image uploads (existing logic)
      const formData = await request.formData();
      body = { 
        message: formData.get('message') as string,
        conversationId: formData.get('conversationId') as string,
        selectedModel: formData.get('selectedModel') as string
      };
      
      // Process uploaded images with enhanced security
      for (let i = 0; i < 5; i++) {
        const imageFile = formData.get(`image_${i}`) as File | null;
        if (imageFile) {
          if (process.env.NODE_ENV === 'development') { console.log(`📷 Processing image ${i + 1}: ${imageFile.name} (${imageFile.type})`); }
          
          // Enhanced security validation
          const maxFileSize = 20 * 1024 * 1024; // 20MB limit
          const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
          
          // Check file size
          if (imageFile.size > maxFileSize) {
            console.warn(`⚠️ Image ${i + 1} too large: ${imageFile.size} bytes (max: ${maxFileSize})`);
            continue;
          }
          
          // Check file type
          if (!allowedTypes.includes(imageFile.type.toLowerCase())) {
            console.warn(`⚠️ Image ${i + 1} unsupported type: ${imageFile.type}`);
            continue;
          }
          
          // Additional security: Check file signature (magic bytes)
          const buffer = Buffer.from(await imageFile.arrayBuffer());
          const isValidImage = validateImageSignature(buffer, imageFile.type);
          
          if (!isValidImage) {
            console.warn(`⚠️ Image ${i + 1} failed signature validation`);
            continue;
          }
          
          imageFiles.push(imageFile);
          imageBuffers.push(buffer);
          imageMimeTypes.push(imageFile.type);
          
          if (process.env.NODE_ENV === 'development') { console.log(`✅ Image ${i + 1} validated and processed successfully`); }
        }
      }
    } else {
      body = await request.json();
    }

    const { conversationId: rawConversationId, message, selectedModel } = body;
    const conversationId = typeof rawConversationId === 'string' && rawConversationId.trim() !== '' ? rawConversationId : undefined;

    if (process.env.NODE_ENV === 'development') { console.log("🧠 conversationId:", conversationId); }
    if (process.env.NODE_ENV === 'development') { console.log("👤 userId:", user?.id); }
    if (process.env.NODE_ENV === 'development') { console.log("📝 message length:", typeof message === 'string' ? message.length : 0); }
    if (process.env.NODE_ENV === 'development') { console.log("🤖 selectedModel:", selectedModel); }

    // 3. Validate Input
    const trimmedMessage = typeof message === 'string' ? message.trim() : '';
    if (trimmedMessage.length === 0 && imageBuffers.length === 0) {
      throw new ValidationError('Either a message or an image is required', 'content');
    }

    if (typeof message === 'string' && message.length > 2000) {
      throw new ValidationError('Message is too long (maximum 2000 characters)', 'message');
    }

    // 4. Check User Permissions
    const canSend = await canUserSendMessage();
    if (!canSend) {
      return NextResponse.json(
        { error: 'Daily message limit reached', message: 'You have reached your daily message limit' },
        { status: 429 }
      );
    }

    // 5. Fetch Configuration and Complete User Data
    if (process.env.NODE_ENV === 'development') { console.log("📋 Step 1: Fetching AI Configuration and Complete User Data..."); }
    const [config, userProfile, userContext] = await Promise.all([
      prisma.aIConfiguration.findFirst(),
      prisma.user.findUnique({
        where: { id: user.id },
        include: { clientMemory: true }
      }),
      getCompleteUserContext(user.id)
    ]);

    if (!config) {
      throw new Error('AI Configuration not found. Please configure the AI system in admin settings.');
    }

    if (process.env.NODE_ENV === 'development') { console.log(`✅ Configuration loaded - Knowledge Base: ${config.useKnowledgeBase}, Strict Muscle Priority: ${config.strictMusclePriority}`); }
    if (process.env.NODE_ENV === 'development') { console.log(`✅ User context loaded - Profile fields: ${Object.keys(userContext.profile).length}, Memories: ${userContext.memories.length}`); }

    // 6. Generate Enhanced System Prompt (will be enhanced after knowledge retrieval)
    if (process.env.NODE_ENV === 'development') { console.log("🎯 Step 2: Preparing Enhanced System Prompt with User Context..."); }
    const profileObject = userProfile?.clientMemory || {};
    
    // Add conversation memories to profile context
    const enhancedProfileObject = {
      ...profileObject,
      conversationMemories: userContext.memories,
      profileCompleteness: Object.values(userContext.profile).filter(v => v !== null && v !== undefined).length
    };

    // 7. Check for Workout Program Intent (Multi-Query RAG)
    const isWorkoutProgramRequest = detectWorkoutProgramIntent(trimmedMessage);
    
    if (isWorkoutProgramRequest && config.useKnowledgeBase) {
      if (process.env.NODE_ENV === 'development') { console.log("🏋️ Detected workout program request - using specialized multi-query RAG..."); }
      
      try {
        // Get full conversation history for context (not limited)
        let conversationHistory: Array<{ role: string; content: string }> = [];
        if (conversationId) {
          const chat = await prisma.chat.findUnique({
            where: { id: conversationId, userId: user.id },
            include: {
              messages: {
                orderBy: { createdAt: 'asc' }, // Get all messages in chronological order
              }
            }
          });
          if (chat) {
            conversationHistory = chat.messages.map((msg: { role: string; content: string }) => ({
              role: msg.role,
              content: msg.content
            }));
          }
        }

        // Generate comprehensive workout program using multi-query RAG
        const programResult = await generateWorkoutProgram(
          trimmedMessage,
          config,
          enhancedProfileObject, // Use enhanced profile with memories
          conversationHistory,
          typeof selectedModel === 'string' ? selectedModel : undefined // Pass selected model to workout program generation
        );

        // Increment message count
        await incrementUserMessageCount();

        // Save conversation
        let chatId: string = conversationId || '';
        if (!chatId) {
          const newChat = await prisma.chat.create({
            data: {
              userId: user.id,
              title: `Workout Program: ${trimmedMessage.substring(0, 50)}...`
            }
          });
          chatId = newChat.id;
        }

        // Save messages
        await Promise.all([
          prisma.message.create({
            data: {
              chatId,
              role: 'USER',
              content: trimmedMessage
            }
          }),
          prisma.message.create({
            data: {
              chatId,
              role: 'ASSISTANT',
              content: programResult.content
            }
          })
        ]);

        if (process.env.NODE_ENV === 'development') { console.log("✅ Workout program generated and saved successfully"); }

        return NextResponse.json({
          conversationId: chatId,
          response: programResult.content,
          citations: programResult.citations,
          isWorkoutProgram: true
        });

      } catch (error) {
        console.error("❌ Workout program generation failed:", error);
        // Fall back to standard RAG if program generation fails
        if (process.env.NODE_ENV === 'development') { console.log("⚠️ Falling back to standard RAG pipeline..."); }
      }
    }

    // 8. Conditional RAG Execution (Standard Flow)
    let knowledgeContext = '';
    
    if (config.useKnowledgeBase) {
      if (process.env.NODE_ENV === 'development') { console.log("📚 Step 3: Executing Standard RAG Pipeline..."); }
      let knowledgeChunks: KnowledgeChunk[] = [];

      // 9. Implement Strict Muscle Priority Logic
      if (config.strictMusclePriority) {
        if (process.env.NODE_ENV === 'development') { console.log("💪 Step 4: Checking Strict Muscle Priority..."); }
        const detectedMuscles = detectMuscleGroups(trimmedMessage);
        
        if (detectedMuscles.length > 0) {
          if (process.env.NODE_ENV === 'development') { console.log(`🎯 Detected muscle groups: ${detectedMuscles.join(', ')}`); }
          knowledgeChunks = await fetchMuscleSpecificKnowledge(
            trimmedMessage,
            detectedMuscles,
            config.ragMaxChunks,
            config.ragSimilarityThreshold,
            config.ragHighRelevanceThreshold
          );
        }
      }

      // 9. Perform Vector Search using SQL function (if needed)
      if (knowledgeChunks.length === 0) {
        if (process.env.NODE_ENV === 'development') { console.log("🔍 Step 5: Performing Vector Search using match_document_sections..."); }
        
        // Rewrite query for enhanced search results
        if (process.env.NODE_ENV === 'development') { console.log("✍️ Rewriting query for better search results..."); }
        const queryRewriteResult = await rewriteFitnessQuery(trimmedMessage);
        
        let searchQuery = trimmedMessage;
        if (queryRewriteResult.success && queryRewriteResult.rewrittenQuery) {
          searchQuery = queryRewriteResult.rewrittenQuery;
          if (process.env.NODE_ENV === 'development') { console.log(`🔄 Query rewritten: "${trimmedMessage}" → "${searchQuery}"`); }
          if (queryRewriteResult.additionalKeywords.length > 0) {
            if (process.env.NODE_ENV === 'development') { console.log(`🏷️ Additional keywords: ${queryRewriteResult.additionalKeywords.join(', ')}`); }
          }
        } else {
          if (process.env.NODE_ENV === 'development') { console.log(`⚠️ Query rewrite failed, using original: ${queryRewriteResult.error || 'Unknown error'}`); }
        }
        
        try {
          // Generate embedding for the search query
          if (process.env.NODE_ENV === 'development') { console.log("🧠 Generating embedding for search query..."); }
          const queryEmbedding = await getEmbedding(searchQuery);
          const embeddingString = JSON.stringify(queryEmbedding);
          
          // Call the SQL function using Supabase RPC
          if (process.env.NODE_ENV === 'development') { console.log("🔍 Calling match_document_sections SQL function..."); }
          const supabase = await createClient();
          const { data: searchResults, error: rpcError } = await supabase.rpc('match_document_sections', {
            query_embedding: embeddingString,
            match_threshold: config.ragSimilarityThreshold,
            match_count: config.ragMaxChunks
          });
          
          if (rpcError) {
            console.error("❌ Error calling match_document_sections:", rpcError);
            throw new Error(`SQL function error: ${rpcError.message}`);
          }
          
          // Convert SQL results to KnowledgeChunk format
          knowledgeChunks = (searchResults || []).map((result: {
            id: string;
            content: string;
            title: string;
            similarity: number;
          }) => ({
            id: result.id,
            content: result.content,
            knowledgeItem: { title: result.title }
          }));
          
          if (process.env.NODE_ENV === 'development') { console.log(`🎯 SQL vector search returned ${knowledgeChunks.length} results`); }
          
        } catch (error) {
          console.error("❌ Error in SQL vector search:", error);
          // Fallback to empty results rather than crashing
          knowledgeChunks = [];
          if (process.env.NODE_ENV === 'development') { console.log("⚠️ Continuing with empty knowledge context due to search error"); }
        }
      }

      // Format knowledge context
      knowledgeContext = formatKnowledgeContext(knowledgeChunks);
      if (process.env.NODE_ENV === 'development') { console.log(`✅ Knowledge retrieval complete: ${knowledgeChunks.length} chunks found`); }
    } else {
      if (process.env.NODE_ENV === 'development') { console.log("⏭️ Step 3-5: Skipping RAG (Knowledge Base disabled)"); }
    }

    // 9.5. Generate Enhanced Context-QA System Prompt with Full User Context
    if (process.env.NODE_ENV === 'development') { console.log("🎯 Step 6: Generating Enhanced Context-QA System Prompt with User Context..."); }
    const systemPrompt: string = await getContextQASystemPrompt(enhancedProfileObject);
    if (process.env.NODE_ENV === 'development') { console.log(`✅ Enhanced context-QA system prompt generated (${systemPrompt.length} characters)`); }
    
    // Add conversation memories to the prompt if available
    let memoryContext = '';
    if (userContext.memories.length > 0) {
      const importantMemories = userContext.memories
        .filter(memory => memory.importance >= 7)
        .slice(0, 10) // Top 10 most important memories
        .map(memory => `- ${memory.category}: ${memory.information}`)
        .join('\n');
      
      if (importantMemories) {
        memoryContext = `\n\nIMPORTANT USER CONTEXT TO REMEMBER:\n${importantMemories}\n`;
      }
    }

    // 10. Get Full Conversation History (for complete context)
    let existingMessages: Array<{ role: string; content: string }> = [];
    if (conversationId) {
      const chat = await prisma.chat.findUnique({
        where: { id: conversationId, userId: user.id },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' }, // Changed to asc and removed take limit for full history
          }
        }
      });
      if (chat) {
        existingMessages = chat.messages;
      }
    }

    // Create or get chat ID
    let chatId: string = conversationId || '';
    if (!chatId) {
      const newChat = await prisma.chat.create({
        data: {
          userId: user.id,
          title: trimmedMessage.length > 50 ? trimmedMessage.substring(0, 50) + '...' : trimmedMessage
        }
      });
      chatId = newChat.id;
    }

    // 11. Assemble Enhanced Context-QA Structured Prompt for Gemini
    if (process.env.NODE_ENV === 'development') { console.log("🔨 Step 7: Assembling Enhanced Context-QA Structured Prompt..."); }
    
    const conversationHistory = formatConversationHistory(existingMessages);
    
    // Build Enhanced Context-QA structured prompt
    let fullPrompt = `[INSTRUCTIONS]
${systemPrompt}${memoryContext}
[/INSTRUCTIONS]

[KNOWLEDGE]
${knowledgeContext || 'No specific knowledge was retrieved for this query. Use your general fitness expertise.'}
[/KNOWLEDGE]`;

    if (conversationHistory) {
      fullPrompt += `

[CONVERSATION HISTORY]
${conversationHistory}
[/CONVERSATION HISTORY]`;
    }

    fullPrompt += `

[QUESTION]
${trimmedMessage}
[/QUESTION]`;

    if (process.env.NODE_ENV === 'development') { console.log(`✅ Enhanced Context-QA structured prompt assembled (${fullPrompt.length} characters)`); }

    // 12. Save User Message with Enhanced Image Support
    const userMessage = await prisma.message.create({
      data: {
        content: trimmedMessage || (imageBuffers.length > 0 ? `[${imageBuffers.length} Image${imageBuffers.length > 1 ? 's' : ''}]` : ''),
        role: 'USER',
        chatId: chatId as string,
        // Store multiple images as JSON array for better structure
        imageData: imageBuffers.length > 0 ? JSON.stringify(
          imageBuffers.map((buffer, index) => ({
            data: buffer.toString('base64'),
            mimeType: imageMimeTypes[index] || 'image/jpeg',
            size: buffer.length,
            index: index
          }))
        ) : null,
        imageMimeType: imageBuffers.length > 0 ? JSON.stringify(imageMimeTypes) : null,
      }
    });

    // 13. Call Gemini API with Tool Calling and Image Support
    if (process.env.NODE_ENV === 'development') { console.log("🤖 Step 7: Calling Gemini API with Profile Management Tools..."); }
    
    const modelName = getGeminiModelName(typeof selectedModel === 'string' ? selectedModel : '', config);
    const model = genAI.getGenerativeModel({ 
      model: modelName,
      generationConfig: {
        temperature: config.temperature,
        topP: config.topP,
        topK: config.topK,
        maxOutputTokens: config.maxTokens,
      },
      tools: [{ functionDeclarations: [updateClientProfileFunction] }],
      toolConfig: { functionCallingConfig: { mode: FunctionCallingMode.AUTO } }
    });

    // Create chat and send message with image support
    const chat = model.startChat({
      history: conversationHistory
    });

    // Prepare message content with images
    let messageContent: (string | { text: string } | { inlineData: { data: string; mimeType: string } })[];
    
    if (imageBuffers.length > 0) {
      if (process.env.NODE_ENV === 'development') { console.log(`📷 Processing ${imageBuffers.length} image(s) for AI analysis`); }
      
      // Security validation for images
      const maxImageSize = 20 * 1024 * 1024; // 20MB per image
      const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      
      // Start with text content
      messageContent = [{ text: fullPrompt }];
      
      // Add each image
      for (let i = 0; i < imageBuffers.length && i < 5; i++) { // Limit to 5 images
        const buffer = imageBuffers[i];
        const mimeType = imageMimeTypes[i];
        
        // Security checks
        if (buffer.length > maxImageSize) {
          console.warn(`⚠️ Image ${i + 1} exceeds size limit (${buffer.length} bytes), skipping`);
          continue;
        }
        
        if (!allowedMimeTypes.includes(mimeType)) {
          console.warn(`⚠️ Image ${i + 1} has unsupported mime type (${mimeType}), skipping`);
          continue;
        }
        
        // Add image to message content
        messageContent.push({
          inlineData: {
            data: buffer.toString('base64'),
            mimeType: mimeType
          }
        });
        
        if (process.env.NODE_ENV === 'development') { console.log(`✅ Added image ${i + 1} (${mimeType}, ${(buffer.length / 1024).toFixed(1)}KB)`); }
      }
    } else {
      // Text-only message
      messageContent = [{ text: fullPrompt }];
    }

    const result = await chat.sendMessage(messageContent);
    const response = await result.response;

    // Check if the response contains tool calls
    const functionCalls = response.functionCalls();
    
    let aiContent: string;
    // finalAssistantMessage is declared but not currently used
    // let finalAssistantMessage: Record<string, unknown>;

    if (functionCalls && functionCalls.length > 0) {
      if (process.env.NODE_ENV === 'development') { console.log("🔧 Tool calls detected, executing profile updates..."); }
      
      // Execute all tool calls
      const toolResponses = [];
      for (const functionCall of functionCalls) {
        if (process.env.NODE_ENV === 'development') { console.log(`📝 Executing tool: ${functionCall.name}`); }
        const toolResult = await executeToolCall({
          name: functionCall.name,
          args: functionCall.args as Record<string, unknown>
        }, user.id);
        toolResponses.push({
          functionResponse: {
            name: functionCall.name,
            response: { content: toolResult }
          }
        });
      }

      // Make second API call with tool responses
      if (process.env.NODE_ENV === 'development') { console.log("🔄 Making second API call with tool responses..."); }
      const secondResult = await chat.sendMessage(toolResponses);
      const secondResponse = await secondResult.response;
      aiContent = secondResponse.text();

      if (process.env.NODE_ENV === 'development') { console.log(`✅ Final AI response received after tool execution (${aiContent.length} characters)`); }

    } else {
      // No tool calls, process as normal
      aiContent = response.text();
      if (process.env.NODE_ENV === 'development') { console.log(`✅ AI response received (${aiContent.length} characters)`); }
    }

    if (!aiContent || aiContent.trim().length === 0) {
      throw new Error("AI generated an empty response. Please try again.");
    }

    if (process.env.NODE_ENV === 'development') { console.log(`✅ AI response received (${aiContent.length} characters)`); }

    // 14. Save Assistant Message
    const assistantMessage = await prisma.message.create({
      data: {
        content: aiContent,
        role: 'ASSISTANT',
        chatId: chatId as string,
      }
    });

    // 14.5. Extract and Save Profile Information & Memories (Background Process)
    if (process.env.NODE_ENV === 'development') { console.log("🧠 Step 8: Extracting and saving profile information and memories..."); }
    try {
      // Extract profile information from the conversation
      const profileExtractions = await extractProfileInformation(
        trimmedMessage,
        aiContent,
        user.id
      );

      // Extract important conversation memories
      const memoryExtractions = await extractImportantMemory(
        trimmedMessage,
        aiContent,
        user.id
      );

      // Save extractions to database (run in background, don't wait)
      if (profileExtractions.length > 0) {
        saveProfileExtractions(user.id, profileExtractions).catch(error => {
          console.error('❌ Background profile extraction save failed:', error);
        });
        if (process.env.NODE_ENV === 'development') { console.log(`✅ Extracted ${profileExtractions.length} profile updates`); }
      }

      if (memoryExtractions.length > 0) {
        saveConversationMemories(user.id, memoryExtractions).catch(error => {
          console.error('❌ Background memory extraction save failed:', error);
        });
        if (process.env.NODE_ENV === 'development') { console.log(`✅ Extracted ${memoryExtractions.length} conversation memories`); }
      }

    } catch (error) {
      // Don't fail the entire request if memory extraction fails
      console.error('❌ Memory extraction error (non-critical):', error);
    }

    // 15. Increment Message Count
    await incrementUserMessageCount();

    // 16. Return Response
    if (process.env.NODE_ENV === 'development') { console.log("✅ Chat API request completed successfully"); }
    
    return NextResponse.json({
      content: aiContent,
      conversationId: chatId,
      citations: [], // TODO: Extract citations from response if needed
      userMessage: {
        id: userMessage.id,
        content: userMessage.content,
        role: userMessage.role,
        createdAt: userMessage.createdAt,
        imageData: userMessage.imageData ? `data:${userMessage.imageMimeType};base64,${userMessage.imageData}` : undefined,
        imageMimeType: userMessage.imageMimeType,
      },
      assistantMessage: {
        id: assistantMessage.id,
        content: assistantMessage.content,
        role: assistantMessage.role,
        createdAt: assistantMessage.createdAt,
      }
    });

  } catch (error) {
    console.error("❌ Chat API error:", error);
    return ApiErrorHandler.handleError(error, { ...context, userId: user?.id });
  }
}
