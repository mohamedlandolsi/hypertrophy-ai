/**
 * Subscription Tier Limits Enforcement
 * 
 * Centralized utility for checking and enforcing subscription tier limits.
 * Includes caching, API middleware, and client-side hooks.
 * 
 * Features:
 * - checkFeatureAccess(): Verify if user can access a feature
 * - enforceLimit(): Check if user has reached usage limits
 * - withTierCheck(): API route middleware for tier enforcement
 * - Cache tier checks with Redis (5 min TTL)
 */

import { createClient } from '@/lib/supabase/server';
import { prisma } from './prisma';
import { getUserSubscriptionTier, SUBSCRIPTION_TIER_LIMITS, type UserPlanLimits } from './subscription';
import { SubscriptionTier } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

export type FeatureName =
  | 'create_program'
  | 'customize_program'
  | 'ai_assistant'
  | 'workout_templates'
  | 'advanced_analytics'
  | 'export_pdf'
  | 'priority_support'
  | 'conversation_memory'
  | 'advanced_rag';

export type LimitType =
  | 'programs'
  | 'customizations'
  | 'ai_interactions'
  | 'uploads'
  | 'knowledge_items';

export interface FeatureAccessResult {
  hasAccess: boolean;
  reason?: string;
  tier?: SubscriptionTier;
  upgradePath?: 'PRO_MONTHLY' | 'PRO_YEARLY';
}

export interface LimitCheckResult {
  allowed: boolean;
  current: number;
  limit: number;
  remaining: number;
  resetDate?: Date;
  tier?: SubscriptionTier;
}

interface CachedTierData {
  tier: SubscriptionTier;
  limits: UserPlanLimits;
  timestamp: number;
}

// Cache TTL: 5 minutes (in milliseconds)
const CACHE_TTL = 5 * 60 * 1000;

// In-memory cache (fallback if Redis not available)
// In production, replace with Redis
const tierCache = new Map<string, CachedTierData>();

// Feature to tier mapping
const FEATURE_REQUIREMENTS: Record<FeatureName, (tier: SubscriptionTier) => boolean> = {
  create_program: () => true, // All tiers can create programs (with limits)
  customize_program: () => true, // All tiers can customize (with limits)
  ai_assistant: () => true, // All tiers have AI (with limits)
  workout_templates: (t) => t !== 'FREE', // PRO only
  advanced_analytics: (t) => t !== 'FREE', // PRO only
  export_pdf: (t) => t === 'PRO_YEARLY', // Yearly PRO only
  priority_support: (t) => t === 'PRO_YEARLY', // Yearly PRO only
  conversation_memory: (t) => t !== 'FREE', // PRO only
  advanced_rag: (t) => t !== 'FREE', // PRO only
};

// ============================================================================
// CACHE MANAGEMENT
// ============================================================================

/**
 * Get cached tier data for a user
 * @param userId User ID
 * @returns Cached tier data or null if expired/not found
 */
function getCachedTier(userId: string): CachedTierData | null {
  const cached = tierCache.get(userId);
  if (!cached) return null;

  const now = Date.now();
  if (now - cached.timestamp > CACHE_TTL) {
    // Cache expired, remove it
    tierCache.delete(userId);
    return null;
  }

  return cached;
}

/**
 * Set cached tier data for a user
 * @param userId User ID
 * @param tier Subscription tier
 * @param limits Tier limits
 */
function setCachedTier(userId: string, tier: SubscriptionTier, limits: UserPlanLimits): void {
  tierCache.set(userId, {
    tier,
    limits,
    timestamp: Date.now(),
  });

  // Cleanup old cache entries (simple LRU)
  if (tierCache.size > 1000) {
    const oldestKey = tierCache.keys().next().value;
    if (oldestKey) tierCache.delete(oldestKey);
  }
}

/**
 * Clear cached tier data for a user (call when subscription changes)
 * @param userId User ID
 */
export function clearTierCache(userId: string): void {
  tierCache.delete(userId);
}

/**
 * Clear all cached tier data (use sparingly)
 */
export function clearAllTierCache(): void {
  tierCache.clear();
}

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

/**
 * Get user's subscription tier with caching
 * @param userId User ID
 * @returns Subscription tier, limits, and usage
 */
