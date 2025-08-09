import { GoogleGenerativeAI, SchemaType, Part } from '@google/generative-ai';
import { prisma } from './prisma';
import { 
  generateMemorySummary, 
  addCoachingNote,
  updateClientMemory,
  type MemoryUpdate
} from './client-memory';
import { fetchRelevantKnowledge, performAndKeywordSearch, type KnowledgeContext } from './vector-search';
import { generateSubQueries } from './query-generator';

// Initialize the Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Types
interface GeminiResponse {
  content: string;
  citations?: Array<{ id: string; title: string }>;
}

interface PromptFeedback {
  blockReason?: string;
  safetyRatings?: Array<{
    category: string;
    probability: string;
  }>;
}

interface GeminiAPIResponse {
  response: {
    text: () => string;
    promptFeedback?: PromptFeedback;
  };
}

interface ProcessedAIConfig {
  systemPrompt: string;
  modelName: string;
  freeModelName: string;
  proModelName: string;
  temperature: number;
  maxTokens: number;
  topK: number;
  topP: number;
  useKnowledgeBase: boolean;
  useClientMemory: boolean;
  enableWebSearch: boolean;
  ragSimilarityThreshold: number;
  ragMaxChunks: number;
  ragHighRelevanceThreshold: number;
  toolEnforcementMode: string;
}

// Simple in-memory cache for AI configuration to avoid repeated DB queries
let configCache: {
  data: ProcessedAIConfig;
  timestamp: number;
  ttl: number;
} | null = null;

const CONFIG_CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

