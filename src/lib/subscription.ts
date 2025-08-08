import { createClient } from '@/lib/supabase/server';
import { prisma } from './prisma';
import { UserPlan } from '@prisma/client';

export interface UserPlanLimits {
  dailyMessages: number;
  monthlyUploads: number;
  maxFileSize: number; // in MB
  hasConversationMemory: boolean;
  canAccessProFeatures: boolean;
  canAccessAdvancedRAG: boolean;
  maxKnowledgeItems: number;
}

export const PLAN_LIMITS: Record<UserPlan, UserPlanLimits> = {
  FREE: {
    dailyMessages: 5,
    monthlyUploads: 5,
    maxFileSize: 10, // 10MB
    hasConversationMemory: false,
    canAccessProFeatures: false,
    canAccessAdvancedRAG: false,
    maxKnowledgeItems: 10,
  },
  PRO: {
    dailyMessages: -1, // unlimited
    monthlyUploads: -1, // unlimited
    maxFileSize: 100, // 100MB
    hasConversationMemory: true,
    canAccessProFeatures: true,
    canAccessAdvancedRAG: true,
    maxKnowledgeItems: -1, // unlimited
  },
};

/**
 * Get the user's current plan and subscription details
 * Includes automatic expiry checking and plan validation
 */
export async function getUserPlan(): Promise<{
  plan: UserPlan;
  limits: UserPlanLimits;
  messagesUsedToday: number;
  freeMessagesRemaining: number;
  subscription?: {
    id: string;
    status: string;
    lemonSqueezyId: string | null;
    planId: string | null;
    variantId: string | null;
    currentPeriodStart: Date | null;
    currentPeriodEnd: Date | null;
    createdAt: Date;
    updatedAt: Date;
  };
} | null> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return null;
    }

    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        subscription: true,
      },
    });

    if (!userData) {
      return null;
    }

    // SECURITY: Check subscription validity and automatically downgrade if expired
    let userPlan = userData.plan;
    if (userData.subscription && userData.plan === 'PRO') {
      const subscription = userData.subscription;
      const now = new Date();
      
      // Check if subscription is expired or inactive
      const isExpired = subscription.currentPeriodEnd && subscription.currentPeriodEnd < now;
      const isInactive = !['active', 'on_trial'].includes(subscription.status);
      
      if (isExpired || isInactive) {
        console.log('Auto-downgrading expired/inactive subscription', {
          userId: user.id,
          subscriptionId: subscription.id,
          status: subscription.status,
          currentPeriodEnd: subscription.currentPeriodEnd,
          isExpired,
          isInactive
        });
        
        // Automatically downgrade to free
        await downgradeUserToFree(user.id);
        userPlan = 'FREE';
        
        // Update the subscription status
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: { status: 'expired' }
        });
      }
    }

    // Reset daily message count if it's a new day
    const today = new Date();
    const lastReset = new Date(userData.lastMessageReset);
    const isNewDay = today.toDateString() !== lastReset.toDateString();

    let messagesUsedToday = userData.messagesUsedToday;
    if (isNewDay && userData.messagesUsedToday > 0) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          messagesUsedToday: 0,
          lastMessageReset: today,
        },
      });
      messagesUsedToday = 0;
    }

    return {
      plan: userPlan,
      limits: PLAN_LIMITS[userPlan],
      messagesUsedToday,
      freeMessagesRemaining: userData.freeMessagesRemaining,
      subscription: userData.subscription || undefined,
    };
  } catch (error) {
    console.error('Error getting user plan:', error);
    return null;
  }
}

/**
 * Check if user can send a message (respects daily limits for free tier)
 */
export async function canUserSendMessage(): Promise<{
  canSend: boolean;
  reason?: string;
  messagesRemaining?: number;
  freeMessagesRemaining?: number;
}> {
  const planInfo = await getUserPlan();
  
  if (!planInfo) {
    return { canSend: false, reason: 'User not found or not authenticated' };
  }

  const { plan, limits, messagesUsedToday, freeMessagesRemaining } = planInfo;

  // Pro users have unlimited messages
  if (plan === 'PRO') {
    return { canSend: true, freeMessagesRemaining };
  }

  // Free users: Check free messages first, then daily limits
  if (freeMessagesRemaining > 0) {
    return { 
      canSend: true, 
      freeMessagesRemaining,
      messagesRemaining: limits.dailyMessages - messagesUsedToday 
    };
  }

  // No free messages left, check daily limits
  if (messagesUsedToday >= limits.dailyMessages) {
    return {
      canSend: false,
      reason: `Daily message limit reached (${limits.dailyMessages} messages). Upgrade to Pro for unlimited messages.`,
      messagesRemaining: 0,
      freeMessagesRemaining: 0,
    };
  }

  return {
    canSend: true,
    messagesRemaining: limits.dailyMessages - messagesUsedToday,
    freeMessagesRemaining: 0,
  };
}

