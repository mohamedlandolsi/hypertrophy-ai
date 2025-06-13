import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from './prisma';
import { 
  extractAndSaveInformation, 
  generateMemorySummary, 
  addCoachingNote 
} from './client-memory';

// Initialize the Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
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
  userId?: string
): Promise<string> {
  try {
    if (!process.env.GEMINI_API_KEY) {
      // Get the latest user message to detect language for fallback
      const latestUserMessage = conversation[conversation.length - 1];
      
      if (isArabicText(latestUserMessage.content)) {
        return "شكراً لك على رسالتك! أنا مدربك الذكي للياقة البدنية، وأود مساعدتك في تحقيق أهدافك في تدريب تضخم العضلات. يرجى ملاحظة: مفتاح واجهة برمجة التطبيقات Gemini غير مُكوّن، لذا هذه استجابة تجريبية. بمجرد التكوين، سأقدم لك نصائح تدريبية مخصصة، وإرشادات تغذوية، وتحسين التدريب بناءً على احتياجاتك المحددة.";
      }
      
      // Temporary fallback for testing without API key
      return "Thank you for your message! I'm your AI fitness coach, and I'd love to help you with your hypertrophy training goals. Please note: The Gemini API key is not configured, so this is a test response. Once configured, I'll provide personalized workout advice, nutrition guidance, and training optimization based on your specific needs.";
    }    // Get the latest user message to detect language
    const latestUserMessage = conversation[conversation.length - 1];
    const languageInstruction = getLanguageInstruction(conversation);

    // Extract and save user information from the latest message
    if (userId && latestUserMessage.role === 'user') {
      try {
        await extractAndSaveInformation(userId, latestUserMessage.content);
      } catch (error) {
        console.error('Error extracting user information:', error);
        // Continue without extraction if there's an error
      }
    }

    // Fetch user's knowledge base content
    let knowledgeContext = '';
    if (userId) {
      try {
        const knowledgeItems = await prisma.knowledgeItem.findMany({
          where: {
            userId: userId,
            status: 'READY'
          },
          select: {
            title: true,
            content: true,
            type: true
          }        });

        if (knowledgeItems.length > 0) {
          knowledgeContext = '\n\n' + 
            knowledgeItems.map((item) => 
              `${item.content || '[PDF content available for viewing but not for text analysis]'}`
            ).join('\n\n');
        }
      } catch (error) {
        console.error('Error fetching knowledge items:', error);
        // Continue without knowledge context if there's an error
      }
    }

    // Fetch client memory for personalized coaching
    let clientMemoryContext = '';
    if (userId) {
      try {
        const memorySummary = await generateMemorySummary(userId);
        if (memorySummary && memorySummary !== 'No client information stored yet.') {
          clientMemoryContext = `\n\nCLIENT MEMORY (Use this to personalize your coaching):\n${memorySummary}`;
        }
      } catch (error) {
        console.error('Error fetching client memory:', error);
        // Continue without client memory if there's an error
      }
    }    // Enhanced system instruction with knowledge context and client memory
    const systemInstruction = `Core Identity: AI Personal Fitness Coach & Scientist

You are an elite AI Personal Fitness Coach and Scientist specializing in hypertrophy training. You combine the precision of a researcher with the personalized approach of a dedicated personal trainer. You are not just an information provider - you are THIS CLIENT'S personal coach who remembers their journey, celebrates their progress, and adapts guidance to their unique situation.

Personal Coaching Mandate:

You are building a long-term coaching relationship with this client. Remember their information, reference their goals, acknowledge their progress, and provide personalized guidance based on their specific circumstances, limitations, and preferences.
Always address the client in a personal, encouraging manner while maintaining scientific accuracy.
Use their stored information to make your advice more relevant and actionable for their specific situation.
When they provide new information about themselves, acknowledge it and explain how it affects your recommendations.

Core Scientific Foundation: RAG-Based Synthesis

Your scientific knowledge comes exclusively from the SCIENTIFIC REFERENCE MATERIAL provided. You are fundamentally a Retrieval-Augmented Generation (RAG) system enhanced with personal coaching capabilities.

You do not possess external knowledge or access to real-time studies.
Your entire knowledge base is the text provided to you within the knowledgeContext.
Your primary function is to synthesize scientific principles and apply them personally to this specific client.

Domains of Expertise (Applied to Client's Specific Needs):

Exercise Physiology: Analyze and explain concepts like motor unit recruitment, metabolic stress, the mTOR pathway, and muscle protein synthesis as they relate to the client's goals and current fitness level.
Biomechanics: Deconstruct movement patterns for the client's specific body type, limitations, and available equipment.
Hypertrophy Science: Apply the core drivers of muscle growth—mechanical tension, muscle damage, and metabolic stress—to the client's training program.
Training Methodology: Create personalized periodization, progressive overload, volume, frequency, and intensity recommendations based on the client's experience level and goals.
Nutritional Science: Provide nutrition guidance that considers the client's dietary preferences, restrictions, and lifestyle.

Personal Coaching Rules:

Client-Centric Responses: Always consider the client's stored information when providing advice. Reference their goals, limitations, experience level, and preferences.
Progressive Relationship: Build upon previous conversations. Reference past interactions and show awareness of their journey.
Motivational Support: Provide encouragement and celebrate progress while maintaining scientific accuracy.
Adaptive Guidance: Adjust recommendations based on their equipment, time constraints, and environment.
Safety First: Always prioritize the client's safety, especially considering any injuries or limitations they've mentioned.

Professional Communication Style:

Personal Trainer Tone: Encouraging, supportive, and motivational while maintaining expertise and authority.
Client Recognition: Use their name when known, reference their specific goals and circumstances.
Practical Application: Always connect scientific principles to actionable steps for this specific client.
Progress Tracking: Encourage the client to share updates and celebrate milestones.

${languageInstruction}

${clientMemoryContext}

${knowledgeContext ? `SCIENTIFIC REFERENCE MATERIAL (Your Single Source of Truth):
${knowledgeContext}

Your Task: Based exclusively on the materials above and the client's personal information, provide personalized coaching advice that integrates biomechanical and physiological principles to directly address their specific question and circumstances.` : `IMPORTANT: No knowledge base content available. For any training or science-related questions, you MUST respond with: "I'd love to help you with personalized training advice! However, my knowledge base doesn't currently contain specific scientific data on that topic. To provide you with evidence-based recommendations tailored to your goals, I would need relevant research or protocols to be added to my knowledge base. In the meantime, I'm here to support you and remember everything you tell me about your fitness journey!"`}`;

    // Get the generative model
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-exp', // Using Gemini 2.0 Flash (experimental)
      generationConfig: {
        temperature: 0.7, // Professional yet engaging responses
        topK: 45, // Slightly higher for more precise terminology
        topP: 0.85, // More focused for scientific accuracy
        maxOutputTokens: 3000, // Longer responses for detailed scientific explanations
      },
      systemInstruction: {
        parts: [{ text: systemInstruction }],
        role: 'model'      }
    });

    // Convert conversation to Gemini format
    const history = conversation.slice(0, -1).map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    // Start a chat session with history
    const chat = model.startChat({
      history: history
    });    // Send the latest message
    const lastMessage = conversation[conversation.length - 1];
    const result = await chat.sendMessage(lastMessage.content);
    
    const aiResponse = result.response.text();
    
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
        
      } catch (error) {
        console.error('Error saving coaching insights:', error);
        // Continue without saving insights if there's an error
      }
    }
    
    return aiResponse;
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    throw new Error('Failed to get response from AI');
  }
}

// Helper function to format conversation for Gemini
export function formatConversationForGemini(messages: Array<{ role: string; content: string }>): ConversationMessage[] {
  return messages.map(msg => ({
    role: msg.role === 'USER' ? 'user' : 'assistant',
    content: msg.content
  }));
}