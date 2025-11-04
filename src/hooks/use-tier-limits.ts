/**
 * Client-Side Tier Limits Hooks
 * 
 * React hooks for checking feature access and usage limits on the client side.
 * Uses SWR for efficient caching and revalidation.
 * 
 * Hooks:
 * - useCanAccessFeature(): Check if user can access a feature
 * - useUsageLimit(): Check current usage against limit
 * - useSubscriptionTier(): Get user's subscription tier info
 * - useTierGate(): Combined hook for gating components
 */

'use client';

import { useEffect, useMemo } from 'react';
import useSWR from 'swr';
import { SubscriptionTier } from '@prisma/client';
import type { FeatureName, LimitType } from '@/lib/tier-limits';

// ============================================================================
// TYPES
// ============================================================================

interface SubscriptionTierData {
  tier: SubscriptionTier;
  limits: {
    customPrograms: number;
    customizationsPerMonth: number;
    dailyMessages: number;
    monthlyUploads: number;
    maxKnowledgeItems: number;
  };
  usage: {
    messagesUsedToday: number;
    customizationsThisMonth: number;
    customProgramsCount: number;
  };
  subscription: {
    id: string;
    status: string;
    currentPeriodEnd: Date;
    planId: string;
  } | null;
}

interface FeatureAccessResult {
  hasAccess: boolean;
  isLoading: boolean;
  tier?: SubscriptionTier;
  reason?: string;
  upgradePath?: string;
}

interface UsageLimitResult {
  allowed: boolean;
  isLoading: boolean;
  current: number;
  limit: number;
  remaining: number;
  percentage: number;
  resetDate?: Date;
  tier?: SubscriptionTier;
}

interface TierGateOptions {
  fallback?: React.ReactNode;
  showUpgrade?: boolean;
  onAccessDenied?: () => void;
}

// ============================================================================
// FETCHERS
// ============================================================================

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = new Error('Failed to fetch') as Error & { status?: number };
    error.status = res.status;
    throw error;
  }
  return res.json();
};

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook to get user's subscription tier and limits
 * 
 * @returns Subscription tier data with SWR state
 * 
 * @example
 * const { data, isLoading, error } = useSubscriptionTier();
 * if (data) {
 *   console.log('User tier:', data.tier);
 *   console.log('Programs used:', data.usage.customProgramsCount);
 * }
 */
export function useSubscriptionTier() {
  return useSWR<SubscriptionTierData>('/api/user/subscription-tier', fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 60000, // 1 minute
  });
}

/**
 * Hook to check if user can access a specific feature
 * 
 * @param featureName Feature to check
 * @returns Access result with loading state
 * 
 * @example
 * const { hasAccess, isLoading, reason } = useCanAccessFeature('export_pdf');
 * 
 * if (isLoading) return <Skeleton />;
 * if (!hasAccess) {
 *   return <UpgradePrompt message={reason} />;
 * }
 */
export function useCanAccessFeature(featureName: FeatureName): FeatureAccessResult {
  const { data: tierData, isLoading } = useSubscriptionTier();

  const result = useMemo(() => {
    if (isLoading || !tierData) {
      return {
        hasAccess: false,
        isLoading: true,
      };
    }

    const { tier } = tierData;

    // Feature to tier mapping (client-side version)
    const featureRequirements: Record<FeatureName, (tier: SubscriptionTier) => boolean> = {
      create_program: () => true, // All tiers
      customize_program: () => true, // All tiers
      ai_assistant: () => true, // All tiers
      workout_templates: (t) => t !== 'FREE',
      advanced_analytics: (t) => t !== 'FREE',
      export_pdf: (t) => t === 'PRO_YEARLY',
      priority_support: (t) => t === 'PRO_YEARLY',
      conversation_memory: (t) => t !== 'FREE',
      advanced_rag: (t) => t !== 'FREE',
    };

    const requirementCheck = featureRequirements[featureName];
    if (!requirementCheck) {
      return {
        hasAccess: false,
        isLoading: false,
        reason: `Unknown feature: ${featureName}`,
      };
    }

    const hasAccess = requirementCheck(tier);

    if (!hasAccess) {
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
        isLoading: false,
        tier,
        reason,
        upgradePath: `/pricing?plan=${upgradePath.toLowerCase()}`,
      };
    }

    return {
      hasAccess: true,
      isLoading: false,
      tier,
    };
  }, [tierData, isLoading, featureName]);

  return result;
}

/**
 * Hook to check usage limits for a specific resource
 * 
 * @param limitType Type of limit to check
 * @returns Usage limit result with percentage and remaining count
 * 
 * @example
 * const { allowed, current, limit, percentage } = useUsageLimit('programs');
 * 
 * if (!allowed) {
 *   return <LimitReachedBanner current={current} limit={limit} />;
 * }
 * 
 * return <ProgressBar value={percentage} label={`${current}/${limit}`} />;
 */