/**
 * Increment user's daily message count and handle free messages
 */
export async function incrementUserMessageCount(): Promise<void> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    // Get current user data to check free messages
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: { freeMessagesRemaining: true, plan: true }
    });

    if (!userData) return;

    // If user has free messages remaining, use those first
    if (userData.freeMessagesRemaining > 0) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          freeMessagesRemaining: {
            decrement: 1,
          },
        },
      });
    } else {
      // No free messages left, increment daily count (for free users only)
      if (userData.plan === 'FREE') {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            messagesUsedToday: {
              increment: 1,
            },
          },
        });
      }
    }
  } catch (error) {
    console.error('Error incrementing message count:', error);
  }
}

/**
 * Check if user has access to Pro features
 */
export async function hasProAccess(): Promise<boolean> {
  const planInfo = await getUserPlan();
  return planInfo?.plan === 'PRO' || false;
}

/**
 * Upgrade user to Pro plan
 */
export async function upgradeUserToPro(
  userId: string,
  subscriptionData: {
    lemonSqueezyId: string;
    planId: string;
    variantId: string;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
  }
): Promise<void> {
  await prisma.$transaction([
    // Update user plan
    prisma.user.update({
      where: { id: userId },
      data: {
        plan: 'PRO',
        messagesUsedToday: 0, // Reset message count when upgrading
      },
    }),
    // Create or update subscription record
    prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        lemonSqueezyId: subscriptionData.lemonSqueezyId,
        status: 'active',
        planId: subscriptionData.planId,
        variantId: subscriptionData.variantId,
        currentPeriodStart: subscriptionData.currentPeriodStart,
        currentPeriodEnd: subscriptionData.currentPeriodEnd,
      },
      update: {
        lemonSqueezyId: subscriptionData.lemonSqueezyId,
        status: 'active',
        planId: subscriptionData.planId,
        variantId: subscriptionData.variantId,
        currentPeriodStart: subscriptionData.currentPeriodStart,
        currentPeriodEnd: subscriptionData.currentPeriodEnd,
      },
    }),
  ]);
}

/**
 * Downgrade user to Free plan (when subscription is canceled/expired)
 */
export async function downgradeUserToFree(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      plan: 'FREE',
      messagesUsedToday: 0, // Reset message count
    },
  });

  // Update subscription status
  await prisma.subscription.updateMany({
    where: { userId },
    data: {
      status: 'canceled',
    },
  });
}

/**
 * Check if user can upload a file (respects monthly limits and file size)
 */
export async function canUserUploadFile(fileSizeInMB: number): Promise<{
  canUpload: boolean;
  reason?: string;
  uploadsRemaining?: number;
  maxFileSize?: number;
}> {
  const planInfo = await getUserPlan();
  
  if (!planInfo) {
    return { canUpload: false, reason: 'User plan not found' };
  }

  const { limits } = planInfo;
  
  // Check file size limit
  if (fileSizeInMB > limits.maxFileSize) {
    return {
      canUpload: false,
      reason: `File size exceeds limit`,
      maxFileSize: limits.maxFileSize
    };
  }
  
  // Check upload limit (PRO has unlimited uploads)
  if (limits.monthlyUploads === -1) {
    return { canUpload: true };
  }
  
  // Get current user data with upload tracking
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { canUpload: false, reason: 'User not authenticated' };
  }
  
  const userData = await prisma.user.findUnique({
    where: { id: user.id },
    select: { 
      uploadsThisMonth: true, 
      lastUploadReset: true,
      plan: true 
    }
  });
  
  if (!userData) {
    return { canUpload: false, reason: 'User data not found' };
  }
  
  // Reset monthly upload count if it's a new month
  const now = new Date();
  const lastReset = new Date(userData.lastUploadReset);
  const isNewMonth = now.getMonth() !== lastReset.getMonth() || 
                     now.getFullYear() !== lastReset.getFullYear();
  
  let uploadsThisMonth = userData.uploadsThisMonth;
  
  if (isNewMonth && uploadsThisMonth > 0) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        uploadsThisMonth: 0,
        lastUploadReset: now,
      },
    });
    uploadsThisMonth = 0;
  }
  
  const uploadsRemaining = limits.monthlyUploads - uploadsThisMonth;
  
  if (uploadsRemaining <= 0) {
    return {
      canUpload: false,
      reason: 'Monthly upload limit reached',
      uploadsRemaining: 0
    };
  }
  
  return {
    canUpload: true,
    uploadsRemaining
  };
}

/**
 * Increment user's monthly upload count
 */
export async function incrementUserUploadCount(): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }
  
  await prisma.user.update({
    where: { id: user.id },
    data: {
      uploadsThisMonth: {
        increment: 1
      }
    }
  });
}

/**
 * Check if user can create more knowledge items
 */
