/**
 * Example Component: Tier Gate Demo
 * 
 * Demonstrates all client-side tier limit hooks and UI components.
 * This is a reference implementation showing best practices.
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  useCanAccessFeature,
  useUsageLimit,
  useTierGate,
  useHasTier,
  useSubscriptionTier,
  useLimitApproaching,
} from '@/hooks/use-tier-limits';
import {
  UpgradeMessage,
  LimitReachedBanner,
  UsageProgress,
  TierBadge,
  FeatureLockedOverlay,
} from '@/components/tier-gate/tier-gate-ui';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, TrendingUp, FileText } from 'lucide-react';

export default function TierGateDemoPage() {
  return (
    <div className="container mx-auto max-w-6xl space-y-8 py-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold">Tier Limits Demo</h1>
        <p className="text-muted-foreground">
          Interactive examples of tier-based feature gating and usage limits
        </p>
      </div>

      <Tabs defaultValue="basics" className="space-y-6">
        <TabsList>
          <TabsTrigger value="basics">Basic Checks</TabsTrigger>
          <TabsTrigger value="usage">Usage Limits</TabsTrigger>
          <TabsTrigger value="advanced">Advanced Patterns</TabsTrigger>
          <TabsTrigger value="ui">UI Components</TabsTrigger>
        </TabsList>

        {/* Basics Tab */}
        <TabsContent value="basics" className="space-y-6">
          <SubscriptionInfoCard />
          <FeatureAccessCard />
          <TierCheckCard />
        </TabsContent>

        {/* Usage Tab */}
        <TabsContent value="usage" className="space-y-6">
          <UsageLimitCard />
          <LimitApproachingCard />
          <MultiLimitCard />
        </TabsContent>

        {/* Advanced Tab */}
        <TabsContent value="advanced" className="space-y-6">
          <ConditionalRenderingCard />
          <TierGateHookCard />
        </TabsContent>

        {/* UI Tab */}
        <TabsContent value="ui" className="space-y-6">
          <UIComponentsShowcase />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================================================
// EXAMPLE 1: Subscription Info
// ============================================================================

function SubscriptionInfoCard() {
  const { data, isLoading, error } = useSubscriptionTier();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Subscription</CardTitle>
        <CardDescription>Current tier and usage information</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}
        {error && <p className="text-sm text-red-500">Error loading subscription data</p>}
        {data && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Current Tier:</span>
              <TierBadge tier={data.tier} />
            </div>
            <div className="space-y-2 rounded-lg border p-4">
              <p className="text-sm font-medium">Usage:</p>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>Programs: {data.usage.customProgramsCount} / {data.limits.customPrograms === -1 ? '∞' : data.limits.customPrograms}</li>
                <li>Customizations: {data.usage.customizationsThisMonth} / {data.limits.customizationsPerMonth === -1 ? '∞' : data.limits.customizationsPerMonth}</li>
                <li>Messages: {data.usage.messagesUsedToday} / {data.limits.dailyMessages === -1 ? '∞' : data.limits.dailyMessages}</li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// EXAMPLE 2: Feature Access Check
// ============================================================================

function FeatureAccessCard() {
  const pdfAccess = useCanAccessFeature('export_pdf');
  const templatesAccess = useCanAccessFeature('workout_templates');
  const analyticsAccess = useCanAccessFeature('advanced_analytics');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Feature Access</CardTitle>
        <CardDescription>Check which features you can access</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <FeatureAccessRow
          icon={<Download className="h-5 w-5" />}
          name="PDF Export"
          access={pdfAccess}
        />
        <FeatureAccessRow
          icon={<FileText className="h-5 w-5" />}
          name="Workout Templates"
          access={templatesAccess}
        />
        <FeatureAccessRow
          icon={<TrendingUp className="h-5 w-5" />}
          name="Advanced Analytics"
          access={analyticsAccess}
        />
      </CardContent>
    </Card>
  );
}

