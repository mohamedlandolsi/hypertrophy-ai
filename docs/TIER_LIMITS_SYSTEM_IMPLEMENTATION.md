# Tier Limits System - Usage Examples

Complete guide for implementing subscription tier limits and feature gating.

## 📁 Files Created

1. **`src/lib/tier-limits.ts`** (750 lines)
   - Core server-side utilities for tier enforcement
   - Functions: `checkFeatureAccess()`, `enforceLimit()`, `incrementUsage()`, `withTierCheck()`
   - Cache management with 5-minute TTL
   - API middleware for route protection

2. **`src/hooks/use-tier-limits.ts`** (450 lines)
   - Client-side React hooks for feature gating
   - Hooks: `useCanAccessFeature()`, `useUsageLimit()`, `useTierGate()`, `useHasTier()`
   - SWR-based caching for efficient data fetching

3. **`src/components/tier-gate/tier-gate-ui.tsx`** (250 lines)
   - Reusable UI components for tier gates
   - Components: `UpgradeMessage`, `LimitReachedBanner`, `UsageProgress`, `TierBadge`, `FeatureLockedOverlay`

## 🎯 Quick Start

### Server-Side: API Route Protection

```typescript
// app/api/programs/create/route.ts
import { withTierCheck } from '@/lib/tier-limits';
import { NextRequest, NextResponse } from 'next/server';

export const POST = withTierCheck(
  async (request: NextRequest) => {
    const body = await request.json();
    
    // Your program creation logic here
    const program = await createProgram(body);
    
    return NextResponse.json({ program });
  },
  {
    // Check usage limit before allowing action
    limitType: 'programs',
    
    // Log usage for analytics
    logUsage: true,
  }
);
```

### Server-Side: Check Feature Access

```typescript
// app/api/export/pdf/route.ts
import { checkFeatureAccess, enforceLimit } from '@/lib/tier-limits';
import { NextRequest, NextResponse } from 'next/server';

export const POST = async (request: NextRequest) => {
  const { user } = await getAuthenticatedUser(request);
  
  // Check if user can access PDF export
  const access = await checkFeatureAccess(user.id, 'export_pdf');
  if (!access.hasAccess) {
    return NextResponse.json(
      { 
        error: access.reason,
        upgradePath: access.upgradePath 
      },
      { status: 403 }
    );
  }
  
  // Generate PDF
  const pdf = await generatePDF();
  
  return new Response(pdf, {
    headers: { 'Content-Type': 'application/pdf' },
  });
};
```

### Server-Side: Enforce Usage Limits

```typescript
// app/api/programs/customize/route.ts
import { enforceLimit, incrementUsage } from '@/lib/tier-limits';

export const POST = async (request: NextRequest) => {
  const { user } = await getAuthenticatedUser(request);
  
  // Check if user has remaining customizations
  const limit = await enforceLimit(user.id, 'customizations');
  if (!limit.allowed) {
    return NextResponse.json(
      {
        error: 'Customization limit reached',
        current: limit.current,
        limit: limit.limit,
        resetDate: limit.resetDate,
        upgradePath: '/pricing',
      },
      { status: 429 }
    );
  }
  
  // Perform customization
  const result = await customizeProgram(body);
  
  // Increment usage count
  await incrementUsage(user.id, 'customizations');
  
  return NextResponse.json({ result });
};
```

### Client-Side: Feature Gating with Hooks

```tsx
// components/ExportButton.tsx
'use client';

import { useCanAccessFeature } from '@/hooks/use-tier-limits';
import { UpgradeMessage } from '@/components/tier-gate/tier-gate-ui';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

export function ExportButton({ programId }: { programId: string }) {
  const { hasAccess, isLoading, reason, upgradePath } = useCanAccessFeature('export_pdf');
  
  if (isLoading) {
    return <Button disabled>Loading...</Button>;
  }
  
  if (!hasAccess) {
    return <UpgradeMessage reason={reason} upgradePath={upgradePath} variant="compact" />;
  }
  
  return (
    <Button onClick={() => exportToPDF(programId)}>
      <Download className="mr-2 h-4 w-4" />
      Export PDF
    </Button>
  );
}
```

### Client-Side: Usage Limit Display

```tsx
// components/ProgramUsageCard.tsx
'use client';

import { useUsageLimit } from '@/hooks/use-tier-limits';
import { UsageProgress, LimitReachedBanner } from '@/components/tier-gate/tier-gate-ui';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function ProgramUsageCard() {
  const { allowed, current, limit, isLoading, resetDate } = useUsageLimit('programs');
  
  if (isLoading) return <Card><CardContent>Loading...</CardContent></Card>;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Program Usage</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <UsageProgress
          current={current}
          limit={limit}
          label="Custom Programs Created"
        />
        
        {!allowed && (
          <LimitReachedBanner
            current={current}
            limit={limit}
            limitType="programs"
            resetDate={resetDate}
          />
        )}
      </CardContent>
    </Card>
  );
}
```

### Client-Side: Tier-Based Conditional Rendering