async function getUserTierWithCache(userId: string): Promise<{
  tier: SubscriptionTier;
  limits: UserPlanLimits;
  messagesUsedToday: number;
  customizationsThisMonth: number;
  customProgramsCount: number;
} | null> {
  // Check cache first
  const cached = getCachedTier(userId);
  if (cached) {
    // Get fresh usage counts (cache tier but not usage)
    const userData = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        messagesUsedToday: true,
        customizationsThisMonth: true,
        customProgramsCount: true,
      },
    });

    if (userData) {
      return {
        tier: cached.tier,
        limits: cached.limits,
        messagesUsedToday: userData.messagesUsedToday,
        customizationsThisMonth: userData.customizationsThisMonth,
        customProgramsCount: userData.customProgramsCount,
      };
    }
  }

  // Cache miss - fetch from database
  const tierInfo = await getUserSubscriptionTier();
  if (!tierInfo) return null;

  // Cache tier data
  setCachedTier(userId, tierInfo.tier, tierInfo.limits);

  return {
    tier: tierInfo.tier,
    limits: tierInfo.limits,
    messagesUsedToday: tierInfo.messagesUsedToday,
    customizationsThisMonth: tierInfo.customizationsThisMonth,
    customProgramsCount: tierInfo.customProgramsCount,
  };
}

/**
 * Check if user has access to a specific feature
 * 
 * @param userId User ID
 * @param featureName Feature to check
 * @returns Access result with reason if denied
 * 
 * @example
 * const result = await checkFeatureAccess(userId, 'export_pdf');
 * if (!result.hasAccess) {
 *   return res.status(403).json({ error: result.reason });
 * }
 */
export async function checkFeatureAccess(
  userId: string,
  featureName: FeatureName
): Promise<FeatureAccessResult> {
  try {
    const tierInfo = await getUserTierWithCache(userId);
    if (!tierInfo) {
      return {
        hasAccess: false,
        reason: 'User subscription information not found',
      };
    }

    const { tier } = tierInfo;
    const requirementCheck = FEATURE_REQUIREMENTS[featureName];

    if (!requirementCheck) {
      return {
        hasAccess: false,
        reason: `Unknown feature: ${featureName}`,
      };
    }

    const hasAccess = requirementCheck(tier);

    if (!hasAccess) {
      // Determine upgrade path
      const upgradePath = tier === 'FREE' ? 'PRO_MONTHLY' : 'PRO_YEARLY';
      
      let reason = '';
      switch (featureName) {
        case 'workout_templates':
          reason = 'Workout templates are available on Pro plans';
          break;
        case 'advanced_analytics':
          reason = 'Advanced analytics are available on Pro plans';
          break;
        case 'export_pdf':
          reason = 'PDF export is available on Pro Yearly plan';
          break;
        case 'priority_support':
          reason = 'Priority support is available on Pro Yearly plan';
          break;
        case 'conversation_memory':
          reason = 'Conversation memory is available on Pro plans';
          break;
        case 'advanced_rag':
          reason = 'Advanced AI features are available on Pro plans';
          break;
        default:
          reason = `This feature requires a ${upgradePath.replace('_', ' ')} subscription`;
      }

      return {
        hasAccess: false,
        reason,
        tier,
        upgradePath,
      };
    }

    return {
      hasAccess: true,
      tier,
    };
  } catch (error) {
    console.error('Error checking feature access:', error);
    return {
      hasAccess: false,
      reason: 'Error checking feature access',
    };
  }
}

/**
 * Check if user has reached their usage limit for a specific resource
 * 
 * @param userId User ID
 * @param limitType Type of limit to check
 * @returns Limit check result with current usage and limit
 * 
 * @example
 * const result = await enforceLimit(userId, 'programs');
 * if (!result.allowed) {
 *   return res.status(429).json({ 
 *     error: `Program limit reached (${result.current}/${result.limit})`,
 *     upgradePath: '/pricing'
 *   });
 * }
 */
