import { NextRequest, NextResponse } from 'next/server';

// Simple test endpoint to verify webhook URL is accessible
export async function GET() {
  return NextResponse.json({ 
    message: 'Lemon Squeezy webhook endpoint is accessible',
    timestamp: new Date().toISOString(),
    endpoint: '/api/webhooks/lemon-squeezy'
  });
}

// Test POST with sample data
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    return NextResponse.json({ 
      message: 'Webhook test received',
      timestamp: new Date().toISOString(),
      receivedData: body,
      headers: Object.fromEntries(request.headers.entries())
    });
    
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to process webhook test',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 400 });
  }
}
