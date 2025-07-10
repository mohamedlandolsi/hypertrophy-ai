import { GoogleGenerativeAI, SchemaType, Part } from '@google/generative-ai';
import { prisma } from './prisma';
import { 
  extractAndSaveInformationLegacy, 
  generateMemorySummary, 
  addCoachingNote,
  updateClientMemory,
  type MemoryUpdate
} from './client-memory';
import { getRelevantContext } from './vector-search';

// Initialize the Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Function to get AI configuration - REQUIRES admin configuration
async function getAIConfiguration() {
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

    if (!config.modelName || config.modelName.trim() === '') {
      throw new Error('AI model is not configured. Please select an AI model through the Admin Settings page.');
    }

    return {
      systemPrompt: config.systemPrompt,
      modelName: config.modelName,
      temperature: config.temperature ?? 0.7,
      maxTokens: config.maxTokens || 3000,
      topK: config.topK || 45,
      topP: config.topP ?? 0.85,
      useKnowledgeBase: config.useKnowledgeBase ?? true,
      useClientMemory: config.useClientMemory ?? true,
      enableWebSearch: config.enableWebSearch ?? false
    };
  } catch (error) {
    console.error('Error fetching AI configuration:', error);
    throw error; // Re-throw to prevent AI usage without proper configuration
  }
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
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

// Handler for the update client profile function call
async function handleUpdateClientProfile(userId: string, functionArgs: Record<string, unknown>): Promise<string> {
  try {
    // Convert the function arguments to MemoryUpdate format
    const updates: MemoryUpdate = {};
    
    // Map function arguments to MemoryUpdate properties
    Object.keys(functionArgs).forEach(key => {
      if (functionArgs[key] !== undefined && functionArgs[key] !== null) {
        (updates as Record<string, unknown>)[key] = functionArgs[key];
      }
    });

    // Update the client memory
    await updateClientMemory(userId, updates);
    
    // Add a coaching note about the update
    const updatedFields = Object.keys(updates).join(', ');
    await addCoachingNote(
      userId, 
      `Profile updated via LLM function call: ${updatedFields}`, 
      'profile_updates'
    );

    // Return a summary of what was updated
    const updateSummary = Object.entries(updates).map(([key, value]) => {
      if (Array.isArray(value)) {
        return `${key}: ${value.join(', ')}`;
      }
      return `${key}: ${value}`;
    }).join('; ');

    return `Successfully updated client profile: ${updateSummary}`;
  } catch (error) {
    console.error('Error updating client profile:', error);
    return 'Failed to update client profile';
  }
}

