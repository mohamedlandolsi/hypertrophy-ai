import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function sendToGemini(conversation: ConversationMessage[]): Promise<string> {
  try {
    if (!process.env.GEMINI_API_KEY) {
      // Temporary fallback for testing without API key
      return "Thank you for your message! I'm your AI fitness coach, and I'd love to help you with your hypertrophy training goals. Please note: The Gemini API key is not configured, so this is a test response. Once configured, I'll provide personalized workout advice, nutrition guidance, and training optimization based on your specific needs.";
    }    // Get the generative model
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-exp', // Using Gemini 2.0 Flash (experimental)
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
      systemInstruction: {
        parts: [{ text: `You are an expert AI fitness coach specializing in hypertrophy (muscle building) training. You provide personalized workout advice, nutrition guidance, and training optimization based on scientific principles.

Key areas of expertise:
- Progressive overload and periodization
- Exercise selection and technique
- Nutrition for muscle growth
- Recovery and sleep optimization
- Training split design
- Addressing plateaus and sticking points

Always provide evidence-based recommendations and explain the reasoning behind your advice. Be encouraging and supportive while maintaining scientific accuracy.` }],
        role: 'model'
      }
    });    // Convert conversation to Gemini format
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