function FeatureAccessRow({
  icon,
  name,
  access,
}: {
  icon: React.ReactNode;
  name: string;
  access: ReturnType<typeof useCanAccessFeature>;
}) {
  const { hasAccess, isLoading, reason, upgradePath } = access;

  return (
    <div className="flex items-center justify-between rounded-lg border p-4">
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <p className="font-medium">{name}</p>
          {!hasAccess && <p className="text-sm text-muted-foreground">{reason}</p>}
        </div>
      </div>
      {isLoading ? (
        <span className="text-sm text-muted-foreground">Loading...</span>
      ) : hasAccess ? (
        <span className="text-sm font-medium text-emerald-600">✓ Available</span>
      ) : (
        <Button asChild size="sm" variant="outline">
          <a href={upgradePath}>Upgrade</a>
        </Button>
      )}
    </div>
  );
}

// ============================================================================
// EXAMPLE 3: Tier Check
// ============================================================================

function TierCheckCard() {
  const { hasTier: isPro, isLoading, currentTier } = useHasTier('PRO_MONTHLY');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tier Check</CardTitle>
        <CardDescription>Check if user meets minimum tier requirement</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <span className="font-medium">Is Pro Tier?</span>
              <span className={`font-bold ${isPro ? 'text-emerald-600' : 'text-gray-400'}`}>
                {isPro ? 'Yes' : 'No'}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Current tier: <TierBadge tier={currentTier!} size="sm" />
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// EXAMPLE 4: Usage Limits
// ============================================================================

function UsageLimitCard() {
  const programLimit = useUsageLimit('programs');
  const customizationLimit = useUsageLimit('customizations');
  const aiLimit = useUsageLimit('ai_interactions');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Usage Limits</CardTitle>
        <CardDescription>Track your usage across different resources</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <UsageProgress
          current={programLimit.current}
          limit={programLimit.limit}
          label="Programs Created"
        />
        <UsageProgress
          current={customizationLimit.current}
          limit={customizationLimit.limit}
          label="Customizations This Month"
        />
        <UsageProgress
          current={aiLimit.current}
          limit={aiLimit.limit}
          label="AI Messages Today"
        />
      </CardContent>
    </Card>
  );
}

// ============================================================================
// EXAMPLE 5: Limit Approaching Warning
// ============================================================================

