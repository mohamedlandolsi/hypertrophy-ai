// src/lib/gemini.ts

import { GoogleGenerativeAI, Content, GenerationConfig, Part } from '@google/generative-ai';
import { prisma } from './prisma';
import {
  updateClientMemory,
  type MemoryUpdate
} from './client-memory';
import { fetchKnowledgeContext, type KnowledgeContext } from './vector-search';
import { fetchUserProfile, type UserProfileData } from './user-profile-integration';
import { AIConfiguration, ClientMemory } from '@prisma/client';
import { 
  functionDeclarations, 
  handleProfileUpdate, 
  handleConflictDetection,
  type EnhancedMemoryUpdate 
} from './function-calling';

// Initialize the Gemini client
if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is not set.");
}
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Define interfaces for better type safety
interface ConversationMessage {
  role: 'user' | 'model';
  content: string;
}

interface AiResponse {
  content: string;
  citations: KnowledgeContext[];
}

// Caching for AI configuration to reduce database calls
let aiConfigCache: AIConfiguration | null = null;
export async function getAIConfiguration(): Promise<AIConfiguration> {
  if (aiConfigCache) {
    return aiConfigCache;
  }
  const config = await prisma.aIConfiguration.findFirst();
  if (!config) {
    throw new Error('AI Configuration not found. Please configure the AI system in admin settings.');
  }
  aiConfigCache = config;
  return config;
}

function formatContextForPrompt(
  profile: UserProfileData | null,
  memory: ClientMemory | null,
  knowledgeContext: KnowledgeContext[]
): string {
  let contextString = "### CONTEXTUAL INFORMATION ###\n\n";

  if (profile) {
    contextString += "<user_profile>\n";
    contextString += JSON.stringify(profile, null, 2);
    contextString += "\n</user_profile>\n\n";
  }

  if (memory && Object.keys(memory).length > 1) { // Check if memory has more than just the id/userId
    contextString += "<long_term_memory>\n";
    contextString += JSON.stringify(memory, null, 2);
    contextString += "\n</long_term_memory>\n\n";
  }

  if (knowledgeContext.length > 0) {
    contextString += "<knowledge_base_context>\n";
    contextString += "This is your source of truth. Synthesize your answer from these scientifically-backed guides:\n";
    knowledgeContext.forEach((chunk, index) => {
      contextString += `--- Guide Chunk ${index + 1}: ${chunk.title} (Relevance Score: ${chunk.score.toFixed(2)}) ---\n`;
      contextString += `${chunk.content}\n`;
    });
    contextString += "</knowledge_base_context>\n";
  } else {
    contextString += "<knowledge_base_context>\nNo specific information was found in the knowledge base for this query. You MUST inform the user of this and use your general expertise as a fallback.\n</knowledge_base_context>\n";
  }

  contextString += "### END CONTEXTUAL INFORMATION ###"
  return contextString;
}

/**
 * Formats conversation history for the Gemini API.
 */
function formatConversationHistory(history: ConversationMessage[]): Content[] {
    return history.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.content }]
    }));
}


async function updateMemory(userId: string, userMessage: string, aiResponse: string): Promise<void> {
  const memoryPrompt = `
    Analyze the following user message and AI response.
    Your task is to identify and extract any new, lasting, and important information about the user that should be saved to their long-term memory.
    This includes new or updated goals, new injuries or physical limitations, significant preferences (e.g., "I hate squats"), personal records, or important life events that could impact training (e.g., "I'm training for a marathon," "I'm going on vacation next month").
    Do NOT extract trivial information or one-off questions. Focus only on facts that will be important for personalizing future advice.

    **User Message:** "${userMessage}"
    **AI Response:** "${aiResponse}"

    If you found new information to save, provide it as a JSON object with one or more of the following keys: 'newGoals', 'newPreferences', 'newInjuries', 'otherNotes'.
    Each key should be an array of strings.
    If no new, lasting information is present, respond with an empty JSON object {}.
  `;
  
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    const result = await model.generateContent(memoryPrompt);
    const text = result.response.text().trim();
    
    if (text.startsWith('{') && text.endsWith('}')) {
      const parsedMemory = JSON.parse(text) as MemoryUpdate;
      
      const hasNewInfo = Object.values(parsedMemory).some(value => Array.isArray(value) && value.length > 0);

      if (hasNewInfo) {
        console.log(`🧠 Updating memory for user ${userId}:`, parsedMemory);
        await updateClientMemory(userId, parsedMemory);
      } else {
        console.log(`🧠 No new lasting memory found for user ${userId}.`);
      }
    }
  } catch (error) {
    console.error("Error updating client memory:", error);
  }
}