// Function to detect if text contains Arabic characters
function isArabicText(text: string): boolean {
  // Arabic Unicode ranges:
  // U+0600-U+06FF: Arabic
  // U+0750-U+077F: Arabic Supplement
  // U+08A0-U+08FF: Arabic Extended-A
  // U+FB50-U+FDFF: Arabic Presentation Forms-A
  // U+FE70-U+FEFF: Arabic Presentation Forms-B
  const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g;
  
  // Count Arabic characters
  const arabicMatches = text.match(arabicRegex);
  const arabicCharCount = arabicMatches ? arabicMatches.length : 0;
  
  // Consider text as Arabic if it has a significant portion of Arabic characters
  // This helps handle mixed content with some English technical terms
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

// Function to expand query for better retrieval
async function expandQueryForRetrieval(query: string): Promise<string> {
  try {
    // Skip expansion for very short queries or if API key is not available
    if (query.length < 8 || !process.env.GEMINI_API_KEY) {
      return query;
    }

    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 100,
      }
    });

    const prompt = `You are a query expansion expert for fitness and hypertrophy knowledge retrieval.

Original query: "${query}"

Task: Expand this query to improve retrieval from a fitness science knowledge base. Add relevant synonyms, scientific terms, and related concepts that would help find the right information.

Rules:
- Keep it concise (1-2 sentences max)
- Add scientific terminology
- Include alternative phrasings
- Focus on fitness, training, nutrition, and exercise science
- Don't change the core meaning

For example:
- "perception of effort" → "perception of effort RPE rate of perceived exertion RIR repetitions in reserve training intensity subjective effort"
- "forearm training" → "forearm training wrist flexors extensors grip strength hand muscle development"

Expanded query:`;

    const result = await model.generateContent(prompt);
    const expandedQuery = result.response.text().trim();

    // Use expanded query if it's reasonable, otherwise fall back to original
    if (expandedQuery.length > 5 && expandedQuery.length < 300) {
      console.log(`🔍 Query expansion: "${query}" → "${expandedQuery}"`);
      return expandedQuery;
    } else {
      return query;
    }

  } catch (error) {
    console.error('Error expanding query:', error);
    return query; // Fallback to original query
  }
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
  try {
    // Fetch AI configuration - will throw if not properly configured
    const aiConfig = await getAIConfiguration();

    if (!process.env.GEMINI_API_KEY) {
      // Get the latest user message to detect language for fallback
      const latestUserMessage = conversation[conversation.length - 1];
      
      if (isArabicText(latestUserMessage.content)) {
        return "عذراً، لم يتم تكوين مفتاح واجهة برمجة التطبيقات Gemini. يرجى التواصل مع المسؤول لتكوين النظام.";
      }
      
      return "Sorry, the Gemini API key is not configured. Please contact the administrator to configure the system.";
    }    // Get the latest user message to detect language
    const latestUserMessage = conversation[conversation.length - 1];
    const languageInstruction = getLanguageInstruction(conversation);

    // Fetch user's knowledge base content using enhanced vector search (if enabled)
    let knowledgeContext = '';
    if (userId && aiConfig.useKnowledgeBase) {
      try {
        // Use the user's latest message to find relevant content
        const userQuery = latestUserMessage.content;
        
        console.log(`🔍 RAG DEBUG: Starting enhanced retrieval for query: "${userQuery}"`);
        console.log(`🔍 RAG DEBUG: User ID: ${userId}`);
        
        // Use the enhanced hybrid search approach
        const { performHybridSearch } = await import('./vector-search');
        
        const searchResults = await performHybridSearch(userQuery, userId, {
          limit: 8,
          threshold: 0.25, // Lower threshold for better recall
          vectorWeight: 0.6,
          keywordWeight: 0.4,
          rerank: true
        });

        console.log(`🔍 RAG DEBUG: Enhanced hybrid search found ${searchResults.length} results`);

        if (searchResults && searchResults.length > 0) {
          // Group chunks by knowledge item and format with better context
          const groupedChunks = searchResults.reduce((groups, result) => {
            const title = result.knowledgeItemTitle;
            if (!groups[title]) {
              groups[title] = [];
            }
            groups[title].push(result);
            return groups;
          }, {} as Record<string, typeof searchResults>);

          // Format the context with source attribution and relevance scores
          const contextParts = Object.entries(groupedChunks).map(([title, chunks]) => {
            const knowledgeItemId = chunks[0].knowledgeItemId;
            const sortedChunks = chunks.sort((a, b) => a.chunkIndex - b.chunkIndex);
            const avgSimilarity = chunks.reduce((sum, chunk) => sum + chunk.similarity, 0) / chunks.length;
            
            const chunkTexts = sortedChunks.map(chunk => {
              const relevanceMarker = chunk.similarity > 0.7 ? ' [HIGH RELEVANCE]' : 
                                     chunk.similarity > 0.5 ? ' [MEDIUM RELEVANCE]' : '';
              return `${chunk.content}${relevanceMarker}`;
            }).join('\n\n');
            
            return `=== ${title} id:${knowledgeItemId} (Relevance: ${(avgSimilarity * 100).toFixed(1)}%) ===\n${chunkTexts}`;
          });

          knowledgeContext = contextParts.join('\n\n');
          console.log(`📚 Enhanced RAG success: ${knowledgeContext.length} characters from ${searchResults.length} chunks`);
          console.log(`📚 Knowledge items found: ${Object.keys(groupedChunks).join(', ')}`);
        } else {
          console.log('🔍 RAG DEBUG: Enhanced search returned no results, trying fallback approach');
          
          // Enhanced fallback: Try with query expansion
          const expandedQuery = await expandQueryForRetrieval(userQuery);
          console.log(`🔍 RAG DEBUG: Expanded query: "${expandedQuery}"`);
          
          const fallbackResults = await performHybridSearch(expandedQuery, userId, {
            limit: 6,
            threshold: 0.2,
            vectorWeight: 0.5,
            keywordWeight: 0.5,
            rerank: false
          });
          
          if (fallbackResults && fallbackResults.length > 0) {
            const contextParts = fallbackResults.map(result => 
              `=== ${result.knowledgeItemTitle} id:${result.knowledgeItemId} (${(result.similarity * 100).toFixed(1)}%) ===\n${result.content}`
            );
            knowledgeContext = contextParts.join('\n\n');
            console.log(`📚 Fallback RAG success: ${knowledgeContext.length} characters`);
          } else {
            console.log('🔍 RAG DEBUG: Both enhanced and fallback searches failed, using basic fallback');
            
            // Last resort: Get recent documents
            const knowledgeItems = await prisma.knowledgeItem.findMany({
              where: {
                userId: userId,
                status: 'READY'
              },
              select: {
                id: true,
                title: true,
                content: true,
                type: true
              },
              orderBy: { createdAt: 'desc' },
              take: 3
            });

            if (knowledgeItems.length > 0) {
              knowledgeContext = '\n\n' + 
                knowledgeItems.map((item) => 
                  `=== ${item.title} id:${item.id} ===\n${item.content || '[Content not available for text analysis]'}`
                ).join('\n\n');
              console.log(`🔍 RAG DEBUG: Basic fallback context length: ${knowledgeContext.length} characters`);
            }
          }
        }
      } catch (error) {
        console.error('🔍 RAG DEBUG: Error in enhanced retrieval:', error);
        // Continue without knowledge context if there's an error
      }
    } else {
      console.log('🔍 RAG DEBUG: Knowledge base disabled or no user ID');
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
    }    // Enhanced system instruction with structured context and explicit grounding
    const systemInstruction = `${aiConfig.systemPrompt}

${languageInstruction}

${clientMemoryContext}

${knowledgeContext ? 
`SCIENTIFIC REFERENCE MATERIAL (Your Primary Source of Truth):
${knowledgeContext}

CRITICAL INSTRUCTIONS FOR CONTEXT USAGE:
1. ALWAYS prioritize information from the Scientific Reference Material above
2. When you use information from a knowledge base article, you MUST cite it by including a link in the following format at the end of the sentence: [Article Title](article:article-id). You can get the title and id from the context header (=== Title id:article-id ===)
3. If the reference material contains information relevant to the user's question, cite it explicitly with clickable links
4. If the reference material contradicts your general knowledge, follow the reference material
5. If the reference material is insufficient, clearly state what additional information might be needed
6. When making recommendations, directly connect them to specific points in the reference material with proper citations
7. If you cannot find relevant information in the reference material, explicitly state this limitation

RESPONSE STRUCTURE:
- Start with the most relevant information from the reference material
- Clearly distinguish between reference-based information and general knowledge
- Provide specific citations when referencing the material using the format: [Article Title](article:article-id)
- End with actionable recommendations based on the available evidence

Your Task: Provide personalized coaching advice that integrates the scientific evidence from the reference material with the client's specific circumstances and question.` 

: 

`IMPORTANT: No specific knowledge base content is currently available for this query. 

FALLBACK INSTRUCTIONS:
- You are authorized to draw upon your general, pre-trained knowledge base
- Provide evidence-based fitness guidance using established scientific principles
- Clearly indicate when information is from general knowledge vs. specific studies
- Recommend that the user consider uploading relevant research papers or documents for more personalized advice
- Focus on well-established, broadly accepted fitness and nutrition principles`}

