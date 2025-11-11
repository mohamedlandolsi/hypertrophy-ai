import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { ApiErrorHandler } from '@/lib/error-handler';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const context = ApiErrorHandler.createContext(request);
  
  try {
    const { userId } = await params;
    const { duration, durationType, reason } = await request.json();

    // Validate input
    if (!duration || !durationType || !['days', 'months', 'years'].includes(durationType)) {
      return NextResponse.json({ 
        error: 'Invalid duration. Must specify duration and durationType (days, months, or years)' 
      }, { status: 400 });
    }

    if (duration <= 0) {
      return NextResponse.json({ 
        error: 'Duration must be a positive number' 
      }, { status: 400 });
    }

    // Verify admin access
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if current user is admin
    const currentUserProfile = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true }
    });

    if (!currentUserProfile || currentUserProfile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true, 
        plan: true,
        subscription: {
          select: {
            id: true,
            status: true,
            currentPeriodEnd: true
          }
        }
      }
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Calculate the end date based on duration and type
    const now = new Date();
    let endDate: Date;

    switch (durationType) {
      case 'days':
        endDate = new Date(now.getTime() + (duration * 24 * 60 * 60 * 1000));
        break;
      case 'months':
        endDate = new Date(now);
        endDate.setMonth(endDate.getMonth() + duration);
        break;
      case 'years':
        endDate = new Date(now);
        endDate.setFullYear(endDate.getFullYear() + duration);
        break;
      default:
        return NextResponse.json({ error: 'Invalid duration type' }, { status: 400 });
    }

    // Start a transaction to update both user plan and subscription
    const result = await prisma.$transaction(async (tx) => {
      // Update user plan to PRO
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { 
          plan: 'PRO',
          // Reset message and upload counters for immediate PRO access
          messagesUsedToday: 0,
          lastMessageReset: now,
          uploadsThisMonth: 0,
          lastUploadReset: now
        },
        select: {
          id: true,
          plan: true,
          messagesUsedToday: true,
          uploadsThisMonth: true
        }
      });

      // Create or update subscription record
      const subscriptionData = {
        status: 'active',
        currentPeriodStart: now,
        currentPeriodEnd: endDate,
        planId: `admin-granted-${durationType}`,
        variantId: `admin-granted-${duration}-${durationType}`,
        lemonSqueezyId: null // Admin-granted plans don't have LemonSqueezy IDs
      };

      let subscription;
      if (targetUser.subscription) {
        // Update existing subscription
        subscription = await tx.subscription.update({
          where: { userId: userId },
          data: subscriptionData
        });
      } else {
        // Create new subscription
        subscription = await tx.subscription.create({
          data: {
            userId: userId,
            ...subscriptionData
          }
        });
      }

      return { user: updatedUser, subscription };
    });

    // Log the admin action for audit purposes
    if (process.env.NODE_ENV === 'development') { console.log(`Admin ${user.id} granted PRO plan to user ${userId} for ${duration} ${durationType}. Reason: ${reason || 'Not specified'}`); }

    return NextResponse.json({
      success: true,
      message: `Successfully granted PRO plan for ${duration} ${durationType}`,
      user: result.user,
      subscription: {
        id: result.subscription.id,
        status: result.subscription.status,
        currentPeriodEnd: result.subscription.currentPeriodEnd,
        planId: result.subscription.planId,
        variantId: result.subscription.variantId
      },
      grantDetails: {
        duration,
        durationType,
        endDate,
        grantedBy: user.id,
        grantedAt: now,
        reason: reason || null
      }
    });

  } catch (error) {
    return ApiErrorHandler.handleError(error, context);
  }
}