export async function canUserCreateKnowledgeItem(): Promise<{
  canCreate: boolean;
  reason?: string;
  itemsRemaining?: number;
}> {
  const planInfo = await getUserPlan();
  
  if (!planInfo) {
    return { canCreate: false, reason: 'User plan not found' };
  }

  const { limits } = planInfo;
  
  // PRO users have unlimited knowledge items
  if (limits.maxKnowledgeItems === -1) {
    return { canCreate: true };
  }
  
  // Get current user's knowledge item count
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { canCreate: false, reason: 'User not authenticated' };
  }
  
  const knowledgeItemCount = await prisma.knowledgeItem.count({
    where: { userId: user.id }
  });
  
  const itemsRemaining = limits.maxKnowledgeItems - knowledgeItemCount;
  
  if (itemsRemaining <= 0) {
    return {
      canCreate: false,
      reason: 'Maximum knowledge items reached',
      itemsRemaining: 0
    };
  }
  
  return {
    canCreate: true,
    itemsRemaining
  };
}

/**
 * Validate subscription security and integrity
 * This should be called periodically to ensure subscription data integrity
 */
export async function validateSubscriptionSecurity(): Promise<{
  expiredActiveSubscriptions: number;
  proUsersWithoutValidSubscriptions: number;
  freeUsersWithActiveSubscriptions: number;
  actionsPerformed: string[];
}> {
  const actionsPerformed: string[] = [];
  
  try {
    // Find and fix expired active subscriptions
    const expiredActiveSubscriptions = await prisma.subscription.findMany({
      where: {
        status: 'active',
        currentPeriodEnd: {
          lt: new Date()
        }
      },
      include: {
        user: true
      }
    });

    for (const subscription of expiredActiveSubscriptions) {
      // Update subscription status to expired
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: 'expired' }
      });

      // Downgrade user to free if they're still on PRO
      if (subscription.user.plan === 'PRO') {
        await downgradeUserToFree(subscription.userId);
        actionsPerformed.push(`Downgraded user ${subscription.userId} from expired subscription`);
      }
    }

    // Find PRO users without valid subscriptions
    const proUsersWithoutValidSubs = await prisma.user.findMany({
      where: {
        plan: 'PRO',
        OR: [
          { subscription: null },
          {
            subscription: {
              OR: [
                { status: { notIn: ['active', 'on_trial'] } },
                { currentPeriodEnd: { lt: new Date() } }
              ]
            }
          }
        ]
      }
    });

    // Downgrade PRO users without valid subscriptions
    for (const user of proUsersWithoutValidSubs) {
      await downgradeUserToFree(user.id);
      actionsPerformed.push(`Downgraded PRO user ${user.id} without valid subscription`);
    }

    // Find FREE users with active subscriptions (shouldn't happen but let's check)
    const freeUsersWithActiveSubs = await prisma.user.findMany({
      where: {
        plan: 'FREE',
        subscription: {
          status: 'active',
          currentPeriodEnd: { gt: new Date() }
        }
      },
      include: {
        subscription: true
      }
    });

    // Upgrade FREE users with active subscriptions
    for (const user of freeUsersWithActiveSubs) {
      if (user.subscription) {
        await upgradeUserToPro(user.id, {
          lemonSqueezyId: user.subscription.lemonSqueezyId || '',
          planId: user.subscription.planId || 'pro',
          variantId: user.subscription.variantId || '',
          currentPeriodStart: user.subscription.currentPeriodStart || new Date(),
          currentPeriodEnd: user.subscription.currentPeriodEnd || new Date(),
        });
        actionsPerformed.push(`Upgraded FREE user ${user.id} with active subscription`);
      }
    }

    return {
      expiredActiveSubscriptions: expiredActiveSubscriptions.length,
      proUsersWithoutValidSubscriptions: proUsersWithoutValidSubs.length,
      freeUsersWithActiveSubscriptions: freeUsersWithActiveSubs.length,
      actionsPerformed
    };

  } catch (error) {
    console.error('Error validating subscription security:', error);
    throw error;
  }
}

/**
 * Security function to validate user has valid PRO access
 * This should be called before granting access to PRO features
 */
export async function validateProAccess(userId: string): Promise<boolean> {
  try {
    const userData = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscription: true,
      },
    });

    if (!userData) {
      return false;
    }

    // If user is not PRO, they don't have access
    if (userData.plan !== 'PRO') {
      return false;
    }

    // If user has no subscription, downgrade them and deny access
    if (!userData.subscription) {
      await downgradeUserToFree(userId);
      return false;
    }

    const subscription = userData.subscription;
    const now = new Date();
    
    // Check if subscription is expired or inactive
    const isExpired = subscription.currentPeriodEnd && subscription.currentPeriodEnd < now;
    const isInactive = !['active', 'on_trial'].includes(subscription.status);
    
    if (isExpired || isInactive) {
      // Auto-downgrade expired/inactive subscription
      await downgradeUserToFree(userId);
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: 'expired' }
      });
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error validating PRO access:', error);
    return false;
  }
}