export async function generateChatResponse(
  userId: string,
  conversationHistory: ConversationMessage[],
  newUserMessage: string,
  selectedModel?: 'flash' | 'pro'
): Promise<AiResponse> {
  try {
    console.log("🚀 generateChatResponse called", { userId, messageLength: newUserMessage.length });
    
    // 1. Fetch AI Configuration and User Data in parallel
    console.log("📊 Fetching AI config and user data...");
    const [config, userProfile, clientMemory, userData] = await Promise.all([
      getAIConfiguration(),
      fetchUserProfile(userId),
      prisma.clientMemory.findUnique({ where: { userId } }),
      prisma.user.findUnique({ 
        where: { id: userId },
        select: { plan: true }
      })
    ]);
    
    console.log("✅ Data fetched successfully", { 
      hasConfig: !!config, 
      hasProfile: !!userProfile, 
      hasMemory: !!clientMemory, 
      userPlan: userData?.plan 
    });

    // 2. Fetch High-Quality Knowledge from Vector DB using the new logic
    console.log(`📚 Fetching KB context with threshold: ${config.ragSimilarityThreshold}`);
    const knowledgeContext = await fetchKnowledgeContext(
      newUserMessage,
      config.ragMaxChunks,
      config.ragSimilarityThreshold
    );
    console.log(`📚 Retrieved ${knowledgeContext.length} knowledge chunks.`);

    // 3. Construct the full prompt for Gemini
    console.log("🔨 Constructing prompt...");
    const systemInstruction = config.systemPrompt;
    const formattedContext = formatContextForPrompt(userProfile, clientMemory, knowledgeContext);

    const fullSystemPrompt = `${systemInstruction}\n\n${formattedContext}`;
    console.log(`📝 System prompt length: ${fullSystemPrompt.length} chars`);

    // 5. Determine which model to use based on user selection and plan
    let modelName: string;
    if (selectedModel) {
      // User has selected a specific model
      if (selectedModel === 'pro') {
        // User wants PRO model - check if they have PRO plan
        if (userData?.plan === 'PRO') {
          modelName = config.proModelName;
          console.log(`🎯 Using user-selected PRO model: ${modelName}`);
        } else {
          // User doesn't have PRO plan, fallback to flash model
          modelName = config.freeModelName;
          console.log(`⚠️ User selected PRO model but doesn't have PRO plan, using Flash model: ${modelName}`);
        }
      } else {
        // User selected flash model
        modelName = config.freeModelName;
        console.log(`🎯 Using user-selected Flash model: ${modelName}`);
      }
    } else {
      // No specific model selected, use plan-based default
      modelName = userData?.plan === 'PRO' ? config.proModelName : config.freeModelName;
      console.log(`🔄 Using plan-based model: ${modelName} (plan: ${userData?.plan || 'FREE'})`);
    }

    console.log(`🤖 Using model: ${modelName}`);
    const model = genAI.getGenerativeModel({ 
      model: modelName,
      systemInstruction: {
        role: "system",
        parts: [{ text: fullSystemPrompt }]
      },
      tools: [{
        functionDeclarations: functionDeclarations
      }]
    });
    
    const generationConfig: GenerationConfig = {
      temperature: config.temperature,
      topP: config.topP,
      topK: config.topK,
      maxOutputTokens: config.maxTokens,
    };
    
    const formattedHistory = formatConversationHistory(conversationHistory);
    const chat = model.startChat({ history: formattedHistory, generationConfig });
    
    console.log("🔄 Sending request to Gemini...");
    const result = await chat.sendMessage(newUserMessage);
    
    // Handle function calls if present
    let finalResponse = result.response;
    const functionCalls = result.response.functionCalls();
    
    if (functionCalls && functionCalls.length > 0) {
      console.log(`🛠️ Processing ${functionCalls.length} function calls...`);
      
      const functionResponses: Part[] = [];
      
      for (const functionCall of functionCalls) {
        const { name, args } = functionCall;
        console.log(`📞 Calling function: ${name}`, args);
        
        try {
          let functionResult: Record<string, unknown> = {};
          
          if (name === 'updateClientProfile') {
            await handleProfileUpdate(userId, args as EnhancedMemoryUpdate);
            functionResult = { success: true, message: 'Profile updated successfully' };
          } else if (name === 'detectProfileConflict') {
            const conflictHandled = await handleConflictDetection(userId, args as Parameters<typeof handleConflictDetection>[1]);
            functionResult = { 
              conflictDetected: true, 
              handled: conflictHandled,
              requiresUserConfirmation: (args as Record<string, unknown>).resolutionNeeded 
            };
          }
          
          functionResponses.push({
            functionResponse: {
              name: functionCall.name,
              response: functionResult
            }
          });
          
        } catch (error) {
          console.error(`❌ Error executing function ${name}:`, error);
          functionResponses.push({
            functionResponse: {
              name: functionCall.name,
              response: { error: 'Function execution failed', message: error?.toString() }
            }
          });
        }
      }
      
      // Send function responses back to the model for final response
      if (functionResponses.length > 0) {
        console.log("🔄 Sending function responses back to model...");
        const followUpResult = await chat.sendMessage(functionResponses);
        finalResponse = followUpResult.response;
      }
    }
    
    const aiContent = finalResponse.text();
    console.log(`✅ Gemini response received: ${aiContent.length} chars`);
    
    if (aiContent.length === 0) {
      console.error("❌ EMPTY RESPONSE FROM GEMINI!");
    }
    
    // 4. Asynchronously update memory without blocking the response
    updateMemory(userId, newUserMessage, aiContent).catch(console.error);
    
    // 5. Return the response and citations
    console.log("🎯 Returning response with citations");
    return {
      content: aiContent,
      citations: knowledgeContext
    };

  } catch (error) {
    console.error("❌ Error in generateChatResponse:", error);
    if (error instanceof Error) {
      console.error("❌ Error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    } else {
      console.error("❌ Unknown error type:", typeof error, error);
    }
    throw new Error("I'm sorry, I encountered an error while generating a response. Please try again.");
  }
}

/**
 * COMPATIBILITY FUNCTIONS FOR EXISTING API ROUTES
 * These functions maintain backward compatibility with existing code
 */

interface LegacyMessage {
  role: string;
  content: string;
}

/**
 * Legacy function for sending to Gemini with citations
 * @deprecated Use generateChatResponse instead
 */
export async function sendToGeminiWithCitations(
  conversationHistory: LegacyMessage[],
  userId: string,
  _imageBuffers?: Buffer[],
  _imageMimeTypes?: string[],
  _userPlan?: string,
  selectedModel?: 'flash' | 'pro'
): Promise<AiResponse> {
  // Convert the conversation format
  const convertedHistory: ConversationMessage[] = conversationHistory.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    content: msg.content
  }));
  
  // Get the last user message
  const lastUserMessage = conversationHistory[conversationHistory.length - 1];
  const newUserMessage = lastUserMessage?.content || '';
  
  return generateChatResponse(userId, convertedHistory.slice(0, -1), newUserMessage, selectedModel);
}

/**
 * Legacy function for sending to Gemini 
 * @deprecated Use generateChatResponse instead
 */
export async function sendToGemini(
  conversationHistory: LegacyMessage[],
  userId?: string
): Promise<string> {
  // Convert the conversation format
  const convertedHistory: ConversationMessage[] = conversationHistory.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    content: msg.content
  }));
  
  // Get the last user message
  const lastUserMessage = conversationHistory[conversationHistory.length - 1];
  const newUserMessage = lastUserMessage?.content || '';
  
  // Use a default userId if not provided
  const defaultUserId = userId || 'test-user';
  
  const response = await generateChatResponse(defaultUserId, convertedHistory.slice(0, -1), newUserMessage);
  return response.content;
}

/**
 * Legacy function for formatting conversation
 * @deprecated This is now handled internally in generateChatResponse
 */
export function formatConversationForGemini(history: LegacyMessage[]): LegacyMessage[] {
  return history; // Return as-is for compatibility
}