```tsx
// components/FeatureList.tsx
'use client';

import { useTierGate } from '@/hooks/use-tier-limits';
import { UpgradeMessage } from '@/components/tier-gate/tier-gate-ui';

export function AdvancedAnalytics() {
  const { canAccess, isLoading, reason, upgradePath } = useTierGate('advanced_analytics', {
    onAccessDenied: () => {
      console.log('User attempted to access advanced analytics without Pro');
    },
  });
  
  if (isLoading) return <Skeleton />;
  if (!canAccess) return <UpgradeMessage reason={reason} upgradePath={upgradePath} />;
  
  return (
    <div>
      <h2>Advanced Analytics</h2>
      <AnalyticsCharts />
    </div>
  );
}
```

### Client-Side: Multiple Limit Checks

```tsx
// components/ProgramCreator.tsx
'use client';

import { useUsageLimit, useLimitApproaching } from '@/hooks/use-tier-limits';
import { Alert } from '@/components/ui/alert';

export function ProgramCreator() {
  const { allowed, current, limit } = useUsageLimit('programs');
  const { isApproaching } = useLimitApproaching('programs', 0.8);
  
  return (
    <div>
      {isApproaching && !allowed && (
        <Alert variant="warning">
          You're approaching your program limit ({current}/{limit}). 
          <a href="/pricing">Upgrade for unlimited programs</a>
        </Alert>
      )}
      
      <CreateProgramForm disabled={!allowed} />
    </div>
  );
}
```

## 🔧 Feature to Tier Mapping

| Feature | FREE | PRO Monthly | PRO Yearly |
|---------|------|-------------|------------|
| `create_program` | ✅ (2 max) | ✅ Unlimited | ✅ Unlimited |
| `customize_program` | ✅ (5/month) | ✅ Unlimited | ✅ Unlimited |
| `ai_assistant` | ✅ (10/day) | ✅ Unlimited | ✅ Unlimited |
| `workout_templates` | ❌ | ✅ | ✅ |
| `advanced_analytics` | ❌ | ✅ | ✅ |
| `export_pdf` | ❌ | ❌ | ✅ |
| `priority_support` | ❌ | ❌ | ✅ |
| `conversation_memory` | ❌ | ✅ | ✅ |
| `advanced_rag` | ❌ | ✅ | ✅ |

## 📊 Limit Types

| Limit Type | FREE Tier | PRO Tier | Reset Period |
|------------|-----------|----------|--------------|
| `programs` | 2 | Unlimited | Never (lifetime) |
| `customizations` | 5 | Unlimited | Monthly |
| `ai_interactions` | 10 | Unlimited | Daily |
| `uploads` | 3 | 50 | Monthly |
| `knowledge_items` | 10 | 500 | Never (lifetime) |

## 🛠️ Middleware Usage Patterns

### Pattern 1: Tier Requirement Only

```typescript
// Requires PRO_MONTHLY or higher
export const GET = withTierCheck(handler, {
  requiredTier: 'PRO_MONTHLY',
});

// Requires exactly PRO_YEARLY
export const GET = withTierCheck(handler, {
  requiredTier: 'PRO_YEARLY',
});

// Requires any PRO tier
export const GET = withTierCheck(handler, {
  requiredTier: ['PRO_MONTHLY', 'PRO_YEARLY'],
});
```

### Pattern 2: Feature Check Only

```typescript
// Check if user can access workout templates
export const GET = withTierCheck(handler, {
  feature: 'workout_templates',
});
```

### Pattern 3: Usage Limit Only

```typescript
// Check program creation limit
export const POST = withTierCheck(handler, {
  limitType: 'programs',
  logUsage: true,
});
```

### Pattern 4: Combined Checks

```typescript
// Check tier AND feature AND limit
export const POST = withTierCheck(handler, {
  requiredTier: 'PRO_MONTHLY',
  feature: 'advanced_analytics',
  limitType: 'customizations',
  logUsage: true,
});
```

## 🎨 UI Components Reference

### UpgradeMessage

```tsx
<UpgradeMessage
  reason="PDF export requires Pro Yearly"
  upgradePath="/pricing?plan=pro_yearly"
  title="Upgrade Required"
  showButton={true}
  variant="default" // or "compact"
/>
```

### LimitReachedBanner

```tsx
<LimitReachedBanner
  current={5}
  limit={5}
  limitType="customizations"
  resetDate={new Date('2025-12-01')}
  upgradePath="/pricing"
/>
```

### UsageProgress

```tsx
<UsageProgress
  current={7}
  limit={10}
  label="AI Messages Today"
  showPercentage={true}
/>
```

### TierBadge

```tsx
<TierBadge tier="PRO_YEARLY" size="md" />
```

### FeatureLockedOverlay

```tsx
<FeatureLockedOverlay
  reason="Advanced analytics require Pro"
  upgradePath="/pricing"
>
  <AnalyticsChart /> {/* Will be blurred and disabled */}
</FeatureLockedOverlay>
```

## 🔐 Cache Management