RESPONSE QUALITY REQUIREMENTS:
- Be specific and actionable
- Avoid generic advice that could apply to anyone
- Connect recommendations to the client's specific situation
- Use scientific terminology appropriately
- Provide reasoning for your recommendations
- Acknowledge any limitations in the available information`;

    // Get the generative model with function calling capabilities
    const model = genAI.getGenerativeModel({ 
      model: aiConfig.modelName,
      generationConfig: {
        temperature: aiConfig.temperature,
        topK: aiConfig.topK,
        topP: aiConfig.topP,
        maxOutputTokens: aiConfig.maxTokens,
      },
      systemInstruction: {
        parts: [{ text: systemInstruction }],
        role: 'model'
      },
      tools: [
        {
          functionDeclarations: [updateClientProfileFunction]
        }
      ]
    });

    // Convert conversation to Gemini format, including images in history
    const history = conversation.slice(0, -1).map(msg => {
      const parts: Part[] = [{ text: msg.content }];
      
      // Add image if present in this message
      if (msg.imageData && msg.imageMimeType) {
        // Convert base64 data URL to just base64 if needed
        const base64Data = msg.imageData.startsWith('data:') 
          ? msg.imageData.split(',')[1] 
          : msg.imageData;
          
        parts.push({
          inlineData: {
            data: base64Data,
            mimeType: msg.imageMimeType,
          },
        });
      }
      
      return {
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: parts
      };
    });

    // Start a chat session with history
    const chat = model.startChat({
      history: history
    });    // Send the latest message and handle function calls
    const lastMessage = conversation[conversation.length - 1];
    let result;
    let aiResponse = '';
    
    try {
      // Prepare the message parts
      const messageParts: Part[] = [{ text: lastMessage.content }];
      
      // Add image if provided via parameters (new image upload)
      if (imageBuffer && imageMimeType) {
        messageParts.push({
          inlineData: {
            data: imageBuffer.toString('base64'),
            mimeType: imageMimeType,
          },
        });
      }
      // Or add image if present in the message object (from conversation history)
      else if (lastMessage.imageData && lastMessage.imageMimeType) {
        // Convert base64 data URL to just base64 if needed
        const base64Data = lastMessage.imageData.startsWith('data:') 
          ? lastMessage.imageData.split(',')[1] 
          : lastMessage.imageData;
          
        messageParts.push({
          inlineData: {
            data: base64Data,
            mimeType: lastMessage.imageMimeType,
          },
        });
      }
      
      result = await chat.sendMessage(messageParts);
      
      // Check if the response includes function calls
      const functionCalls = result.response.functionCalls();
      
      if (functionCalls && functionCalls.length > 0 && userId) {
        // Handle function calls
        const functionResponses = [];
        
        for (const functionCall of functionCalls) {
          if (functionCall.name === 'update_client_profile') {
            try {
              const functionResult = await handleUpdateClientProfile(userId, functionCall.args as Record<string, unknown>);
              functionResponses.push({
                name: functionCall.name,
                response: { result: functionResult }
              });
            } catch (error) {
              console.error('Error handling function call:', error);
              // Continue without function call if there's an error
            }
          }
        }
        
        // Send function responses back to the model to get the final response
        if (functionResponses.length > 0) {
          try {
            const followUpResult = await chat.sendMessage([{
              functionResponse: {
                name: functionResponses[0].name,
                response: functionResponses[0].response
              }
            }]);
            aiResponse = followUpResult.response.text();
          } catch (error) {
            console.error('Error sending function response:', error);
            aiResponse = result.response.text();
          }
        } else {
          aiResponse = result.response.text();
        }
      } else {
        aiResponse = result.response.text();
        
        // Fallback: use legacy regex extraction if no function calls were made
        if (userId && lastMessage.role === 'user') {
          try {
            await extractAndSaveInformationLegacy(userId, lastMessage.content);
          } catch (error) {
            console.error('Error with legacy extraction:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error with Gemini function calling:', error);
      
      // Fallback to basic response without function calling
      try {
        const fallbackModel = genAI.getGenerativeModel({ 
          model: aiConfig.modelName,
          generationConfig: {
            temperature: aiConfig.temperature,
            topK: aiConfig.topK,
            topP: aiConfig.topP,
            maxOutputTokens: aiConfig.maxTokens,
          },
          systemInstruction: {
            parts: [{ text: systemInstruction }],
            role: 'model'
          }
          // No tools for fallback
        });
        
        const fallbackChat = fallbackModel.startChat({
          history: conversation.slice(0, -1).map(msg => {
            const parts: Part[] = [{ text: msg.content }];
            
            // Add image if present in conversation history
            if (msg.imageData && msg.imageMimeType) {
              const base64Data = msg.imageData.startsWith('data:') 
                ? msg.imageData.split(',')[1] 
                : msg.imageData;
                
              parts.push({
                inlineData: {
                  data: base64Data,
                  mimeType: msg.imageMimeType,
                },
              });
            }
            
            return {
              role: msg.role === 'assistant' ? 'model' : 'user',
              parts: parts
            };
          })
        });
        
        // Prepare the message parts for fallback
        const fallbackMessageParts: Part[] = [{ text: lastMessage.content }];
        
        // Add image if provided via parameters (new image upload)
        if (imageBuffer && imageMimeType) {
          fallbackMessageParts.push({
            inlineData: {
              data: imageBuffer.toString('base64'),
              mimeType: imageMimeType,
            },
          });
        }
        // Or add image if present in the message object (from conversation history)
        else if (lastMessage.imageData && lastMessage.imageMimeType) {
          const base64Data = lastMessage.imageData.startsWith('data:') 
            ? lastMessage.imageData.split(',')[1] 
            : lastMessage.imageData;
            
          fallbackMessageParts.push({
            inlineData: {
              data: base64Data,
              mimeType: lastMessage.imageMimeType,
            },
          });
        }
        
        const fallbackResult = await fallbackChat.sendMessage(fallbackMessageParts);
        aiResponse = fallbackResult.response.text();
        
        // Use legacy extraction as fallback
        if (userId && lastMessage.role === 'user') {
          try {
            await extractAndSaveInformationLegacy(userId, lastMessage.content);
          } catch (extractError) {
            console.error('Error with legacy extraction fallback:', extractError);
          }
        }
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
        throw new Error('Failed to get response from AI');
      }
    }
    
    // Save coaching insights and interaction notes
    if (userId && lastMessage.role === 'user') {
      try {
        // Save a coaching note about this interaction
        const userQuestion = lastMessage.content.length > 100 
          ? lastMessage.content.substring(0, 100) + '...' 
          : lastMessage.content;
        
        await addCoachingNote(
          userId, 
          `User asked: "${userQuestion}" - Provided personalized coaching response`, 
          'interactions'
        );
        
        // If the user mentioned progress, save it as a progress note
        const progressKeywords = ['gained', 'lost', 'increased', 'improved', 'achieved', 'reached', 'lifted', 'weigh', 'stronger'];
        if (progressKeywords.some(keyword => lastMessage.content.toLowerCase().includes(keyword))) {
          await addCoachingNote(
            userId, 
            `Progress update: ${userQuestion}`, 
            'progress'
          );
        }

        // Enhanced RAG system monitoring
        await logRAGSystemPerformance(userId, userQuestion, knowledgeContext);
      } catch (error) {
        console.error('Error in conversation processing:', error);
        // Continue even if conversation processing fails
      }
    }
    
    return aiResponse;
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    
    // Handle configuration errors specifically
    if (error instanceof Error && error.message.includes('AI Configuration not found')) {
      return "🔧 **Configuration Required**: The AI system is not yet configured. Please ask an administrator to set up the AI configuration through the Admin Settings page before using the chat feature.";
    }
    
    if (error instanceof Error && error.message.includes('System prompt is not configured')) {
      return "🔧 **Configuration Required**: The AI system prompt is not configured. Please ask an administrator to set up the system prompt through the Admin Settings page.";
    }
    
    if (error instanceof Error && error.message.includes('AI model is not configured')) {
      return "🔧 **Configuration Required**: The AI model is not selected. Please ask an administrator to select an AI model through the Admin Settings page.";
    }
    
    throw new Error('Failed to get response from AI');
  }
}

/**
 * Log RAG system performance for monitoring and improvement
 * 
 * @param userId User ID
 * @param query User query
 * @param retrievedContext Retrieved context
 */
async function logRAGSystemPerformance(
  userId: string,
  query: string,
  retrievedContext: string
) {
  try {
    const contextLength = retrievedContext.length;
    const hasHighRelevance = retrievedContext.includes('[HIGH RELEVANCE]');
    const sourceCount = (retrievedContext.match(/===/g) || []).length;
    
    console.log(`🔍 RAG System Performance:
    - Query: ${query.substring(0, 50)}${query.length > 50 ? '...' : ''}
    - Context Length: ${contextLength} chars
    - High Relevance Items: ${hasHighRelevance ? 'Yes' : 'No'}
    - Source Count: ${sourceCount}
    - User ID: ${userId.substring(0, 8)}...`);
    
    // Could be extended to store performance metrics in database
  } catch (error) {
    console.error('Error logging RAG performance:', error);
  }
}

/**
 * Get enhanced context with fallback strategies
 * 
 * @param userId User ID
 * @param query User query
 * @param conversationHistory Recent conversation history
 * @returns Promise<string> Enhanced context
 */
export async function getEnhancedContext(
  userId: string,
  query: string,
  conversationHistory: Array<{ role: string; content: string }> = []
): Promise<string> {
  try {
    // Use the enhanced retrieval system
    const enhancedContext = await getRelevantContext(
      userId,
      query,
      7, // Max chunks
      0.5, // Lower threshold for broader retrieval
      conversationHistory
    );

    if (enhancedContext.length > 0) {
      return enhancedContext;
    }

    // Fallback to simpler retrieval if enhanced system fails
    console.log('⚠️ Enhanced context retrieval failed, using fallback');
    return await getRelevantContext(userId, query, 5, 0.7);
    
  } catch (error) {
    console.error('Error getting enhanced context:', error);
    return '';
  }
}

// Helper function to format conversation for Gemini
export function formatConversationForGemini(messages: Array<{ role: string; content: string; imageData?: string | null; imageMimeType?: string | null }>): ConversationMessage[] {
  return messages.map(msg => ({
    role: msg.role === 'USER' ? 'user' : 'assistant',
    content: msg.content,
    imageData: msg.imageData || undefined,
    imageMimeType: msg.imageMimeType || undefined
  }));
}