/**
 * Tier Gate UI Components
 * 
 * Reusable components for gating features behind subscription tiers.
 */

'use client';

import { Lock } from 'lucide-react';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface UpgradeMessageProps {
  reason?: string;
  upgradePath?: string;
  title?: string;
  showButton?: boolean;
  variant?: 'default' | 'compact';
}

/**
 * Upgrade message component to show when user doesn't have access
 * 
 * @example
 * const { canAccess, reason, upgradePath } = useTierGate('export_pdf');
 * if (!canAccess) {
 *   return <UpgradeMessage reason={reason} upgradePath={upgradePath} />;
 * }
 */
export function UpgradeMessage({
  reason = 'This feature requires a subscription upgrade.',
  upgradePath = '/pricing',
  title = 'Upgrade Required',
  showButton = true,
  variant = 'default',
}: UpgradeMessageProps) {
  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm dark:border-amber-900 dark:bg-amber-950">
        <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        <span className="text-amber-700 dark:text-amber-300">{reason}</span>
        {showButton && (
          <Link
            href={upgradePath}
            className="ml-auto text-xs font-medium text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
          >
            Upgrade
          </Link>
        )}
      </div>
    );
  }

  return (
    <Alert className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950">
      <Lock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
      <AlertTitle className="text-amber-900 dark:text-amber-200">{title}</AlertTitle>
      <AlertDescription className="text-amber-700 dark:text-amber-300">
        {reason}
      </AlertDescription>
      {showButton && (
        <div className="mt-3">
          <Button asChild size="sm" variant="default">
            <Link href={upgradePath}>View Plans</Link>
          </Button>
        </div>
      )}
    </Alert>
  );
}

interface LimitReachedBannerProps {
  current: number;
  limit: number;
  limitType: string;
  resetDate?: Date;
  upgradePath?: string;
}

/**
 * Banner to show when user has reached a usage limit
 * 
 * @example
 * const { allowed, current, limit, resetDate } = useUsageLimit('programs');
 * if (!allowed) {
 *   return (
 *     <LimitReachedBanner
 *       current={current}
 *       limit={limit}
 *       limitType="programs"
 *       resetDate={resetDate}
 *     />
 *   );
 * }
 */
export function LimitReachedBanner({
  current,
  limit,
  limitType,
  resetDate,
  upgradePath = '/pricing',
}: LimitReachedBannerProps) {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  return (
    <Alert className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950">
      <Lock className="h-5 w-5 text-red-600 dark:text-red-400" />
      <AlertTitle className="text-red-900 dark:text-red-200">Limit Reached</AlertTitle>
      <AlertDescription className="text-red-700 dark:text-red-300">
        You&apos;ve reached your {limitType} limit ({current}/{limit}).
        {resetDate && ` Your limit will reset on ${formatDate(resetDate)}.`}
      </AlertDescription>
      <div className="mt-3">
        <Button asChild size="sm" variant="default">
          <Link href={upgradePath}>Upgrade for Unlimited</Link>
        </Button>
      </div>
    </Alert>
  );
}

interface UsageProgressProps {
  current: number;
  limit: number;
  label: string;
  showPercentage?: boolean;
}

/**
 * Progress bar to show usage towards limit
 * 
 * @example
 * const { current, limit } = useUsageLimit('customizations');
 * return (
 *   <UsageProgress
 *     current={current}
 *     limit={limit}
 *     label="Customizations this month"
 *   />
 * );
 */
export function UsageProgress({
  current,
  limit,
  label,
  showPercentage = true,
}: UsageProgressProps) {
  const percentage = limit === -1 ? 0 : (current / limit) * 100;
  const isUnlimited = limit === -1;
  const isNearLimit = percentage >= 80;

  const progressColor = isNearLimit
    ? 'bg-red-500'
    : percentage >= 60
    ? 'bg-amber-500'
    : 'bg-emerald-500';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">
          {current}/{isUnlimited ? '∞' : limit}
          {showPercentage && !isUnlimited && ` (${percentage.toFixed(0)}%)`}
        </span>
      </div>
      {!isUnlimited && (
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full transition-all ${progressColor}`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}

interface TierBadgeProps {
  tier: 'FREE' | 'PRO_MONTHLY' | 'PRO_YEARLY';
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Badge to display user's subscription tier
 * 
 * @example
 * const { tier } = useSubscriptionTier();
 * return <TierBadge tier={tier} />;
 */
export function TierBadge({ tier, size = 'md' }: TierBadgeProps) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  const tierConfig = {
    FREE: {
      label: 'Free',
      bgColor: 'bg-gray-100 dark:bg-gray-800',
      textColor: 'text-gray-700 dark:text-gray-300',
    },
    PRO_MONTHLY: {
      label: 'Pro',
      bgColor: 'bg-emerald-100 dark:bg-emerald-900',
      textColor: 'text-emerald-700 dark:text-emerald-300',
    },
    PRO_YEARLY: {
      label: 'Pro Yearly',
      bgColor: 'bg-violet-100 dark:bg-violet-900',
      textColor: 'text-violet-700 dark:text-violet-300',
    },
  };

  const config = tierConfig[tier];

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${config.bgColor} ${config.textColor} ${sizeClasses[size]}`}
    >
      {config.label}
    </span>
  );
}

interface FeatureLockedOverlayProps {
  reason?: string;
  upgradePath?: string;
  children: React.ReactNode;
}

/**
 * Overlay to show on locked features
 * 
 * @example
 * const { canAccess } = useTierGate('export_pdf');
 * return (
 *   <FeatureLockedOverlay
 *     reason="PDF export requires Pro Yearly"
 *     upgradePath="/pricing"
 *     isLocked={!canAccess}
 *   >
 *     <ExportButton />
 *   </FeatureLockedOverlay>
 * );
 */
export function FeatureLockedOverlay({
  reason = 'This feature requires an upgrade',
  upgradePath = '/pricing',
  children,
}: FeatureLockedOverlayProps) {
  return (
    <div className="relative">
      <div className="pointer-events-none opacity-50 blur-sm">{children}</div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="rounded-lg border border-amber-200 bg-white/95 p-4 shadow-lg backdrop-blur-sm dark:border-amber-900 dark:bg-gray-950/95">
          <div className="flex items-center gap-3">
            <Lock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{reason}</p>
              <Link
                href={upgradePath}
                className="mt-1 text-xs text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
              >
                View plans →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
