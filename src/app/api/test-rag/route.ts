import { NextRequest, NextResponse } from 'next/server';
import { sendToGemini } from '@/lib/gemini';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, userId } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    if (process.env.NODE_ENV === 'development') { console.log('🧪 RAG Test API: Testing with message:', message); }
    if (process.env.NODE_ENV === 'development') { console.log('🧪 RAG Test API: User ID:', userId); }

    // Test conversation
    const conversation = [
      { role: 'user' as const, content: message }
    ];

    // Test Gemini API with RAG
    const response = await sendToGemini(conversation, userId);
    
    if (process.env.NODE_ENV === 'development') { console.log('🧪 RAG Test API: Response length:', response.length); }
    if (process.env.NODE_ENV === 'development') { console.log('🧪 RAG Test API: Response preview:', response.substring(0, 200)); }

    return NextResponse.json({ 
      success: true, 
      message: message,
      userId: userId,
      response: response,
      responseLength: response.length
    });

  } catch (error) {
    console.error('🧪 RAG Test API error:', error);
    return NextResponse.json(
      { error: 'Test failed: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