function LimitApproachingCard() {
  const { isApproaching: programsApproaching } = useLimitApproaching('programs', 0.8);
  const { isApproaching: customizationsApproaching } = useLimitApproaching('customizations', 0.8);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Limit Warnings</CardTitle>
        <CardDescription>Get notified when approaching limits</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {programsApproaching && (
          <Alert className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950">
            <AlertDescription className="text-amber-700 dark:text-amber-300">
              You&apos;re approaching your program limit. <Link href="/pricing" className="underline">Upgrade for unlimited</Link>
            </AlertDescription>
          </Alert>
        )}
        {customizationsApproaching && (
          <Alert className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950">
            <AlertDescription className="text-amber-700 dark:text-amber-300">
              You&apos;re approaching your customization limit this month. <Link href="/pricing" className="underline">Upgrade for unlimited</Link>
            </AlertDescription>
          </Alert>
        )}
        {!programsApproaching && !customizationsApproaching && (
          <p className="text-sm text-muted-foreground">All limits are healthy</p>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// EXAMPLE 6: Multiple Limits
// ============================================================================

function MultiLimitCard() {
  const programLimit = useUsageLimit('programs');
  const customizationLimit = useUsageLimit('customizations');

  const canCreateProgram = programLimit.allowed;
  const canCustomize = customizationLimit.allowed;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Action Permissions</CardTitle>
        <CardDescription>Check if specific actions are allowed</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Button disabled={!canCreateProgram} className="w-full">
            Create New Program
          </Button>
          {!canCreateProgram && (
            <LimitReachedBanner
              current={programLimit.current}
              limit={programLimit.limit}
              limitType="programs"
              resetDate={programLimit.resetDate}
            />
          )}
        </div>

        <div className="space-y-2">
          <Button disabled={!canCustomize} className="w-full">
            Customize Program
          </Button>
          {!canCustomize && (
            <LimitReachedBanner
              current={customizationLimit.current}
              limit={customizationLimit.limit}
              limitType="customizations"
              resetDate={customizationLimit.resetDate}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// EXAMPLE 7: Conditional Rendering
// ============================================================================

function ConditionalRenderingCard() {
  const { hasAccess, isLoading, reason, upgradePath } = useCanAccessFeature('export_pdf');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Conditional Rendering</CardTitle>
        <CardDescription>Show/hide features based on tier</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : hasAccess ? (
          <div className="space-y-4">
            <p className="text-sm text-emerald-600 font-medium">✓ You have access to PDF export</p>
            <Button className="w-full">
              <Download className="mr-2 h-4 w-4" />
              Export to PDF
            </Button>
          </div>
        ) : (
          <UpgradeMessage reason={reason} upgradePath={upgradePath} />
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// EXAMPLE 8: Tier Gate Hook
// ============================================================================

function TierGateHookCard() {
  const [attempts, setAttempts] = useState(0);

  const { canAccess, isLoading, reason, upgradePath } = useTierGate('advanced_analytics', {
    onAccessDenied: () => {
      console.log('Access denied to advanced analytics');
      setAttempts((prev) => prev + 1);
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tier Gate Hook</CardTitle>
        <CardDescription>Combined hook with callbacks</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : canAccess ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950">
            <p className="font-medium text-emerald-900 dark:text-emerald-200">
              Advanced Analytics Enabled
            </p>
            <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-300">
              You can access all advanced analytics features
            </p>
          </div>
        ) : (
          <>
            <UpgradeMessage reason={reason} upgradePath={upgradePath} />
            {attempts > 0 && (
              <p className="text-xs text-muted-foreground">
                Access denied {attempts} time{attempts > 1 ? 's' : ''}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// EXAMPLE 9: UI Components Showcase
// ============================================================================

function UIComponentsShowcase() {
  return (
    <div className="space-y-6">
      {/* Upgrade Messages */}
      <Card>
        <CardHeader>
          <CardTitle>Upgrade Messages</CardTitle>
          <CardDescription>Different variants and styles</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <UpgradeMessage
            reason="PDF export requires Pro Yearly subscription"
            upgradePath="/pricing?plan=pro_yearly"
            variant="default"
          />
          <UpgradeMessage
            reason="Advanced features require Pro"
            upgradePath="/pricing"
            variant="compact"
          />
        </CardContent>
      </Card>

      {/* Tier Badges */}
      <Card>
        <CardHeader>
          <CardTitle>Tier Badges</CardTitle>
          <CardDescription>Display subscription tiers</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-4">
          <TierBadge tier="FREE" size="sm" />
          <TierBadge tier="FREE" size="md" />
          <TierBadge tier="FREE" size="lg" />
          <TierBadge tier="PRO_MONTHLY" size="md" />
          <TierBadge tier="PRO_YEARLY" size="md" />
        </CardContent>
      </Card>

      {/* Feature Locked Overlay */}
      <Card>
        <CardHeader>
          <CardTitle>Feature Locked Overlay</CardTitle>
          <CardDescription>Blur and lock features</CardDescription>
        </CardHeader>
        <CardContent>
          <FeatureLockedOverlay
            reason="Advanced charts require Pro subscription"
            upgradePath="/pricing"
          >
            <div className="rounded-lg border p-6">
              <h3 className="text-lg font-medium">Advanced Analytics Chart</h3>
              <div className="mt-4 h-48 rounded bg-gradient-to-r from-blue-500 to-purple-500" />
            </div>
          </FeatureLockedOverlay>
        </CardContent>
      </Card>
    </div>
  );
}