export function useUsageLimit(limitType: LimitType): UsageLimitResult {
  const { data: tierData, isLoading } = useSubscriptionTier();

  const result = useMemo(() => {
    if (isLoading || !tierData) {
      return {
        allowed: false,
        isLoading: true,
        current: 0,
        limit: 0,
        remaining: 0,
        percentage: 0,
      };
    }

    const { tier, limits, usage } = tierData;

    let current = 0;
    let limit = 0;
    let resetDate: Date | undefined;

    switch (limitType) {
      case 'programs':
        current = usage.customProgramsCount;
        limit = limits.customPrograms;
        break;

      case 'customizations':
        current = usage.customizationsThisMonth;
        limit = limits.customizationsPerMonth;
        // Reset at start of next month
        resetDate = new Date();
        resetDate.setMonth(resetDate.getMonth() + 1);
        resetDate.setDate(1);
        resetDate.setHours(0, 0, 0, 0);
        break;

      case 'ai_interactions':
        current = usage.messagesUsedToday;
        limit = limits.dailyMessages;
        // Reset at start of next day
        resetDate = new Date();
        resetDate.setDate(resetDate.getDate() + 1);
        resetDate.setHours(0, 0, 0, 0);
        break;

      case 'uploads':
        // Would need separate API call for this
        current = 0;
        limit = limits.monthlyUploads;
        resetDate = new Date();
        resetDate.setMonth(resetDate.getMonth() + 1);
        resetDate.setDate(1);
        resetDate.setHours(0, 0, 0, 0);
        break;

      case 'knowledge_items':
        // Would need separate API call for this
        current = 0;
        limit = limits.maxKnowledgeItems;
        break;

      default:
        return {
          allowed: false,
          isLoading: false,
          current: 0,
          limit: 0,
          remaining: 0,
          percentage: 0,
          tier,
        };
    }

    // -1 means unlimited
    const allowed = limit === -1 || current < limit;
    const remaining = limit === -1 ? Infinity : Math.max(0, limit - current);
    const percentage = limit === -1 ? 0 : (current / limit) * 100;

    return {
      allowed,
      isLoading: false,
      current,
      limit,
      remaining,
      percentage,
      resetDate,
      tier,
    };
  }, [tierData, isLoading, limitType]);

  return result;
}

/**
 * Combined hook for gating components based on tier access
 * Returns boolean and provides upgrade helpers
 * 
 * @param featureName Feature to check
 * @param options Configuration options
 * @returns Access status and helper data
 * 
 * @example
 * const { canAccess, isLoading, reason, upgradePath } = useTierGate('export_pdf');
 * 
 * if (isLoading) return <Skeleton />;
 * if (!canAccess) return <UpgradeMessage reason={reason} upgradePath={upgradePath} />;
 * 
 * return <ExportButton />;
 */
export function useTierGate(
  featureName: FeatureName,
  options: TierGateOptions = {}
) {
  const { hasAccess, isLoading, reason, upgradePath, tier } = useCanAccessFeature(featureName);

  useEffect(() => {
    if (!isLoading && !hasAccess && options.onAccessDenied) {
      options.onAccessDenied();
    }
  }, [hasAccess, isLoading, options]);

  return {
    canAccess: hasAccess,
    isLoading,
    tier,
    reason,
    upgradePath,
    showUpgrade: options.showUpgrade && !hasAccess,
  };
}

/**
 * Hook to check if user is on a specific tier or higher
 * 
 * @param minTier Minimum required tier
 * @returns Whether user meets tier requirement
 * 
 * @example
 * const isPro = useHasTier('PRO_MONTHLY');
 * if (isPro) {
 *   return <ProFeatures />;
 * }
 */
export function useHasTier(minTier: SubscriptionTier): {
  hasTier: boolean;
  isLoading: boolean;
  currentTier?: SubscriptionTier;
} {
  const { data: tierData, isLoading } = useSubscriptionTier();

  const result = useMemo(() => {
    if (isLoading || !tierData) {
      return {
        hasTier: false,
        isLoading: true,
      };
    }

    const { tier } = tierData;

    // Tier hierarchy: FREE < PRO_MONTHLY < PRO_YEARLY
    const tierHierarchy: Record<SubscriptionTier, number> = {
      FREE: 0,
      PRO_MONTHLY: 1,
      PRO_YEARLY: 2,
    };

    const hasTier = tierHierarchy[tier] >= tierHierarchy[minTier];

    return {
      hasTier,
      isLoading: false,
      currentTier: tier,
    };
  }, [tierData, isLoading, minTier]);

  return result;
}

/**
 * Hook to format limit values for display
 * 
 * @param limit Limit value (-1 for unlimited)
 * @returns Formatted string
 */
export function useFormatLimit(limit: number): string {
  return useMemo(() => {
    if (limit === -1) return 'Unlimited';
    if (limit >= 1000) return `${(limit / 1000).toFixed(1)}k`;
    return limit.toString();
  }, [limit]);
}

/**
 * Hook to get tier display name
 * 
 * @param tier Subscription tier
 * @returns Display name
 */
export function useTierDisplayName(tier?: SubscriptionTier): string {
  return useMemo(() => {
    if (!tier) return 'Unknown';
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
  }, [tier]);
}

/**
 * Hook to track when limit is approaching (>80%)
 * 
 * @param limitType Type of limit to track
 * @param threshold Warning threshold (default 0.8)
 * @returns Whether limit is approaching
 * 
 * @example
 * const isApproaching = useLimitApproaching('programs', 0.9);
 * if (isApproaching) {
 *   return <WarningBanner>Almost at your program limit!</WarningBanner>;
 * }
 */
export function useLimitApproaching(
  limitType: LimitType,
  threshold: number = 0.8
): {
  isApproaching: boolean;
  isLoading: boolean;
  percentage: number;
} {
  const { percentage, isLoading } = useUsageLimit(limitType);

  const isApproaching = useMemo(() => {
    return percentage >= threshold * 100;
  }, [percentage, threshold]);

  return {
    isApproaching,
    isLoading,
    percentage,
  };
}
