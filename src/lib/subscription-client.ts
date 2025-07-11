/**
 * Client-side subscription utilities
 * Safe to import in client components
 */

import { UserPlan } from '@prisma/client';

export interface UserPlanLimits {
  dailyMessages: number;
  hasConversationMemory: boolean;
  canAccessProFeatures: boolean;
}

export const PLAN_LIMITS: Record<UserPlan, UserPlanLimits> = {
  FREE: {
    dailyMessages: 15,
    hasConversationMemory: false,
    canAccessProFeatures: false,
  },
  PRO: {
    dailyMessages: -1, // unlimited
    hasConversationMemory: true,
    canAccessProFeatures: true,
  },
};

/**
 * Get plan display information for UI
 */
export function getPlanDisplayInfo(plan: UserPlan) {
  switch (plan) {
    case 'FREE':
      return {
        name: 'Free',
        price: '$0',
        period: '',
        color: 'text-gray-600',
        bgColor: 'bg-gray-100',
      };
    case 'PRO':
      return {
        name: 'Pro',
        price: '$9.99',
        period: '/month',
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
      };
    default:
      return {
        name: 'Unknown',
        price: '$0',
        period: '',
        color: 'text-gray-600',
        bgColor: 'bg-gray-100',
      };
  }
}

/**
 * Client-side hook for fetching user plan data
 */
export async function fetchUserPlan(): Promise<{
  plan: UserPlan;
  limits: UserPlanLimits;
  messagesUsedToday: number;
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
    const response = await fetch('/api/user/plan');
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    return {
      plan: data.plan,
      limits: data.limits,
      messagesUsedToday: data.messagesUsedToday,
      subscription: data.subscription,
    };
  } catch (error) {
    console.error('Error fetching user plan:', error);
    return null;
  }
}
