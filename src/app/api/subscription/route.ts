import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserSubscriptionTier } from '@/lib/subscription';

export const runtime = 'nodejs';

/**
 * GET /api/subscription
 * 
 * Retrieves the current user's subscription information including:
 * - Subscription tier (FREE, PRO_MONTHLY, PRO_YEARLY)
 * - Plan limits (messages, uploads, features)
 * - Current usage statistics
 * - Subscription details (if applicable)
 * 
 * @returns {Object} Subscription data or error response
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const subscriptionData = await getUserSubscriptionTier();

    if (!subscriptionData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      tier: subscriptionData.tier,
      limits: subscriptionData.limits,
      usage: {
        messagesUsedToday: subscriptionData.messagesUsedToday,
        customizationsThisMonth: subscriptionData.customizationsThisMonth,
        customProgramsCount: subscriptionData.customProgramsCount,
      },
      subscription: subscriptionData.subscription,
    });
  } catch (error: unknown) {
    console.error('Error fetching subscription:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    );
  }
}