// Function to get AI configuration - REQUIRES admin configuration
export async function getAIConfiguration(userPlan: 'FREE' | 'PRO' = 'FREE'): Promise<ProcessedAIConfig> {
  try {
    // Check cache first
    const now = Date.now();
    if (configCache && (now - configCache.timestamp) < configCache.ttl) {
      const cachedConfig = configCache.data;
      // Select model based on user plan from cached config
      const modelName = userPlan === 'PRO' ? cachedConfig.proModelName : cachedConfig.freeModelName;
      
      return {
        ...cachedConfig,
        modelName: modelName
      };
    }

    const config = await prisma.aIConfiguration.findUnique({
      where: { id: 'singleton' },
      select: {
        systemPrompt: true,
        freeModelName: true,
        proModelName: true,
        temperature: true,
        maxTokens: true,
        topK: true,
        topP: true,
        useKnowledgeBase: true,
        useClientMemory: true,
        enableWebSearch: true,
        ragSimilarityThreshold: true,
        ragMaxChunks: true,
        ragHighRelevanceThreshold: true,
        toolEnforcementMode: true
      }
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

    const processedConfig = {
      systemPrompt: config.systemPrompt,
      modelName: modelName,
      freeModelName: config.freeModelName,
      proModelName: config.proModelName,
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
      ragHighRelevanceThreshold: config.ragHighRelevanceThreshold ?? 0.8,
      // Tool enforcement mode
      toolEnforcementMode: config.toolEnforcementMode ?? 'AUTO'
    };

    // Update cache
    configCache = {
      data: processedConfig,
      timestamp: now,
      ttl: CONFIG_CACHE_TTL
    };

    return processedConfig;
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
  description: 'Update the client\'s profile with new personal information, training details, goals, health information, or any other relevant data they provide. This function should be called whenever the user shares information about themselves, their training, lifestyle, goals, health conditions, or preferences.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      // Personal Information
      name: {
        type: SchemaType.STRING,
        description: 'The client\'s name or nickname'
      },
      age: {
        type: SchemaType.NUMBER,
        description: 'The client\'s age in years'
      },
      gender: {
        type: SchemaType.STRING,
        description: 'The client\'s gender: MALE, FEMALE, OTHER, or PREFER_NOT_TO_SAY'
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
        description: 'The client\'s preferred training style (e.g., bodybuilding, powerlifting, calisthenics)'
      },
      availableTime: {
        type: SchemaType.NUMBER,
        description: 'Available time for training sessions in minutes'
      },
      activityLevel: {
        type: SchemaType.STRING,
        description: 'Overall daily activity level: SEDENTARY, LIGHT, MODERATE, ACTIVE, VERY_ACTIVE'
      },
      // Goals and Motivation
      primaryGoal: {
        type: SchemaType.STRING,
        description: 'The client\'s primary fitness goal: muscle_gain, fat_loss, strength, endurance, general_fitness, or body_recomposition'
      },
      secondaryGoals: {
        type: SchemaType.ARRAY,
        items: { 
          type: SchemaType.STRING 
        },
        description: 'Additional fitness goals as an array of strings'
      },
      targetWeight: {
        type: SchemaType.NUMBER,
        description: 'Target weight in kilograms'
      },
      targetBodyFat: {
        type: SchemaType.NUMBER,
        description: 'Target body fat percentage'
      },
      motivation: {
        type: SchemaType.STRING,
        description: 'What motivates the client to train or their reasons for pursuing fitness'
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
      medications: {
        type: SchemaType.ARRAY,
        items: { 
          type: SchemaType.STRING 
        },
        description: 'Current medications being taken as an array of strings'
      },
      allergies: {
        type: SchemaType.ARRAY,
        items: { 
          type: SchemaType.STRING 
        },
        description: 'Known allergies as an array of strings'
      },
      // Lifestyle
      sleepHours: {
        type: SchemaType.NUMBER,
        description: 'Average sleep hours per night'
      },
      supplementsUsed: {
        type: SchemaType.ARRAY,
        items: { 
          type: SchemaType.STRING 
        },
        description: 'Current supplements being used as an array of strings'
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
        description: 'Current bench press 1RM or working weight in kg'
      },
      currentSquat: {
        type: SchemaType.NUMBER,
        description: 'Current squat 1RM or working weight in kg'
      },
      currentDeadlift: {
        type: SchemaType.NUMBER,
        description: 'Current deadlift 1RM or working weight in kg'
      },
      currentOHP: {
        type: SchemaType.NUMBER,
        description: 'Current overhead press 1RM or working weight in kg'
      },
      // Communication Preferences
      preferredLanguage: {
        type: SchemaType.STRING,
        description: 'Preferred communication language (e.g., en, ar, fr)'
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

/**
 * Translate non-English queries to English for vector search compatibility
 * This ensures Arabic/French queries can find relevant English documents
 */
async function translateQueryToEnglish(query: string, sourceLanguage: 'arabic' | 'french'): Promise<string> {
  try {
    console.log(`🔄 Translating ${sourceLanguage} query for vector search: "${query}"`);
    
    const translationPrompt = sourceLanguage === 'arabic' 
      ? `Translate this Arabic text to English, preserving fitness and training terminology. Keep it concise and natural:

Arabic: ${query}

English:`
      : `Translate this French text to English, preserving fitness and training terminology. Keep it concise and natural:

French: ${query}

English:`;

    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.1, // Low temperature for consistent translation
        maxOutputTokens: 100, // Short translation
      }
    });

    const result = await model.generateContent(translationPrompt);
    const translatedQuery = result.response.text().trim();
    
    console.log(`✅ Translated query: "${translatedQuery}"`);
    return translatedQuery;
    
  } catch (error) {
    console.error(`❌ Translation failed, using original query:`, error);
    return query; // Fallback to original query
  }
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
  imageBuffers?: Buffer[] | Buffer | null,
  imageMimeTypes?: string[] | string | null,
  userPlan: 'FREE' | 'PRO' = 'FREE'
): Promise<GeminiResponse> {
  
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
      try {
  // Extract recent split intent from conversation to preserve user intent
  const recentText = conversation.slice(-3).map(m => m.content.toLowerCase()).join(' \n ');
  const recentWantsPush = /\bpush\b/.test(recentText);
  const recentWantsPull = /\bpull\b/.test(recentText);
  const recentWantsUpper = /\bupper(\s*body)?\b/.test(recentText);
  const recentWantsLower = /\blower(\s*body)?\b/.test(recentText);
  const recentWantsLegs = /\blegs?\b/.test(recentText);
  const recentSplitSignal = recentWantsPush || recentWantsPull || recentWantsUpper || recentWantsLower || recentWantsLegs;

  // CRITICAL FIX: Translate non-English queries to English for vector search
        // The knowledge base is in English, so non-English queries need translation
        let userQuery = latestUserMessage.content;
        const isArabic = isArabicText(latestUserMessage.content);
        // Improved French detection: check for French words and accented characters
        const isFrench = /\b(le|la|les|un|une|des|du|de|et|ou|pour|dans|avec|sur|par|donnez|moi|exercices?|entraînement|muscle|pectoraux|biceps|triceps|jambes|dos|épaules)\b/i.test(latestUserMessage.content) || 
                         /[àâäéèêëïîôùûüÿç]/i.test(latestUserMessage.content);
        
        if (isArabic) {
          console.log('🔄 Detected Arabic query, translating for vector search...');
          userQuery = await translateQueryToEnglish(latestUserMessage.content, 'arabic');
        } else if (isFrench) {
          console.log('🔄 Detected French query, translating for vector search...');
          userQuery = await translateQueryToEnglish(latestUserMessage.content, 'french');
        }
        
        // If the current request says "full workout" and recent messages indicate a split,
        // append the split to preserve intent (avoid matching full body docs)
        if (/\bfull\b/.test(userQuery.toLowerCase()) && recentSplitSignal) {
          const suffix = recentWantsPush ? ' push day' : recentWantsPull ? ' pull day' : recentWantsUpper ? ' upper body day' : recentWantsLower ? ' lower body day' : recentWantsLegs ? ' legs day' : '';
          if (suffix) userQuery = `${userQuery} for${suffix}`;
        }

        console.log(`🔍 RAG search query: "${userQuery}" ${userQuery !== latestUserMessage.content ? '(translated/augmented)' : '(original)'});`);
        
        // Temporarily disable multi-query to get core search working first
        const useMultiQuery = false; // shouldUseMultiQuery(userQuery);
        
        let allRelevantChunks: KnowledgeContext[] = [];
        
        if (useMultiQuery) {
          // Step 1: Generate sub-queries for comprehensive retrieval
          const subQueries = await generateSubQueries(userQuery);
          
          // Step 2: Process ALL sub-queries in PARALLEL for maximum speed
          const retrievalPromises = subQueries.map(async (query) => {
            
            try {
              const embeddingResult = await genAI.getGenerativeModel({ model: "text-embedding-004" })
                .embedContent(query);
              const queryEmbedding = embeddingResult.embedding.values;
              const chunks = await fetchRelevantKnowledge(
                queryEmbedding,
                Math.max(aiConfig.ragMaxChunks / subQueries.length, 3), // Distribute chunks across queries
                aiConfig.ragHighRelevanceThreshold
              );
              
              return chunks;
              
            } catch (queryError) {
              console.warn(`⚠️ Failed to process sub-query "${query}":`, queryError);
              return []; // Return empty array on error to not crash the whole process
            }
          });
          
          // Wait for ALL parallel searches to complete simultaneously
          const allChunksNested = await Promise.all(retrievalPromises);
          
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
          
        } else {
          // Step 1: Single-query retrieval (original logic)
          const embeddingResult = await genAI.getGenerativeModel({ model: "text-embedding-004" })
            .embedContent(userQuery);
          const queryEmbedding = embeddingResult.embedding.values;
          
          const vectorResults = await fetchRelevantKnowledge(
            queryEmbedding,
            aiConfig.ragMaxChunks,
            aiConfig.ragSimilarityThreshold,
            userId ?? undefined
          );

          // Add precise keyword matches to reinforce specificity
          // Request enough results to allow dominance selection
          const keywordResults = await performAndKeywordSearch(
            userQuery,
            Math.max(aiConfig.ragMaxChunks * 2, 10),
            userId ?? undefined
          );

          // Keyword Dominance (80/20) for muscle/split style queries
          const isMuscleOrSplitQuery = /\b(push|pull|legs?|upper|lower|anterior|posterior|chest|pecs?|back|lats?|traps?|shoulders?|delts?|biceps?|triceps?|arms?|quads?|hamstrings?|glutes?|calves?)\b/i.test(userQuery);
          const maxTotal = aiConfig.ragMaxChunks;
          const keywordSlots = isMuscleOrSplitQuery ? Math.max(1, Math.round(maxTotal * 0.8)) : Math.max(1, Math.floor(maxTotal * 0.5));
          const vectorSlots = Math.max(0, maxTotal - keywordSlots);

          // Fill slots with de-duplication, prioritizing keyword chunks first
          const selected: KnowledgeContext[] = [];
          const seen = new Set<string>();

          const addWithDedupe = (items: KnowledgeContext[], limit: number) => {
            for (const item of items) {
              if (selected.length >= maxTotal) break;
              const key = `${item.knowledgeId}-${item.chunkIndex}`;
              if (seen.has(key)) continue;
              selected.push(item);
              seen.add(key);
              if (selected.length >= limit) break;
            }
          };

          // Sort individually by their similarity descending (already typical)
          const sortedKeywords = [...keywordResults].sort((a, b) => b.similarity - a.similarity);
          const sortedVectors = [...vectorResults].sort((a, b) => b.similarity - a.similarity);

          // First fill keyword-dominant portion
          addWithDedupe(sortedKeywords, keywordSlots);
          // Then fill remaining capacity with vectors
          addWithDedupe(sortedVectors, keywordSlots + vectorSlots);

          // If still not full (e.g., not enough keyword results), backfill from the other list
          if (selected.length < maxTotal) {
            addWithDedupe(sortedKeywords, maxTotal);
          }
          if (selected.length < maxTotal) {
            addWithDedupe(sortedVectors, maxTotal);
          }

          allRelevantChunks = selected;
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
        } else {
          // No relevant chunks found
        }
        
      } catch (error) {
        console.error('❌ MULTI-QUERY RAG ERROR:', error);
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

    // Enhanced system instruction with tool enforcement awareness
    const systemInstruction = `${aiConfig.systemPrompt}

${languageInstruction}

${clientMemoryContext}

${userId ? `
---
## IMPORTANT: Client Profile Management
You have access to a function called "update_client_profile" that MUST be used whenever the user shares personal information. This is critical for providing personalized coaching.

**ALWAYS use the update_client_profile function when the user mentions ANY of the following:**
- Personal details: name, age, gender, height, weight, body fat percentage
- Training information: experience level, training days/schedule, preferred style, available time, activity level
- Goals: primary/secondary goals, target weight/body fat, motivation
- Health: injuries, limitations, medications, allergies
- Lifestyle: sleep hours, supplements, diet preferences
- Environment: gym access, home gym, available equipment
- Progress: current lift numbers (bench, squat, deadlift, OHP)
- Preferences: language, communication style

**Examples of when to call the function:**
- "I'm 25 years old" → Update age
- "I train 4 times a week" → Update weeklyTrainingDays
- "I want to build muscle" → Update primaryGoal to "muscle_gain"
- "I have knee problems" → Add "knee" to injuries array
- "I sleep 7 hours" → Update sleepHours
- "I bench 80kg" → Update currentBench

**CRITICAL:** Extract and save information even if mentioned casually in conversation. This builds a comprehensive client profile over time.
---
` : ''}

${knowledgeContext ? 
`---
## Knowledge Base Context
The following information has been retrieved from the knowledge base to answer the user's query.

${knowledgeContext}
---

## Response Instructions (${aiConfig.toolEnforcementMode} Mode)
${aiConfig.toolEnforcementMode === 'STRICT' ? 
`- **Strict Mode:** Base your answer primarily on the provided "Knowledge Base Context." If the context doesn't fully address the question, acknowledge the limitation and provide only general guidance.
- **Do NOT substitute numbers (sets, reps, rest) that are not present in the context.` 
:
`- **AUTO Mode Active:** 
  - **IF** the knowledge base context fully addresses the question: Use it as your primary source
  - **IF** the knowledge base context is incomplete or doesn't address the specific question: You are AUTHORIZED and REQUIRED to supplement with your general expertise
  - **CRITICAL:** Do NOT refuse to answer questions about fitness, nutrition, supplements, or training due to incomplete knowledge base coverage
  - **Your Role:** You are a knowledgeable fitness coach. Provide helpful, evidence-based advice using all available knowledge sources
  - **No Refusals:** Never say you "cannot provide recommendations" for fitness-related topics. You are qualified and expected to help.
  - **Never invent numeric prescriptions** (sets, reps, rest) that contradict available context; when absent, derive from KB principles present in context (e.g., rep range philosophy, intensity, frequency).`}
` 
: 
`---
## EXPERT FALLBACK MODE (${aiConfig.toolEnforcementMode} Mode)
${aiConfig.toolEnforcementMode === 'STRICT' ? 
`- **Strict Knowledge Base Mode:** No specific information was found in the knowledge base for this query.
- **Limited Response:** You may only provide general guidance and should encourage the user to upload relevant research papers or documents for more specific advice.` 
:
`- **AUTO Mode - Full Expert Access:** No specific information was found in the knowledge base for this query.
- **OVERRIDE ALL RESTRICTIONS:** Any previous constraints about requiring knowledge base content are CANCELLED for this response.
- **Use Your Full Expertise:** Apply your comprehensive knowledge of exercise science, nutrition, and fitness.
- **Be Fully Helpful:** Provide detailed, specific advice about supplements, training, nutrition, or any fitness topic.
- **When a requested split (e.g., "push") isn't present in KB, synthesize a program using the nearest KB philosophy (e.g., anterior/posterior or upper/lower) and clearly state the mapping.**
- **No Limitations:** You are authorized to give complete, helpful answers using your expert training.`}
`}`;

  // Add intent preservation and split-mapping guidance after core instructions
  const splitRules = `
---
## Split Intent Preservation (Do Not Misclassify)
- If the user says "push" or "pull", DO NOT expand to unrelated lower-body muscles. Push = chest, anterior deltoids, triceps. Pull = back (lats/traps/rhomboids), rear delts, biceps.
- If the user says "full workout" immediately after discussing a prior split day, interpret "full workout" as "complete plan for that same split day" unless they explicitly say "full body".
- Only map to anterior/posterior or upper/lower if the requested split is missing from the KB; clearly state the mapping, and keep the target muscle focus consistent with the user's original split.
`;

  const finalSystemInstruction = systemInstruction + splitRules;

    // Get the generative model with function calling capabilities (only for authenticated users)
    const modelConfig = { 
      model: aiConfig.modelName,
      generationConfig: {
        temperature: aiConfig.temperature,
        topK: aiConfig.topK,
        topP: aiConfig.topP,
        maxOutputTokens: aiConfig.maxTokens,
      },
      systemInstruction: finalSystemInstruction,
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
    
    // Add current images if present - support both single and multiple images
    if (imageBuffers && imageMimeTypes) {
      // Normalize inputs to arrays
      const bufferArray = Array.isArray(imageBuffers) ? imageBuffers : [imageBuffers];
      const mimeTypeArray = Array.isArray(imageMimeTypes) ? imageMimeTypes : [imageMimeTypes];
      
      // Add each image as a separate part
      for (let i = 0; i < bufferArray.length && i < mimeTypeArray.length; i++) {
        const buffer = bufferArray[i];
        const mimeType = mimeTypeArray[i];
        
        if (buffer && mimeType) {
          const base64Image = buffer.toString('base64');
          currentMessageParts.push({
            inlineData: {
              data: base64Image,
              mimeType: mimeType
            }
          });
        }
      }
      
      console.log(`📸 Added ${bufferArray.length} images to Gemini request`);
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
      
    
      // Handle function calls if present
      const functionCalls = result.response.functionCalls?.();
      if (functionCalls && functionCalls.length > 0) {
        
        for (const functionCall of functionCalls) {
          if (functionCall.name === 'update_client_profile' && userId) {
            try {
              const args = functionCall.args as MemoryUpdate;
              
              // Update the client memory
              await updateClientMemory(userId, args);
              
              // Add a detailed coaching note about the new information
              const infoItems = Object.entries(args)
                .filter(([, value]) => value !== undefined && value !== null)
                .map(([key, value]) => {
                  if (Array.isArray(value)) {
                    return `${key}: ${value.join(', ')}`;
                  }
                  return `${key}: ${value}`;
                })
                .join('; ');
              
              if (infoItems) {
                await addCoachingNote(
                  userId, 
                  `Client profile updated: ${infoItems}`, 
                  'profile_updates'
                );
              }
            } catch (error) {
              console.error('❌ Error updating client profile:', error);
              // Still continue with response even if memory update fails
            }
          }
        }

        // Get the final response after function calls
        
        const followUpTimeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Follow-up Gemini API timeout after 30 seconds')), 30000)
        );
        
        const followUpResult = await Promise.race([
          chat.sendMessage([{ text: "Please provide your coaching response now." }]),
          followUpTimeoutPromise
        ]) as GeminiAPIResponse;

        console.log(`🚀 Follow-up Gemini API call completed`);

        // --- START FIX: Check for safety blocks and empty responses on follow-up ---
        const followUpResponse = followUpResult.response;

        if (followUpResponse.promptFeedback?.blockReason) {
          const blockReason = followUpResponse.promptFeedback.blockReason;
          console.error(`❌ Follow-up Gemini response blocked. Reason: ${blockReason}`);
          const errorMessage = `My follow-up response was blocked by a safety filter. (Reason: ${blockReason})`;
          return {
            content: isArabicText(latestUserMessage.content) ? "تم حظر إجابتي التكميلية بسبب مرشح الأمان." : errorMessage,
            citations: []
          };
        }

        const aiResponse = followUpResponse.text();
        if (!aiResponse || aiResponse.trim() === '') {
          console.warn('⚠️ AI returned an empty string on follow-up call.');
          const emptyResponseMessage = "The AI returned an empty response after processing additional information. Please try your request again.";
          return {
            content: isArabicText(latestUserMessage.content) ? "أعاد الذكاء الاصطناعي استجابة فارغة بعد معالجة المعلومات. يرجى المحاولة مرة أخرى." : emptyResponseMessage,
            citations: []
          };
        }
        // --- END FIX ---

        // Log conversation for future context (ONLY for authenticated users)
        if (userId) {
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
            
          } catch (error) {
            console.error('Error in conversation processing:', error);
          }
        }
        
        return {
          content: aiResponse,
          citations: referencedSources
        };
      } else {
        console.log(`📄 No function calls needed, extracting direct response...`);

        // --- START FIX: Check for safety blocks and empty responses ---
        const response = (result as GeminiAPIResponse).response; // Cast to access promptFeedback

        if (response.promptFeedback?.blockReason) {
          const blockReason = response.promptFeedback.blockReason;
          console.error(`❌ Gemini response blocked. Reason: ${blockReason}`);
          const errorMessage = `My response was blocked due to a safety filter. Please try rephrasing your question. (Reason: ${blockReason})`;
          return {
            content: isArabicText(latestUserMessage.content) ? "تم حظر إجابتي بسبب مرشح الأمان. يرجى إعادة صياغة سؤالك." : errorMessage,
            citations: []
          };
        }

        const aiResponse = response.text();
        if (!aiResponse || aiResponse.trim() === '') {
          console.warn('⚠️ AI returned an empty string. This might be due to a silent filter or model refusal.');
          const emptyResponseMessage = "The AI returned an empty response. This can happen due to a content filter. Please try again or rephrase your question.";
          return {
            content: isArabicText(latestUserMessage.content) ? "أعاد الذكاء الاصطناعي استجابة فارغة. قد يكون هذا بسبب مرشح المحتوى. يرجى المحاولة مرة أخرى." : emptyResponseMessage,
            citations: []
          };
        }
        // --- END FIX ---

        // Log conversation for future context (ONLY for authenticated users)
        if (userId) {
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
            
          } catch (error) {
            console.error('Error in conversation processing:', error);
          }
        }
        
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
