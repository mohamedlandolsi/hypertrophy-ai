import { NextRequest, NextResponse } from 'next/server';
import { sendToGemini } from '@/lib/gemini';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    console.log('Testing Gemini with message:', message);

    // Simple test conversation
    const conversation = [
      { role: 'user' as const, content: message }
    ];

    // Test Gemini API
    const response = await sendToGemini(conversation);
    
    console.log('Gemini response:', response);

    return NextResponse.json({ 
      success: true, 
      message: message,
      response: response 
    });

  } catch (error) {
    console.error('Test API error:', error);
    return NextResponse.json(
      { error: 'Test failed: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
