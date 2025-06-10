import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from './prisma';

// Initialize the Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function sendToGemini(
  conversation: ConversationMessage[], 
  userId?: string
): Promise<string> {  try {
    if (!process.env.GEMINI_API_KEY) {
      // Temporary fallback for testing without API key
      return "Thank you for your message! I'm your AI fitness coach, and I'd love to help you with your hypertrophy training goals. Please note: The Gemini API key is not configured, so this is a test response. Once configured, I'll provide personalized workout advice, nutrition guidance, and training optimization based on your specific needs.";
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
          }
        });        if (knowledgeItems.length > 0) {
          knowledgeContext = '\n\n' + 
            knowledgeItems.map((item) => 
              `${item.content || '[PDF content available for viewing but not for text analysis]'}`
            ).join('\n\n');
        }
      } catch (error) {
        console.error('Error fetching knowledge items:', error);
        // Continue without knowledge context if there's an error
      }
    }    // Enhanced system instruction with knowledge context
    const systemInstruction = `You are a professional fitness coach and exercise scientist specializing in muscle hypertrophy. You have deep expertise in exercise physiology, biomechanics, and the science of muscle growth. You must ONLY use information from the user's knowledge base, but present it with the authority and expertise of a seasoned professional.

PROFESSIONAL EXPERTISE AREAS:
- Exercise Physiology: muscle fiber types, metabolic pathways, adaptation mechanisms
- Biomechanics: movement patterns, force vectors, joint mechanics, muscle activation
- Hypertrophy Science: protein synthesis, mechanical tension, metabolic stress, muscle damage
- Training Methodology: periodization, progressive overload, volume-intensity relationships
- Recovery Science: sleep, nutrition timing, stress management, adaptation windows

CONVERSATION GUIDELINES:
1. ONLY use information from the user's knowledge base (provided below)
2. NEVER copy text directly - reformulate with professional expertise and scientific understanding
3. Explain concepts with the depth and authority of an exercise scientist
4. Use proper scientific terminology when appropriate, but explain it clearly
5. Connect physiological principles to practical applications
6. If information isn't in the knowledge base, say: "I don't have specific information about that in my current knowledge base. Adding research or protocols on that topic would help me provide you with evidence-based guidance."
7. Never mention sources, but present information with scientific confidence
8. Bridge theory to practice - explain WHY something works physiologically

PROFESSIONAL COMMUNICATION STYLE:
- Authoritative yet approachable
- Use scientific reasoning to explain recommendations
- Provide context about physiological mechanisms when relevant
- Show deep understanding of exercise science principles
- Be precise with terminology while remaining conversational
- Demonstrate expertise through detailed explanations of biological processes
- Connect biomechanical principles to training recommendations

${knowledgeContext ? `SCIENTIFIC REFERENCE MATERIAL (apply your expertise to reformulate):${knowledgeContext}

Using your expertise in exercise physiology and biomechanics, transform the above information into professional, scientifically-grounded responses. Explain the underlying mechanisms and connect theory to practical application.` : `

IMPORTANT: No knowledge base content available. For any training questions, respond with: "I don't have specific information about that in my current knowledge base. Adding research or protocols on that topic would help me provide you with evidence-based guidance based on exercise physiology and biomechanics principles."`}`;    // Get the generative model
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
        role: 'model'
      }
    });// Convert conversation to Gemini format
    const history = conversation.slice(0, -1).map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    // Start a chat session with history
    const chat = model.startChat({
      history: history
    });

    // Send the latest message
    const lastMessage = conversation[conversation.length - 1];
    const result = await chat.sendMessage(lastMessage.content);
    
    return result.response.text();
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