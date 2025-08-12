// src/lib/gemini.ts

import { GoogleGenerativeAI, Content, GenerationConfig } from '@google/generative-ai';
import { prisma } from './prisma';
import {
  updateClientMemory,
  type MemoryUpdate
} from './client-memory';
import { fetchEnhancedKnowledgeContext, type KnowledgeContext } from './vector-search';
import { fetchUserProfile, type UserProfileData } from './user-profile-integration';
import { AIConfiguration, ClientMemory } from '@prisma/client';

// Initialize the Gemini client
if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is not set.");
}
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

interface ConversationMessage {
  role: 'user' | 'model';
  content: string;
  imageData?: string;
  imageMimeType?: string;
}

interface AiResponse {
  content: string;
  citations: KnowledgeContext[];
}

/**
 * Fetches the current AI configuration from the database.
 * Caches the result to avoid repeated database calls.
 */
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

/**
 * Formats various context pieces into a single string for the prompt.
 */
function formatContextForPrompt(
  profile: UserProfileData | null,
  memory: ClientMemory | null,
  knowledgeContext: KnowledgeContext[]
): string {
  let contextString = "";

  if (profile) {
    contextString += "<user_profile>\n";
    contextString += JSON.stringify(profile, null, 2);
    contextString += "\n</user_profile>\n\n";
  }

  if (memory) {
    contextString += "<long_term_memory>\n";
    contextString += JSON.stringify(memory, null, 2);
    contextString += "\n</long_term_memory>\n\n";
  }

  if (knowledgeContext.length > 0) {
    contextString += "<knowledge_base_context>\n";
    knowledgeContext.forEach(chunk => {
      contextString += `--- Source: ${chunk.title} ---\n`;
      contextString += `${chunk.content}\n`;
      contextString += `--- End Source ---\n\n`;
    });
    contextString += "</knowledge_base_context>\n";
  } else {
     contextString += "<knowledge_base_context>\nNo specific information was found in the knowledge base for this query. Use your general knowledge as a fallback, but clearly state that the information is from your general training expertise and not the specific knowledge base.\n</knowledge_base_context>\n";
  }

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


/**
 * NEW: Asynchronously updates the user's memory based on the last interaction.
 */
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

    Example 1:
    User Message: "My left shoulder has been bugging me on bench press lately."
    AI Response: "Okay, let's be careful with that. We can substitute bench press with a neutral grip machine press to see if that helps. Make sure to keep me updated on how your shoulder feels."
    JSON Output: {"newInjuries": ["Left shoulder discomfort during bench press."]}

    Example 2:
    User Message: "What's the best split for me?"
    AI Response: "Based on your goal to build overall muscle, a Full Body split 3 times a week would be a great start."
    JSON Output: {}
  `;
  
  try {
    // Use the configured free model for memory updates (lightweight operation)
    const config = await getAIConfiguration();
    const model = genAI.getGenerativeModel({ model: config.freeModelName });
    const result = await model.generateContent(memoryPrompt);
    const text = result.response.text().trim();
    
    // Validate that we received a JSON object
    if (text.startsWith('{') && text.endsWith('}')) {
      const parsedMemory = JSON.parse(text) as MemoryUpdate;
      
      // Check if there's anything to update
      const hasNewInfo = Object.values(parsedMemory).some(value => Array.isArray(value) && value.length > 0);

      if (hasNewInfo) {
        console.log(`🧠 Updating memory for user ${userId}:`, parsedMemory);
        await updateClientMemory(userId, parsedMemory);
      } else {
        console.log(`🧠 No new memory update for user ${userId}.`);
      }
    }
  } catch (error) {
    console.error("Error updating client memory:", error);
    // Non-critical error, so we don't throw. The chat can continue without a memory update.
  }
}

/**
 * Main function to generate a chat response.
 */
export async function generateChatResponse(
  userId: string,
  conversationHistory: ConversationMessage[],
  newUserMessage: string
): Promise<AiResponse> {
  try {
    // 1. Fetch AI Configuration and User Data in parallel
    const [config, userProfile, clientMemory, userData] = await Promise.all([
      getAIConfiguration(),
      fetchUserProfile(userId),
      prisma.clientMemory.findUnique({ where: { userId } }),
      prisma.user.findUnique({ 
        where: { id: userId },
        select: { plan: true }
      })
    ]);

    // 2. Fetch Relevant Knowledge from Vector DB
    const knowledgeContext = await fetchEnhancedKnowledgeContext(
      newUserMessage,
      config.ragMaxChunks,
      config.ragSimilarityThreshold,
      config.ragHighRelevanceThreshold,
      config.strictMusclePriority,
      userId
    );
    
    // 3. Construct the full prompt for Gemini
    const systemInstruction = config.systemPrompt;
    const formattedContext = formatContextForPrompt(userProfile, clientMemory, knowledgeContext);
    const formattedHistory = formatConversationHistory(conversationHistory);

    const modelName = userData?.plan === 'PRO' ? config.proModelName : config.freeModelName;
    const model = genAI.getGenerativeModel({ 
      model: modelName,
      systemInstruction: {
        role: "system",
        parts: [{ text: `${systemInstruction}\n\n${formattedContext}` }]
      }
    });
    
    const generationConfig: GenerationConfig = {
      temperature: config.temperature,
      topP: config.topP,
      topK: config.topK,
      maxOutputTokens: config.maxTokens,
    };
    
    const chat = model.startChat({ 
      history: formattedHistory,
      generationConfig
    });
    const result = await chat.sendMessage(newUserMessage);
    const aiContent = result.response.text();
    
    // 4. (Fire-and-forget) Asynchronously update the user's memory.
    // We don't await this because we want to return the response to the user ASAP.
    updateMemory(userId, newUserMessage, aiContent).catch(console.error);
    
    // 5. Return the response and citations
    return {
      content: aiContent,
      citations: knowledgeContext
    };

  } catch (error) {
    console.error("Error in generateChatResponse:", error);
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _imageBuffers?: Buffer[],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _imageMimeTypes?: string[],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _userPlan?: string
): Promise<AiResponse> {
  // Convert the conversation format
  const convertedHistory: ConversationMessage[] = conversationHistory.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    content: msg.content
  }));
  
  // Get the last user message
  const lastUserMessage = conversationHistory[conversationHistory.length - 1];
  const newUserMessage = lastUserMessage?.content || '';
  
  return generateChatResponse(userId, convertedHistory.slice(0, -1), newUserMessage);
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