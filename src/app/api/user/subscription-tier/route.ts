/**
 * GET /api/user/subscription-tier
 * Returns the user's current subscription tier and usage details
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserSubscriptionTier } from '@/lib/subscription';
import { ApiErrorHandler } from '@/lib/error-handler';

// Use Node.js runtime for Supabase and Prisma operations
export const runtime = 'nodejs';

export async function GET(request: Request) {
  const context = ApiErrorHandler.createContext(request);

  try {
    // Authentication check
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's subscription tier and limits
    const tierInfo = await getUserSubscriptionTier();

    if (!tierInfo) {
      return NextResponse.json(
        { error: 'User subscription information not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      tier: tierInfo.tier,
      limits: tierInfo.limits,
      usage: {
        messagesUsedToday: tierInfo.messagesUsedToday,
        customizationsThisMonth: tierInfo.customizationsThisMonth,
        customProgramsCount: tierInfo.customProgramsCount,
      },
      subscription: tierInfo.subscription ? {
        id: tierInfo.subscription.id,
        status: tierInfo.subscription.status,
        currentPeriodEnd: tierInfo.subscription.currentPeriodEnd,
        planId: tierInfo.subscription.planId,
      } : null,
    });
  } catch (error) {
    return ApiErrorHandler.handleError(error, context);
  }
}