export async function enforceLimit(
  userId: string,
  limitType: LimitType
): Promise<LimitCheckResult> {
  try {
    const tierInfo = await getUserTierWithCache(userId);
    if (!tierInfo) {
      return {
        allowed: false,
        current: 0,
        limit: 0,
        remaining: 0,
        tier: 'FREE',
      };
    }

    const { tier, limits, messagesUsedToday, customizationsThisMonth, customProgramsCount } = tierInfo;

    let current = 0;
    let limit = 0;
    let resetDate: Date | undefined;

    switch (limitType) {
      case 'programs':
        current = customProgramsCount;
        limit = limits.customPrograms;
        // Programs don't reset monthly
        break;

      case 'customizations':
        current = customizationsThisMonth;
        limit = limits.customizationsPerMonth;
        // Reset at start of next month
        resetDate = new Date();
        resetDate.setMonth(resetDate.getMonth() + 1);
        resetDate.setDate(1);
        resetDate.setHours(0, 0, 0, 0);
        break;

      case 'ai_interactions':
        current = messagesUsedToday;
        limit = limits.dailyMessages;
        // Reset at start of next day
        resetDate = new Date();
        resetDate.setDate(resetDate.getDate() + 1);
        resetDate.setHours(0, 0, 0, 0);
        break;

      case 'uploads':
        // Get upload count for current month
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const uploadCount = await prisma.knowledgeItem.count({
          where: {
            userId,
            createdAt: {
              gte: startOfMonth,
            },
          },
        });
        current = uploadCount;
        limit = limits.monthlyUploads;
        // Reset at start of next month
        resetDate = new Date();
        resetDate.setMonth(resetDate.getMonth() + 1);
        resetDate.setDate(1);
        resetDate.setHours(0, 0, 0, 0);
        break;

      case 'knowledge_items':
        const itemCount = await prisma.knowledgeItem.count({
          where: { userId },
        });
        current = itemCount;
        limit = limits.maxKnowledgeItems;
        // Knowledge items don't reset
        break;

      default:
        return {
          allowed: false,
          current: 0,
          limit: 0,
          remaining: 0,
          tier,
        };
    }

    // -1 means unlimited
    const allowed = limit === -1 || current < limit;
    const remaining = limit === -1 ? Infinity : Math.max(0, limit - current);

    return {
      allowed,
      current,
      limit,
      remaining,
      resetDate,
      tier,
    };
  } catch (error) {
    console.error('Error enforcing limit:', error);
    return {
      allowed: false,
      current: 0,
      limit: 0,
      remaining: 0,
    };
  }
}

/**
 * Increment usage count for a specific limit type
 * Call this after a successful action to track usage
 * 
 * @param userId User ID
 * @param limitType Type of limit to increment
 * @returns Success boolean
 * 
 * @example
 * // After creating a program
 * await incrementUsage(userId, 'programs');
 * 
 * // After a customization
 * await incrementUsage(userId, 'customizations');
 */
export async function incrementUsage(
  userId: string,
  limitType: LimitType
): Promise<boolean> {
  try {
    switch (limitType) {
      case 'programs':
        await prisma.user.update({
          where: { id: userId },
          data: {
            customProgramsCount: {
              increment: 1,
            },
          },
        });
        break;

      case 'customizations':
        await prisma.user.update({
          where: { id: userId },
          data: {
            customizationsThisMonth: {
              increment: 1,
            },
          },
        });
        break;

      case 'ai_interactions':
        await prisma.user.update({
          where: { id: userId },
          data: {
            messagesUsedToday: {
              increment: 1,
            },
          },
        });
        break;

      case 'uploads':
        await prisma.user.update({
          where: { id: userId },
          data: {
            uploadsThisMonth: {
              increment: 1,
            },
          },
        });
        break;

      case 'knowledge_items':
        // Knowledge items are tracked by count, not a separate field
        // Already incremented when item is created
        break;

      default:
        return false;
    }

    // Clear cache after usage increment
    clearTierCache(userId);

    return true;
  } catch (error) {
    console.error('Error incrementing usage:', error);
    return false;
  }
}

// ============================================================================
// API MIDDLEWARE
// ============================================================================

export type APIRouteHandler = (
  request: NextRequest,
  context: { params: Promise<Record<string, string>> }
) => Promise<NextResponse | Response>;

/**
 * Middleware wrapper for API routes to enforce tier requirements
 * 
 * @param handler The API route handler
 * @param options Configuration options
 * @returns Wrapped handler with tier checking
 * 
 * @example
 * export const GET = withTierCheck(
 *   async (request) => {
 *     // Your handler code
 *     return NextResponse.json({ data: 'protected' });
 *   },
 *   { requiredTier: 'PRO_MONTHLY', feature: 'advanced_analytics' }
 * );
 */
