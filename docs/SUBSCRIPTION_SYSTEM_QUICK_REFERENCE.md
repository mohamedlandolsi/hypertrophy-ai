# Subscription System Quick Reference

## Quick Start

### Check User's Subscription Tier

```typescript
import { getUserSubscriptionTier } from '@/lib/subscription';

const tierInfo = await getUserSubscriptionTier();

if (!tierInfo) {
  // User not authenticated
  return;
}

console.log(tierInfo.tier); // 'FREE', 'PRO_MONTHLY', or 'PRO_YEARLY'
console.log(tierInfo.limits); // Object with all feature limits
console.log(tierInfo.messagesUsedToday); // Current daily usage
console.log(tierInfo.customProgramsCount); // Total custom programs created
console.log(tierInfo.customizationsThisMonth); // This month's customizations
```

### Check If User Can Perform Action

```typescript
import { canUserSendMessage, hasProAccess } from '@/lib/subscription';

// Check message limit
const { canSend, reason, messagesRemaining } = await canUserSendMessage();
if (!canSend) {
  return NextResponse.json({ error: reason }, { status: 429 });
}

// Check Pro access
const hasPro = await hasProAccess();
if (!hasPro) {
  return NextResponse.json({ error: 'Pro subscription required' }, { status: 403 });
}
```

### Increment Usage Counters

```typescript
import { incrementUserMessageCount } from '@/lib/subscription';

// After successful AI message
await incrementUserMessageCount();
```

### Upgrade/Downgrade Users (Webhook Handler)

```typescript
import { upgradeUserToProTier, downgradeUserToFreeTier } from '@/lib/subscription';

// Upgrade to monthly
await upgradeUserToProTier(userId, 'PRO_MONTHLY', {
  lemonSqueezyId: 'sub_123',
  planId: 'pro_monthly',
  variantId: '12345',
  currentPeriodStart: new Date(),
  currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 days
});

// Upgrade to yearly
await upgradeUserToProTier(userId, 'PRO_YEARLY', {
  lemonSqueezyId: 'sub_456',
  planId: 'pro_yearly',
  variantId: '67890',
  currentPeriodStart: new Date(),
  currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // +365 days
});

// Downgrade to free
await downgradeUserToFreeTier(userId);
```

## Feature Limits Reference

| Feature | FREE | PRO_MONTHLY | PRO_YEARLY |
|---------|------|-------------|------------|
| Daily AI Messages | 10 | Unlimited | Unlimited |
| Monthly Uploads | 5 | Unlimited | Unlimited |
| Max File Size | 10MB | 100MB | 100MB |
| Conversation Memory | ❌ | ✅ | ✅ |
| Advanced RAG | ❌ | ✅ | ✅ |
| Custom Programs | 2 | Unlimited | Unlimited |
| Customizations/Month | 5 | Unlimited | Unlimited |
| Knowledge Items | 10 | Unlimited | Unlimited |
| PDF Export | ❌ | ❌ | ✅ |
| Priority Support | ❌ | ❌ | ✅ |

## Common Patterns

### API Route with Subscription Check

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { canUserSendMessage, incrementUserMessageCount } from '@/lib/subscription';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  // 1. Authenticate user
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Check subscription limits
  const { canSend, reason } = await canUserSendMessage();
  if (!canSend) {
    return NextResponse.json({ error: reason }, { status: 429 });
  }

  // 3. Perform action
  // ... your logic here

  // 4. Increment usage counter
  await incrementUserMessageCount();

  return NextResponse.json({ success: true });
}
```

### UI Component with Tier-Based Features

```tsx
'use client';

import { useEffect, useState } from 'react';

export function FeatureButton() {
  const [tierInfo, setTierInfo] = useState<any>(null);

  useEffect(() => {
    fetch('/api/user/plan')
      .then(res => res.json())
      .then(data => setTierInfo(data));
  }, []);

  if (!tierInfo) return <div>Loading...</div>;

  const isPro = tierInfo.tier === 'PRO_MONTHLY' || tierInfo.tier === 'PRO_YEARLY';

  return (
    <div>
      <button disabled={!isPro}>
        {isPro ? 'Advanced Feature' : 'Upgrade to Pro'}
      </button>
      
      {tierInfo.tier === 'PRO_YEARLY' && (
        <button>Export to PDF</button>
      )}
    </div>
  );
}
```

### Check Specific Feature Access

```typescript
import { getUserSubscriptionTier } from '@/lib/subscription';

async function checkFeatureAccess(feature: 'pdf_export' | 'priority_support') {
  const tierInfo = await getUserSubscriptionTier();
  
  if (!tierInfo) return false;

  switch (feature) {
    case 'pdf_export':
      return tierInfo.limits.canExportPDF;
    case 'priority_support':
      return tierInfo.limits.hasPrioritySupport;
    default:
      return false;
  }
}

// Usage
const canExportPDF = await checkFeatureAccess('pdf_export');
if (!canExportPDF) {
  return NextResponse.json(
    { error: 'PDF export is only available for Pro Yearly subscribers' },
    { status: 403 }
  );
}
```

## Database Queries

### Get All Pro Users

```typescript
import { prisma } from '@/lib/prisma';

const proUsers = await prisma.user.findMany({
  where: {
    subscriptionTier: {
      in: ['PRO_MONTHLY', 'PRO_YEARLY']
    }
  },
  include: {
    subscription: true
  }
});
```

### Check Subscription Status

```typescript
import { prisma } from '@/lib/prisma';

