import { GoogleGenerativeAI, SchemaType, Part } from '@google/generative-ai';
import { prisma } from './prisma';
import { 
  generateMemorySummary, 
  addCoachingNote,
  updateClientMemory,
  type MemoryUpdate
} from './client-memory';
import { fetchRelevantKnowledge, type KnowledgeContext } from './vector-search';
import { generateSubQueries } from './query-generator';

// Initialize the Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Types
interface GeminiResponse {
  content: string;
  citations?: Array<{ id: string; title: string }>;
}

// Function to get AI configuration - REQUIRES admin configuration
export async function getAIConfiguration(userPlan: 'FREE' | 'PRO' = 'FREE') {
  try {
    const config = await prisma.aIConfiguration.findUnique({
      where: { id: 'singleton' }
    });

    if (!config) {
      throw new Error('AI Configuration not found. Please configure the AI system through the Admin Settings page before using the chat feature.');
    }

    // Validate required fields
    if (!config.systemPrompt || config.systemPrompt.trim() === '') {
      throw new Error('System prompt is not configured. Please set up the AI system prompt through the Admin Settings page.');
    }

    // Select model based on user plan
    const modelName = userPlan === 'PRO' ? config.proModelName : config.freeModelName;
    
    if (!modelName || modelName.trim() === '') {
      throw new Error(`AI model for ${userPlan} tier is not configured. Please select an AI model through the Admin Settings page.`);
    }

    return {
      systemPrompt: config.systemPrompt,
      modelName: modelName,
      temperature: config.temperature ?? 0.7,
      maxTokens: config.maxTokens || 3000,
      topK: config.topK || 45,
      topP: config.topP ?? 0.85,
      useKnowledgeBase: config.useKnowledgeBase ?? true,
      useClientMemory: config.useClientMemory ?? true,
      enableWebSearch: config.enableWebSearch ?? false,
      // RAG settings
      ragSimilarityThreshold: config.ragSimilarityThreshold ?? 0.6,
      ragMaxChunks: config.ragMaxChunks ?? 5,
      ragHighRelevanceThreshold: config.ragHighRelevanceThreshold ?? 0.8
    };
  } catch (error) {
    console.error('Error fetching AI configuration:', error);
    throw error; // Re-throw to prevent AI usage without proper configuration
  }
}

export interface ConversationMessage {
  role: 'user' | 'model'; // Fix: Use 'model' to match Gemini API expectations
  content: string;
  imageData?: string; // Base64 image data
  imageMimeType?: string; // Image MIME type
}