```typescript
import { clearTierCache, clearAllTierCache } from '@/lib/tier-limits';

// Clear cache for specific user (call when subscription changes)
clearTierCache(userId);

// Clear all cached data (use sparingly)
clearAllTierCache();
```

Cache automatically expires after 5 minutes. Manual clearing is only needed when:
- User upgrades/downgrades subscription
- Admin manually changes user tier
- Subscription expires

## 🧪 Testing

### Test Feature Access

```typescript
// test-tier-limits.ts
import { checkFeatureAccess } from '@/lib/tier-limits';

const result = await checkFeatureAccess('user-id', 'export_pdf');
console.log('Has access:', result.hasAccess);
console.log('Reason:', result.reason);
console.log('Upgrade path:', result.upgradePath);
```

### Test Usage Limits

```typescript
import { enforceLimit, incrementUsage } from '@/lib/tier-limits';

// Check limit
const limit = await enforceLimit('user-id', 'programs');
console.log('Allowed:', limit.allowed);
console.log('Current:', limit.current);
console.log('Limit:', limit.limit);
console.log('Remaining:', limit.remaining);

// Increment usage
if (limit.allowed) {
  await incrementUsage('user-id', 'programs');
}
```

## 🚀 Deployment Checklist

- [ ] Install dependencies: `npm install swr`
- [ ] Run build: `npm run build` (verify no TypeScript errors)
- [ ] Test all tier gates with different subscription tiers
- [ ] Test cache expiration (wait 5 minutes, verify refetch)
- [ ] Test limit resets (daily for AI, monthly for customizations)
- [ ] Verify API middleware returns correct error codes (403, 429)
- [ ] Test client-side hooks with network throttling
- [ ] Test upgrade paths redirect to correct pricing page

## 📝 Migration Guide

If you have existing tier checks, migrate them to use the new system:

### Before

```typescript
// Old way (scattered throughout codebase)
const user = await prisma.user.findUnique({ where: { id: userId } });
if (user.plan !== 'PRO') {
  return NextResponse.json({ error: 'Requires PRO' }, { status: 403 });
}
```

### After

```typescript
// New way (centralized, cached, consistent)
export const POST = withTierCheck(handler, {
  requiredTier: ['PRO_MONTHLY', 'PRO_YEARLY'],
});
```

## 🔍 Troubleshooting

### Issue: "Cache not updating after subscription change"
**Solution**: Call `clearTierCache(userId)` in your subscription webhook handler.

### Issue: "Client hook shows stale data"
**Solution**: SWR automatically revalidates. Check `revalidateOnFocus` setting or manually trigger: `mutate('/api/user/subscription-tier')`.

### Issue: "API returns 429 but limit should reset"
**Solution**: Check system clock. Limits reset at midnight UTC for daily limits, and 1st of month for monthly limits.

### Issue: "TypeScript error: Cannot find module '@/lib/tier-limits'"
**Solution**: Run `npm run build` to regenerate TypeScript paths. Check `tsconfig.json` has `"@/*": ["./src/*"]`.

## 📚 Related Files

- `src/lib/subscription.ts` - Subscription tier limits constants
- `src/lib/currency.ts` - Pricing for upgrade paths
- `src/app/api/user/subscription-tier/route.ts` - API endpoint for tier data
- `src/app/[locale]/pricing/page_new_subscription.tsx` - Pricing page for upgrades

## 🎯 Best Practices

1. **Always use `withTierCheck()` for API routes** - Don't manually check tiers
2. **Cache tier checks** - Use provided caching, don't create your own
3. **Show upgrade paths** - Always provide `upgradePath` in error responses
4. **Increment usage after success** - Call `incrementUsage()` only after successful action
5. **Clear cache on subscription changes** - Call `clearTierCache()` in webhooks
6. **Use client hooks for UI** - Don't fetch tier data manually
7. **Test with all tiers** - Verify FREE, PRO Monthly, and PRO Yearly behaviors
8. **Log usage for analytics** - Set `logUsage: true` in middleware

## 🚦 Error Response Format

All tier-gated endpoints return consistent error responses:

### 403 Forbidden (Feature Access Denied)

```json
{
  "error": "Feature access denied",
  "reason": "PDF export is available on Pro Yearly plan",
  "tier": "PRO_MONTHLY",
  "upgradePath": "/pricing?plan=pro_yearly"
}
```

### 429 Too Many Requests (Usage Limit Reached)

```json
{
  "error": "Usage limit reached",
  "current": 5,
  "limit": 5,
  "remaining": 0,
  "resetDate": "2025-12-01T00:00:00.000Z",
  "tier": "FREE",
  "upgradePath": "/pricing"
}
```

## ✅ Success Metrics

Track these metrics to measure tier system effectiveness:

- Conversion rate: FREE → PRO upgrades triggered by tier gates
- Feature usage by tier: Which features drive upgrades
- Limit friction: How often users hit limits
- Churn rate: Downgrades after hitting limits
- Support tickets: Tier-related confusion

---

**Questions?** Check `src/lib/tier-limits.ts` for detailed JSDoc comments on each function.