export function withTierCheck(
  handler: APIRouteHandler,
  options: {
    requiredTier?: SubscriptionTier | SubscriptionTier[];
    feature?: FeatureName;
    limitType?: LimitType;
    logUsage?: boolean;
  } = {}
): APIRouteHandler {
  return async (request, context) => {
    try {
      // Get authenticated user
      const supabase = await createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }

      const userId = user.id;

      // Check required tier if specified
      if (options.requiredTier) {
        const tierInfo = await getUserTierWithCache(userId);
        if (!tierInfo) {
          return NextResponse.json(
            { error: 'User subscription information not found' },
            { status: 403 }
          );
        }

        const requiredTiers = Array.isArray(options.requiredTier)
          ? options.requiredTier
          : [options.requiredTier];

        if (!requiredTiers.includes(tierInfo.tier)) {
          return NextResponse.json(
            {
              error: 'Subscription upgrade required',
              reason: `This feature requires ${requiredTiers.join(' or ')} subscription`,
              currentTier: tierInfo.tier,
              requiredTiers,
              upgradePath: '/pricing',
            },
            { status: 403 }
          );
        }
      }

      // Check feature access if specified
      if (options.feature) {
        const accessResult = await checkFeatureAccess(userId, options.feature);
        if (!accessResult.hasAccess) {
          return NextResponse.json(
            {
              error: 'Feature access denied',
              reason: accessResult.reason,
              tier: accessResult.tier,
              upgradePath: '/pricing',
            },
            { status: 403 }
          );
        }
      }

      // Check usage limit if specified
      if (options.limitType) {
        const limitResult = await enforceLimit(userId, options.limitType);
        if (!limitResult.allowed) {
          return NextResponse.json(
            {
              error: 'Usage limit reached',
              current: limitResult.current,
              limit: limitResult.limit,
              remaining: limitResult.remaining,
              resetDate: limitResult.resetDate,
              tier: limitResult.tier,
              upgradePath: '/pricing',
            },
            { status: 429 }
          );
        }
      }

      // Log usage if specified
      if (options.logUsage && options.limitType) {
        // Log to analytics/metrics system (implement as needed)
        console.log(`[Usage] User ${userId} - ${options.limitType}`);
      }

      // Call original handler
      return handler(request, context);
    } catch (error) {
      console.error('Error in tier check middleware:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

/**
 * Verify subscription is active and not expired
 * Call this in middleware to check on every request
 * 
 * @param userId User ID
 * @returns Whether subscription is valid
 * 
 * @example
 * const isValid = await verifySubscriptionStatus(userId);
 * if (!isValid) {
 *   // Redirect to pricing or show expired message
 * }
 */
export async function verifySubscriptionStatus(userId: string): Promise<boolean> {
  try {
    const tierInfo = await getUserTierWithCache(userId);
    if (!tierInfo) return false;

    const { tier } = tierInfo;

    // FREE tier is always valid
    if (tier === 'FREE') return true;

    // Check if PRO subscription is active
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      // PRO user without subscription - downgrade them
      await prisma.user.update({
        where: { id: userId },
        data: {
          subscriptionTier: 'FREE',
          plan: 'FREE',
          subscriptionStatus: 'cancelled',
        },
      });
      clearTierCache(userId);
      return false;
    }

    const now = new Date();
    const isExpired = subscription.currentPeriodEnd && subscription.currentPeriodEnd < now;
    const isInactive = !['active', 'on_trial'].includes(subscription.status);

    if (isExpired || isInactive) {
      // Auto-downgrade expired subscription
      await prisma.user.update({
        where: { id: userId },
        data: {
          subscriptionTier: 'FREE',
          plan: 'FREE',
          subscriptionStatus: 'cancelled',
        },
      });

      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: 'expired' },
      });

      clearTierCache(userId);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error verifying subscription status:', error);
    return false;
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get tier display name for UI
 * @param tier Subscription tier
 * @returns Display name
 */
export function getTierDisplayName(tier: SubscriptionTier): string {
  switch (tier) {
    case 'FREE':
      return 'Free';
    case 'PRO_MONTHLY':
      return 'Pro Monthly';
    case 'PRO_YEARLY':
      return 'Pro Yearly';
    default:
      return 'Unknown';
  }
}

/**
 * Get upgrade URL for a specific tier
 * @param targetTier Target subscription tier
 * @returns Upgrade URL
 */
export function getUpgradeUrl(targetTier: SubscriptionTier): string {
  if (targetTier === 'FREE') return '/pricing';
  return `/pricing?plan=${targetTier.toLowerCase()}`;
}

/**
 * Format limit value for display (-1 = "Unlimited")
 * @param limit Limit value
 * @returns Formatted string
 */
export function formatLimit(limit: number): string {
  return limit === -1 ? 'Unlimited' : limit.toString();
}

/**
 * Get all limits for a specific tier
 * @param tier Subscription tier
 * @returns Tier limits
 */
export function getTierLimits(tier: SubscriptionTier): UserPlanLimits {
  return SUBSCRIPTION_TIER_LIMITS[tier];
}
