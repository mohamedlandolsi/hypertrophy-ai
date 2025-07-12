import { NextRequest, NextResponse } from 'next/server';
import { upgradeUserToPro } from '@/lib/subscription';

// Debug endpoint to manually test user upgrade
export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }
    
    console.log('Debug: Manually upgrading user to Pro:', userId);
    
    // Simulate a successful subscription
    await upgradeUserToPro(userId, {
      lemonSqueezyId: 'debug-' + Date.now(),
      planId: 'debug-plan',
      variantId: '9c872ed8-6ef8-47b2-a2dd-00a832697ebb',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    });
    
    return NextResponse.json({ 
      success: true, 
      message: 'User upgraded to Pro successfully',
      userId 
    });
    
  } catch (error) {
    console.error('Debug upgrade error:', error);
    return NextResponse.json({ 
      error: 'Failed to upgrade user',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Get current user ID for testing
export async function GET() {
  try {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    return NextResponse.json({ 
      userId: user.id,
      email: user.email,
      metadata: user.user_metadata
    });
    
  } catch (error) {
    console.error('Error getting user:', error);
    return NextResponse.json({ 
      error: 'Failed to get user',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
