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
        
        console.log(`🔍 RAG search query: "${userQuery}" ${userQuery !== latestUserMessage.content ? '(translated)' : '(original)'}`);
        
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
          // Step 1: Generate embeddings for the user query
          const embeddingResult = await genAI.getGenerativeModel({ model: "text-embedding-004" })
            .embedContent(userQuery);
          const queryEmbedding = embeddingResult.embedding.values;
          
          // Step 2: Enhanced retrieval based on query type
          const workoutKeywords = [
            'workout', 'program', 'routine', 'exercise', 'training',
            'rep', 'reps', 'set', 'sets', 'rest', 'progression',
            'muscle', 'chest', 'back', 'legs', 'arms', 'shoulders',
            'bicep', 'tricep', 'quad', 'hamstring', 'glute', 'calves'
          ];
          
          const isWorkoutProgrammingQuery = workoutKeywords.some(keyword => 
            userQuery.toLowerCase().includes(keyword.toLowerCase())
          );
          
          if (isWorkoutProgrammingQuery) {
            console.log(`🏋️ Using enhanced workout programming retrieval`);
            
            try {
              allRelevantChunks = await fetchRelevantKnowledge(
                queryEmbedding,
                aiConfig.ragMaxChunks + 2, // Slightly more chunks for workout programming
                aiConfig.ragSimilarityThreshold // Use similarity threshold, not high-relevance cutoff
              );

              // Fallback pass: if recall is too low, relax the threshold and expand search slightly
              if (allRelevantChunks.length < Math.max(3, Math.floor(aiConfig.ragMaxChunks / 2))) {
                const relaxedThreshold = Math.max(0.2, aiConfig.ragSimilarityThreshold - 0.2);
                console.log(`🛠️ Low recall (${allRelevantChunks.length}). Retrying workout retrieval with relaxed threshold ${relaxedThreshold}...`);
                const extra = await fetchRelevantKnowledge(
                  queryEmbedding,
                  aiConfig.ragMaxChunks + 5,
                  relaxedThreshold
                );
                if (extra.length) {
                  const merged = new Map<string, KnowledgeContext>();
                  for (const c of [...allRelevantChunks, ...extra]) {
                    merged.set(`${c.knowledgeId}-${c.chunkIndex}`, c);
                  }
                  allRelevantChunks = Array.from(merged.values());
                  console.log(`✅ Fallback merged results: ${allRelevantChunks.length}`);
                }
              }
            } catch (vectorError: unknown) {
              const errorMessage = vectorError instanceof Error ? vectorError.message : 'Unknown error';
              console.error(`❌ Vector search failed, falling back to keyword search:`, errorMessage);
              
              // Use keyword search as fallback for workout programming queries
              allRelevantChunks = await performAndKeywordSearch(userQuery, aiConfig.ragMaxChunks);
              console.log(`🔍 Keyword fallback retrieved ${allRelevantChunks.length} chunks`);
            }
          } else {
            console.log(`🔍 Using standard vector retrieval`);
            allRelevantChunks = await fetchRelevantKnowledge(
              queryEmbedding,
              aiConfig.ragMaxChunks,
              aiConfig.ragSimilarityThreshold // Use similarity threshold for primary retrieval
            );

            // Fallback pass for non-workout queries as well
            if (allRelevantChunks.length < Math.max(2, Math.floor(aiConfig.ragMaxChunks / 2))) {
              const relaxedThreshold = Math.max(0.2, aiConfig.ragSimilarityThreshold - 0.2);
              console.log(`🛠️ Low recall (${allRelevantChunks.length}). Retrying standard retrieval with relaxed threshold ${relaxedThreshold}...`);
              const extra = await fetchRelevantKnowledge(
                queryEmbedding,
                aiConfig.ragMaxChunks + 3,
                relaxedThreshold
              );
              if (extra.length) {
                const merged = new Map<string, KnowledgeContext>();
                for (const c of [...allRelevantChunks, ...extra]) {
                  merged.set(`${c.knowledgeId}-${c.chunkIndex}`, c);
                }
                allRelevantChunks = Array.from(merged.values());
                console.log(`✅ Fallback merged results: ${allRelevantChunks.length}`);
              }
            }
          }
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

    // Enhanced system instruction with flexible knowledge base usage
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
## Knowledge Base Integration Protocol

The following information, if available, has been retrieved from your specialized knowledge base.

### Retrieved Knowledge Base Context:

${knowledgeContext}

### Response Protocol:
1. **Prioritize Knowledge Base:** You are an evidence-based coach. Your primary goal is to synthesize and apply the information from the provided knowledge base context. Your recommendations for workout programming, exercise selection, rep ranges, and training advice should be strongly grounded in this context.
2. **Synthesize, Don't Copy:** Do not simply copy-paste text from the knowledge base. Analyze, interpret, and build your response based on the provided information, just as an expert coach would from scientific literature.
3. **Fill in the Gaps with Expertise:** If the knowledge base context is relevant but incomplete (e.g., it provides principles but not a full program), use your broader expertise in exercise science, nutrition, and coaching to fill in the missing details. For example, if the context gives principles for an "Upper/Lower" split but no specific exercises, you should select appropriate exercises that align with those principles.
4. **Acknowledge Insufficient Information Gracefully:** If the knowledge base provides no relevant context for the user's query, it is acceptable to state that you don't have specific information in your specialized knowledge base on that topic. You can then provide a high-level, principles-based answer from your general knowledge, while making it clear that it's not from the specialized knowledge base.
5. **Be Smart and Interpret:** Your role is to be an intelligent coach, not just a search index. Analyze and interpret the information in the knowledge base to provide the best possible answer to the user.


### RESPONSE RULES:

**IF CONTEXT IS SUFFICIENT:**
- Build your response primarily from the provided knowledge base context
- Use the specific rep ranges, rest periods, exercises, and principles mentioned in the context
- Reference the progression methods described in the context
- Avoid adding unrelated generic advice

**IF CONTEXT IS INSUFFICIENT (SMART FALLBACK):**
Follow this ordered fallback strictly:
1) Synthesize from closely related knowledge base items and principles already retrieved (or that clearly apply) to fill minor gaps. Be explicit about which parts come from the KB.
2) If key parameters are still missing, provide concise, evidence-based guidance from your general expertise to complete the answer. Clearly label this section as "Expert guidance beyond current KB coverage" so it’s transparent. Keep it conservative and aligned with the KB philosophy.
3) End with a short note inviting the user/admin to add missing details to the knowledge base for even more precise guidance in the future.




---
` 
: 
`---
## NO KNOWLEDGE BASE CONTEXT AVAILABLE

**CRITICAL PROTOCOL**: No directly relevant items were retrieved from the knowledge base.

Respond using a transparent, two-part structure:
1) "What I can infer from related KB principles" — Briefly state any high-level principles from the KB that are reasonably applicable.
2) "Expert guidance beyond current KB coverage" — Provide a concise, evidence-based recommendation from your broader expertise to help the user move forward now. Keep it conservative and consistent with the KB’s methodology and tone. Avoid speculative or trendy claims.

Close with a single sentence inviting the user/admin to add targeted materials on this topic to the knowledge base for even more precise answers next time.
---
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