// Function definition for updating client profile
const updateClientProfileFunction = {
  name: 'update_client_profile',
  description: 'Update the client\'s profile with new personal information, training details, goals, or any other relevant data they provide. This function should be called whenever the user shares information about themselves.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      // Personal Information
      name: {
        type: SchemaType.STRING,
        description: 'The client\'s name'
      },
      age: {
        type: SchemaType.NUMBER,
        description: 'The client\'s age in years'
      },
      height: {
        type: SchemaType.NUMBER,
        description: 'The client\'s height in centimeters'
      },
      weight: {
        type: SchemaType.NUMBER,
        description: 'The client\'s weight in kilograms'
      },
      bodyFatPercentage: {
        type: SchemaType.NUMBER,
        description: 'The client\'s body fat percentage'
      },
      // Training Information
      trainingExperience: {
        type: SchemaType.STRING,
        description: 'The client\'s training experience level: beginner, intermediate, or advanced'
      },
      weeklyTrainingDays: {
        type: SchemaType.NUMBER,
        description: 'Number of training days per week'
      },
      preferredTrainingStyle: {
        type: SchemaType.STRING,
        description: 'The client\'s preferred training style'
      },
      availableTime: {
        type: SchemaType.NUMBER,
        description: 'Available time for training sessions in minutes'
      },
      // Goals and Motivation
      primaryGoal: {
        type: SchemaType.STRING,
        description: 'The client\'s primary fitness goal: muscle_gain, fat_loss, strength, endurance, general_fitness, or body_recomposition'
      },
      targetWeight: {
        type: SchemaType.NUMBER,
        description: 'Target weight in kilograms'
      },
      motivation: {
        type: SchemaType.STRING,
        description: 'What motivates the client to train'
      },
      // Health and Limitations
      injuries: {
        type: SchemaType.ARRAY,
        items: { 
          type: SchemaType.STRING 
        },
        description: 'List of current or past injuries as an array of strings'
      },
      limitations: {
        type: SchemaType.ARRAY,
        items: { 
          type: SchemaType.STRING 
        },
        description: 'Any physical or other limitations as an array of strings'
      },
      // Training Environment
      gymAccess: {
        type: SchemaType.BOOLEAN,
        description: 'Whether the client has access to a gym'
      },
      homeGym: {
        type: SchemaType.BOOLEAN,
        description: 'Whether the client has a home gym setup'
      },
      equipmentAvailable: {
        type: SchemaType.ARRAY,
        items: { 
          type: SchemaType.STRING 
        },
        description: 'List of available equipment as an array of strings'
      },
      // Progress Tracking
      currentBench: {
        type: SchemaType.NUMBER,
        description: 'Current bench press 1RM in kg'
      },
      currentSquat: {
        type: SchemaType.NUMBER,
        description: 'Current squat 1RM in kg'
      },
      currentDeadlift: {
        type: SchemaType.NUMBER,
        description: 'Current deadlift 1RM in kg'
      },
      // Communication Preferences
      preferredLanguage: {
        type: SchemaType.STRING,
        description: 'Preferred communication language'
      }
    }
  }
} as const;

// Function to detect if text contains Arabic characters
function isArabicText(text: string): boolean {
  // Arabic Unicode ranges
  const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g;
  
  // Count Arabic characters
  const arabicMatches = text.match(arabicRegex);
  const arabicCharCount = arabicMatches ? arabicMatches.length : 0;
  
  // Consider text as Arabic if it has a significant portion of Arabic characters
  const totalChars = text.replace(/\s/g, '').length; // Count non-whitespace characters
  const arabicRatio = totalChars > 0 ? arabicCharCount / totalChars : 0;
  
  return arabicRatio > 0.3; // Consider Arabic if >30% of characters are Arabic
}

// Function to detect conversation language preference
function detectConversationLanguage(conversation: ConversationMessage[]): 'arabic' | 'english' {
  // Check the last 3 user messages to determine language preference
  const recentUserMessages = conversation
    .filter(msg => msg.role === 'user')
    .slice(-3);
    
  let arabicScore = 0;
  const totalMessages = recentUserMessages.length;
  
  for (const message of recentUserMessages) {
    if (isArabicText(message.content)) {
      arabicScore++;
    }
  }
  
  // If majority of recent messages are in Arabic, respond in Arabic
  return arabicScore > totalMessages * 0.5 ? 'arabic' : 'english';
}

// Function to get the appropriate language instruction
function getLanguageInstruction(conversation: ConversationMessage[]): string {
  const detectedLanguage = detectConversationLanguage(conversation);
  
  if (detectedLanguage === 'arabic') {
    return `

CRITICAL LANGUAGE INSTRUCTION: The user has communicated in Arabic. You MUST respond entirely in Arabic using proper Modern Standard Arabic (MSA). This is not optional.

ARABIC RESPONSE REQUIREMENTS:
- Use fluent, natural Arabic throughout your entire response
- Employ proper Arabic scientific and fitness terminology
- When technical English terms don't have direct Arabic equivalents, provide the Arabic term followed by the English term in parentheses
- Maintain your authoritative, expert tone in Arabic
- Use appropriate Arabic sentence structure and grammar
- Address the user with respect using proper Arabic forms

ARABIC FITNESS TERMINOLOGY GUIDE:
- Hypertrophy: تضخم العضلات (Hypertrophy)
- Muscle growth: نمو العضلات
- Training: التدريب
- Exercise: تمرين/تمارين
- Strength: القوة
- Biomechanics: الميكانيكا الحيوية
- Physiology: علم وظائف الأعضاء
- Progressive overload: الزيادة التدريجية للحمل
- Volume: الحجم التدريبي
- Intensity: الشدة
- Frequency: التكرار/الترددد

تعليمات مهمة للغة: يجب أن تجيب باللغة العربية الفصحى الحديثة بالكامل. استخدم المصطلحات العلمية والرياضية المناسبة باللغة العربية. حافظ على طابعك المهني كخبير في علوم اللياقة البدنية مع استخدام النبرة العلمية المناسبة.`;
  }
  return '';
}