const user = await prisma.user.findUnique({
  where: { id: userId },
  select: {
    subscriptionTier: true,
    subscriptionStatus: true,
    subscriptionStartDate: true,
    subscriptionEndDate: true,
    subscription: {
      select: {
        status: true,
        lemonSqueezyId: true,
        currentPeriodEnd: true
      }
    }
  }
});

console.log(`Tier: ${user?.subscriptionTier}`);
console.log(`Status: ${user?.subscriptionStatus}`);
console.log(`Expires: ${user?.subscriptionEndDate}`);
```

## Testing

### Mock Subscription for Development

```typescript
// In development environment only
import { prisma } from '@/lib/prisma';

await prisma.user.update({
  where: { id: 'test-user-id' },
  data: {
    subscriptionTier: 'PRO_YEARLY',
    subscriptionStatus: 'active',
    subscriptionStartDate: new Date(),
    subscriptionEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
  }
});
```

### Test Webhook Locally

```bash
# Use LemonSqueezy's webhook testing tool
# Or manually trigger with curl:

curl -X POST http://localhost:3000/api/webhooks/lemon-squeezy \
  -H "Content-Type: application/json" \
  -H "X-Signature: your-test-signature" \
  -d '{
    "meta": {
      "event_name": "subscription_created",
      "test_mode": true,
      "custom_data": {
        "user_id": "your-user-id"
      }
    },
    "data": {
      "id": "123",
      "attributes": {
        "status": "active",
        "product_id": "prod_123",
        "variant_id": "variant_monthly_id",
        "created_at": "2024-01-01T00:00:00Z",
        "renews_at": "2024-02-01T00:00:00Z"
      }
    }
  }'
```

## Troubleshooting

### User Not Upgrading After Payment

1. Check LemonSqueezy webhook logs
2. Verify `LEMONSQUEEZY_WEBHOOK_SECRET` is correct
3. Verify `LEMONSQUEEZY_PRO_MONTHLY_VARIANT_ID` and `LEMONSQUEEZY_PRO_YEARLY_VARIANT_ID` match your LemonSqueezy product variants
4. Check application logs for webhook processing errors

### Subscription Expired But User Still Has Access

Run the validation function:

```typescript
import { validateSubscriptionSecurity } from '@/lib/subscription';

const results = await validateSubscriptionSecurity();
console.log(results);
```

This will automatically downgrade expired subscriptions.

### Feature Limits Not Working

```typescript
// Debug subscription tier info
const tierInfo = await getUserSubscriptionTier();
console.log('Tier:', tierInfo?.tier);
console.log('Limits:', tierInfo?.limits);
console.log('Messages used:', tierInfo?.messagesUsedToday);

// Check if user has subscription record
const user = await prisma.user.findUnique({
  where: { id: userId },
  include: { subscription: true }
});
console.log('User subscription:', user?.subscription);
```

## Migration Notes

### For Existing Code Using Old Functions

Old functions still work but are deprecated:

```typescript
// OLD (deprecated but still works)
import { getUserPlan, upgradeUserToPro, downgradeUserToFree } from '@/lib/subscription';

const planInfo = await getUserPlan();
await upgradeUserToPro(userId, subscriptionData); // Auto-detects tier
await downgradeUserToFree(userId);

// NEW (recommended)
import { getUserSubscriptionTier, upgradeUserToProTier, downgradeUserToFreeTier } from '@/lib/subscription';

const tierInfo = await getUserSubscriptionTier();
await upgradeUserToProTier(userId, 'PRO_MONTHLY', subscriptionData); // Explicit tier
await downgradeUserToFreeTier(userId);
```

### Gradual Migration Path

No immediate action required. The system handles both old and new approaches:

1. Existing code continues to work with old functions
2. New code can use new functions for explicit tier handling
3. Webhooks automatically upgrade users to correct tier
4. Legacy `plan` field stays in sync with `subscriptionTier`

## Environment Variables

Required for subscription system:

```bash
# LemonSqueezy API credentials
LEMONSQUEEZY_API_KEY="your_api_key"
LEMONSQUEEZY_STORE_ID="your_store_id"
LEMONSQUEEZY_WEBHOOK_SECRET="your_webhook_secret"

# Product variant IDs (get these from LemonSqueezy dashboard)
LEMONSQUEEZY_PRO_MONTHLY_VARIANT_ID="12345"
LEMONSQUEEZY_PRO_YEARLY_VARIANT_ID="67890"

# Optional: Product IDs (for validation)
LEMONSQUEEZY_PRO_MONTHLY_PRODUCT_ID="prod_monthly"
LEMONSQUEEZY_PRO_YEARLY_PRODUCT_ID="prod_yearly"
```

## Best Practices

1. **Always check tier before granting access** to paid features
2. **Use `hasProAccess()`** for simple Pro/Free checks
3. **Use `getUserSubscriptionTier()`** for detailed tier-specific logic
4. **Increment usage counters** after successful operations, not before
5. **Handle rate limit errors gracefully** with helpful upgrade prompts
6. **Cache tier info** in UI state to avoid repeated API calls
7. **Run validation periodically** to catch subscription inconsistencies
8. **Log all subscription changes** for audit trail

## Support Resources

- [LemonSqueezy Documentation](https://docs.lemonsqueezy.com/)
- [Prisma Client API](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
- Project Documentation: `docs/SUBSCRIPTION_TIER_MIGRATION_COMPLETE.md`