export async function sendToGemini(
  conversation: ConversationMessage[], 
  userId?: string,
  imageBuffer?: Buffer | null,
  imageMimeType?: string | null
): Promise<string> {
  const result = await sendToGeminiWithCitations(conversation, userId, imageBuffer, imageMimeType);
  return result.content;
}

export async function sendToGeminiWithCitations(
  conversation: ConversationMessage[], 
  userId?: string,
  imageBuffer?: Buffer | null,
  imageMimeType?: string | null,
  userPlan: 'FREE' | 'PRO' = 'FREE'
): Promise<GeminiResponse> {
  const geminiStartTime = Date.now();
  console.log(`🚀 Starting sendToGeminiWithCitations (User: ${userId || 'GUEST'}, Plan: ${userPlan})`);
  
  try {
    // Fetch AI configuration with user plan - will throw if not properly configured
    const aiConfig = await getAIConfiguration(userPlan);

    if (!process.env.GEMINI_API_KEY) {
      // Get the latest user message to detect language for fallback
      const latestUserMessage = conversation[conversation.length - 1];
      
      if (isArabicText(latestUserMessage.content)) {
        return {
          content: "عذراً، لم يتم تكوين مفتاح واجهة برمجة التطبيقات Gemini. يرجى التواصل مع المسؤول لتكوين النظام.",
          citations: []
        };
      }
      
      return {
        content: "Sorry, the Gemini API key is not configured. Please contact the administrator to configure the system.",
        citations: []
      };
    }

    // Get the latest user message to detect language
    const latestUserMessage = conversation[conversation.length - 1];
    const languageInstruction = getLanguageInstruction(conversation);

    // ENHANCED RAG SYSTEM: Multi-Query Retrieval for comprehensive context
    let knowledgeContext = '';
    let referencedSources: Array<{ id: string; title: string }> = [];
    
    // Allow RAG for both authenticated users AND guest users for better performance
    if (aiConfig.useKnowledgeBase) {
      const ragStart = Date.now();
      try {
        const userQuery = latestUserMessage.content;
        console.log(`🔍 MULTI-QUERY RAG: Starting retrieval for query: "${userQuery}" (User: ${userId || 'GUEST'})`);
        
        // Temporarily disable multi-query to get core search working first
        const useMultiQuery = false; // shouldUseMultiQuery(userQuery);
        console.log(`🎯 Multi-query strategy: DISABLED (temporarily for debugging)`);
        
        let allRelevantChunks: KnowledgeContext[] = [];
        
        if (useMultiQuery) {
          // Step 1: Generate sub-queries for comprehensive retrieval
          const subQueries = await generateSubQueries(userQuery);
          console.log(`📝 Generated ${subQueries.length} sub-queries:`, subQueries);
          
          // Step 2: Process ALL sub-queries in PARALLEL for maximum speed
          const retrievalPromises = subQueries.map(async (query) => {
            console.log(`🔍 Starting parallel processing for sub-query: "${query}"`);
            
            try {
              const embeddingResult = await genAI.getGenerativeModel({ model: "text-embedding-004" })
                .embedContent(query);
              const queryEmbedding = embeddingResult.embedding.values;
              const chunks = await fetchRelevantKnowledge(
                queryEmbedding,
                Math.max(aiConfig.ragMaxChunks / subQueries.length, 3), // Distribute chunks across queries
                aiConfig.ragHighRelevanceThreshold
              );
              
              console.log(`📚 Sub-query "${query}" returned ${chunks.length} chunks`);
              return chunks;
              
            } catch (queryError) {
              console.warn(`⚠️ Failed to process sub-query "${query}":`, queryError);
              return []; // Return empty array on error to not crash the whole process
            }
          });
          
          // Wait for ALL parallel searches to complete simultaneously
          console.log(`⚡ Running ${subQueries.length} queries in parallel...`);
          const startTime = Date.now();
          const allChunksNested = await Promise.all(retrievalPromises);
          const parallelTime = Date.now() - startTime;
          console.log(`🚀 Parallel retrieval completed in ${parallelTime}ms`);
          
          // Step 3: De-duplicate and combine results efficiently using Map
          const allChunks = new Map<string, KnowledgeContext>(); // Use Map for O(1) lookups
          for (const chunkList of allChunksNested) {
            for (const chunk of chunkList) {
              const chunkKey = `${chunk.knowledgeId}-${chunk.chunkIndex}`;
              if (!allChunks.has(chunkKey)) {
                allChunks.set(chunkKey, chunk);
              }
            }
          }
          
          allRelevantChunks = Array.from(allChunks.values());
          console.log(`🎯 Multi-query retrieval: Combined ${allRelevantChunks.length} unique chunks from ${subQueries.length} queries in ${parallelTime}ms`);
          
        } else {
          // Step 1: Single-query retrieval (original logic)
          const embeddingResult = await genAI.getGenerativeModel({ model: "text-embedding-004" })
            .embedContent(userQuery);
          const queryEmbedding = embeddingResult.embedding.values;
          
          allRelevantChunks = await fetchRelevantKnowledge(
            queryEmbedding,
            aiConfig.ragMaxChunks,
            aiConfig.ragHighRelevanceThreshold
          );
          
          console.log(`🔍 Single-query retrieval returned ${allRelevantChunks.length} chunks`);
        }
        
        // Step 3: Process and format the retrieved knowledge
        if (allRelevantChunks.length > 0) {
          // Sort by relevance and limit to max chunks
          const sortedChunks = allRelevantChunks
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, aiConfig.ragMaxChunks);
          
          // Group chunks by knowledge item for better context
          const groupedChunks = sortedChunks.reduce((groups, chunk) => {
            if (!groups[chunk.knowledgeId]) {
              groups[chunk.knowledgeId] = {
                title: chunk.title,
                chunks: []
              };
            }
            groups[chunk.knowledgeId].chunks.push(chunk);
            return groups;
          }, {} as Record<string, { title: string; chunks: KnowledgeContext[] }>);
            
          // Build clean context for AI (no titles/headers) and track sources separately
          const contextParts: string[] = [];
          const uniqueCitations: { id: string; title: string }[] = [];
          
          Object.entries(groupedChunks).forEach(([knowledgeId, { title, chunks }]) => {
            // Sort chunks by their original order in the document
            const sortedChunks = chunks.sort((a, b) => a.chunkIndex - b.chunkIndex);
            
            // Create clean context content for AI (no titles, headers, or source references)
            const chunkContent = sortedChunks.map(chunk => chunk.content).join('\n\n');
            contextParts.push(chunkContent);
            
            // Track unique sources for UI citations only
            if (!uniqueCitations.find(cite => cite.id === knowledgeId)) {
              uniqueCitations.push({ id: knowledgeId, title });
            }
          });
          
          // Store citations for potential return to API consumer
          referencedSources = uniqueCitations;
          knowledgeContext = contextParts.join('\n\n---\n\n');
          console.log(`📚 ${useMultiQuery ? 'MULTI-QUERY' : 'SINGLE-QUERY'} RAG: Generated context from ${Object.keys(groupedChunks).length} knowledge items (${knowledgeContext.length} chars)`);
        } else {
          console.log('📚 RAG: No relevant chunks found');
        }
        
        const ragTime = Date.now() - ragStart;
        console.log(`🔍 RAG processing completed in ${ragTime}ms`);
      } catch (error) {
        const ragTime = Date.now() - ragStart;
        console.error('❌ MULTI-QUERY RAG ERROR:', error);
        console.log(`🔍 RAG processing failed after ${ragTime}ms`);
        // Continue without knowledge context on error
      }
    }

    // Fetch client memory for personalized coaching (if enabled)
    let clientMemoryContext = '';
    if (userId && aiConfig.useClientMemory) {
      try {
        const memorySummary = await generateMemorySummary(userId);
        if (memorySummary && memorySummary !== 'No client information stored yet.') {
          clientMemoryContext = `\n\nCLIENT MEMORY (Use this to personalize your coaching):\n${memorySummary}`;
        }
      } catch (error) {
        console.error('Error fetching client memory:', error);
        // Continue without client memory if there's an error
      }
    }

    // Enhanced system instruction with structured context and explicit grounding
    const systemInstruction = `${aiConfig.systemPrompt}

${languageInstruction}

${clientMemoryContext}

${knowledgeContext ? 
`---
## Knowledge Base Context
The following information has been retrieved from the knowledge base to answer the user's query.

${knowledgeContext}
---

## Critical Instructions for Your Response
- **Prioritize Knowledge Base:** You MUST base your answer primarily on the provided "Knowledge Base Context." It is your single source of truth for this query.
- **Synthesize, Don't Repeat:** Integrate the information into your expert voice. Do not copy it verbatim.
- **Adhere to Context:** If the context contradicts your general knowledge, the context is correct. Follow it.
` 
: 
`---
## Critical Fallback Instructions
- **No Context Available:** No relevant information was found in the knowledge base for this query.
- **Be Cautious:** Provide safe, evidence-based guidance based on widely accepted scientific principles. Avoid any controversial or cutting-edge topics.
- **Do Not Hallucinate:** If you cannot provide a high-quality, evidence-based answer from your general knowledge, state that you do not have enough information to answer reliably.
`}`;

    // Get the generative model with function calling capabilities (only for authenticated users)
    const modelConfig = { 
      model: aiConfig.modelName,
      generationConfig: {
        temperature: aiConfig.temperature,
        topK: aiConfig.topK,
        topP: aiConfig.topP,
        maxOutputTokens: aiConfig.maxTokens,
      },
      systemInstruction: systemInstruction,
      // Tools will be added conditionally
      ...(userId ? {
        tools: [
          {
            functionDeclarations: [updateClientProfileFunction]
          }
        ]
      } : {})
    };

    // Log function tool availability
    if (userId) {
      console.log(`🔧 Added function tools for authenticated user: ${userId}`);
    } else {
      console.log(`👤 Guest user - no function tools added`);
    }

    const model = genAI.getGenerativeModel(modelConfig);

    // Convert conversation to Gemini format, including images in history
    const history = conversation.slice(0, -1).map(msg => {
      const parts: Part[] = [{ text: msg.content }];
      
      // Add image to history if present
      if (msg.imageData && msg.imageMimeType) {
        parts.push({
          inlineData: {
            data: msg.imageData,
            mimeType: msg.imageMimeType
          }
        });
      }
      
      return {
        role: msg.role,
        parts
      };
    });

    // Build the current message parts
    const currentMessageParts: Part[] = [{ text: latestUserMessage.content }];
    
    // Add current image if present
    if (imageBuffer && imageMimeType) {
      const base64Image = imageBuffer.toString('base64');
      currentMessageParts.push({
        inlineData: {
          data: base64Image,
          mimeType: imageMimeType
        }
      });
    }

    // Start chat session with history
    const chat = model.startChat({
      history: history,
      generationConfig: {
        temperature: aiConfig.temperature,
        topK: aiConfig.topK,
        topP: aiConfig.topP,
        maxOutputTokens: aiConfig.maxTokens,
      }
    });

    // Send the current message with performance monitoring
    console.log(`🤖 Sending message to Gemini API (${aiConfig.modelName})...`);
    const geminiStart = Date.now();
    
    // Create a timeout promise - shorter timeout for flash models
    const timeoutDuration = aiConfig.modelName.includes('pro') ? 30000 : 20000; // 30s for PRO, 20s for others
    console.log(`⏱️ Setting timeout to ${timeoutDuration/1000} seconds for ${aiConfig.modelName}`);
    
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Gemini API timeout after ${timeoutDuration/1000} seconds`)), timeoutDuration)
    );
    
    try {
      const result = await Promise.race([
        chat.sendMessage(currentMessageParts),
        timeoutPromise
      ]) as { response: { text: () => string; functionCalls?: () => Array<{ name: string; args: unknown }> } };
      
      const firstCallTime = Date.now() - geminiStart;
      console.log(`🚀 First Gemini API call completed in ${firstCallTime}ms`);
    
      // Handle function calls if present
      const functionCalls = result.response.functionCalls?.();
      if (functionCalls && functionCalls.length > 0) {
        console.log('Function calls detected:', functionCalls);
        
        for (const functionCall of functionCalls) {
          if (functionCall.name === 'update_client_profile' && userId) {
            try {
              const args = functionCall.args as MemoryUpdate;
              console.log('Updating client profile with:', args);
              await updateClientMemory(userId, args);
            } catch (error) {
              console.error('Error updating client profile:', error);
            }
          }
        }

        // Get the final response after function calls
        console.log(`🤖 Sending follow-up message to Gemini API...`);
        const followUpStart = Date.now();
        
        const followUpTimeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Follow-up Gemini API timeout after 30 seconds')), 30000)
        );
        
        const followUpResult = await Promise.race([
          chat.sendMessage([{ text: "Please provide your coaching response now." }]),
          followUpTimeoutPromise
        ]) as { response: { text: () => string } };
        
        const followUpTime = Date.now() - followUpStart;
        console.log(`🚀 Follow-up Gemini API call completed in ${followUpTime}ms`);
        
        const textStart = Date.now();
        const aiResponse = followUpResult.response.text();
        const textTime = Date.now() - textStart;
        console.log(`📄 Follow-up text extraction completed in ${textTime}ms`);

        // Log conversation for future context (ONLY for authenticated users)
        if (userId) {
          console.log(`💾 Logging follow-up conversation for user: ${userId}`);
          const loggingStart = Date.now();
          try {
            const userQuestion = latestUserMessage.content;
            
            // Log general interaction
            await addCoachingNote(
              userId, 
              `Q: ${userQuestion} | A: ${aiResponse.substring(0, 200)}${aiResponse.length > 200 ? '...' : ''}`, 
              'interactions'
            );
            
            // If the user mentioned progress, save it as a progress note
            const progressKeywords = ['gained', 'lost', 'increased', 'improved', 'achieved', 'reached', 'lifted', 'weigh', 'stronger'];
            if (progressKeywords.some(keyword => latestUserMessage.content.toLowerCase().includes(keyword))) {
              await addCoachingNote(
                userId, 
                `Progress update: ${userQuestion}`, 
                'progress'
              );
            }
            
            const loggingTime = Date.now() - loggingStart;
            console.log(`💾 Follow-up conversation logging completed in ${loggingTime}ms`);
          } catch (error) {
            console.error('Error in conversation processing:', error);
          }
        } else {
          console.log(`👤 Guest user - skipping follow-up conversation logging`);
        }
        
        const totalGeminiTime = Date.now() - geminiStartTime;
        console.log(`✅ sendToGeminiWithCitations (function call path) completed in ${totalGeminiTime}ms (User: ${userId || 'GUEST'})`);
        
        return {
          content: aiResponse,
          citations: referencedSources
        };
      } else {
        console.log(`📄 No function calls needed, extracting direct response...`);
        const textStart = Date.now();
        const aiResponse = result.response.text();
        const textTime = Date.now() - textStart;
        console.log(`📄 Text extraction completed in ${textTime}ms`);

        // Log conversation for future context (ONLY for authenticated users)
        if (userId) {
          console.log(`💾 Logging conversation for user: ${userId}`);
          const loggingStart = Date.now();
          try {
            const userQuestion = latestUserMessage.content;
            
            // Log general interaction
            await addCoachingNote(
              userId, 
              `Q: ${userQuestion} | A: ${aiResponse.substring(0, 200)}${aiResponse.length > 200 ? '...' : ''}`, 
              'interactions'
            );
            
            // If the user mentioned progress, save it as a progress note
            const progressKeywords = ['gained', 'lost', 'increased', 'improved', 'achieved', 'reached', 'lifted', 'weigh', 'stronger'];
            if (progressKeywords.some(keyword => latestUserMessage.content.toLowerCase().includes(keyword))) {
              await addCoachingNote(
                userId, 
                `Progress update: ${userQuestion}`, 
                'progress'
              );
            }
            
            const loggingTime = Date.now() - loggingStart;
            console.log(`💾 Conversation logging completed in ${loggingTime}ms`);
          } catch (error) {
            console.error('Error in conversation processing:', error);
          }
        } else {
          console.log(`👤 Guest user - skipping conversation logging`);
        }
        
        const totalGeminiTime = Date.now() - geminiStartTime;
        console.log(`✅ sendToGeminiWithCitations completed in ${totalGeminiTime}ms (User: ${userId || 'GUEST'})`);
        
        return {
          content: aiResponse,
          citations: referencedSources
        };
      }
      
    } catch (error) {
      console.error('Error during Gemini API call:', error);
      if (error instanceof Error && error.message.includes('timeout')) {
        console.log('🚨 Gemini API timed out, implementing fallback...');
        
        // Return a fallback response
        const fallbackMessage = isArabicText(latestUserMessage.content) 
          ? "عذراً، حدث تأخير في النظام. يرجى المحاولة مرة أخرى."
          : "Sorry, there was a system delay. Please try again.";
          
        return {
          content: fallbackMessage,
          citations: []
        };
      }
      throw error;
    }  } catch (error) {
    console.error('Error calling Gemini API:', error);
    
    // Handle configuration errors specifically
    if (error instanceof Error && error.message.includes('AI Configuration not found')) {
      return {
        content: "🔧 **Configuration Required**: The AI system is not yet configured. Please ask an administrator to set up the AI configuration through the Admin Settings page before using the chat feature.",
        citations: []
      };
    }
    
    if (error instanceof Error && error.message.includes('System prompt is not configured')) {
      return {
        content: "🔧 **Configuration Required**: The AI system prompt is not configured. Please ask an administrator to set up the system prompt through the Admin Settings page.",
        citations: []
      };
    }
    
    if (error instanceof Error && error.message.includes('AI model is not configured')) {
      return {
        content: "🔧 **Configuration Required**: The AI model is not selected. Please ask an administrator to select an AI model through the Admin Settings page.",
        citations: []
      };
    }
    
    throw new Error('Failed to get response from AI');
  }
}

// Helper function to format conversation for Gemini
export function formatConversationForGemini(messages: Array<{ role: string; content: string; imageData?: string | null; imageMimeType?: string | null }>): ConversationMessage[] {
  return messages.map(msg => ({
    role: msg.role === 'USER' ? 'user' : 'model', // Fix: Gemini expects 'model' not 'assistant'
    content: msg.content,
    imageData: msg.imageData || undefined,
    imageMimeType: msg.imageMimeType || undefined
  }));
}
