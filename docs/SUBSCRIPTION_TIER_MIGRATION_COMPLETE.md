# Subscription Tier Migration Complete

## Overview

Successfully migrated from a single-tier Pro subscription model to a three-tier subscription system:

- **FREE** (default tier)
- **PRO_MONTHLY** ($9/month)
- **PRO_YEARLY** ($90/year - 10 months pricing with 2 months free)

## Changes Made

### 1. Database Schema (`prisma/schema.prisma`)

Added new `SubscriptionTier` enum:
```prisma
enum SubscriptionTier {
  FREE
  PRO_MONTHLY
  PRO_YEARLY
}
```

Added new fields to `User` model:
```prisma
model User {
  subscriptionTier        SubscriptionTier @default(FREE)
  subscriptionStatus      String           @default("active")
  subscriptionStartDate   DateTime?
  subscriptionEndDate     DateTime?
  lemonSqueezyCustomerId  String?          @unique
  customProgramsCount     Int              @default(0)
  customizationsThisMonth Int              @default(0)
  updatedAt               DateTime         @default(now()) @updatedAt
}
```

**Note:** Legacy `plan` field (UserPlan enum) is kept for backward compatibility and kept in sync with `subscriptionTier`.

### 2. Subscription Library (`src/lib/subscription.ts`)

#### New Functions

- **`getUserSubscriptionTier()`**: Returns user's current subscription tier with all limits and usage info
- **`upgradeUserToProTier(userId, tier, subscriptionData)`**: Upgrade user to specific Pro tier (MONTHLY or YEARLY)
- **`downgradeUserToFreeTier(userId)`**: Downgrade user to FREE tier

#### Updated Subscription Limits

```typescript
export const SUBSCRIPTION_TIER_LIMITS: Record<SubscriptionTier, UserPlanLimits> = {
  FREE: {
    dailyMessages: 10,
    monthlyUploads: 5,
    maxFileSize: 10, // 10MB
    hasConversationMemory: false,
    canAccessProFeatures: false,
    canAccessAdvancedRAG: false,
    maxKnowledgeItems: 10,
    customPrograms: 2,
    customizationsPerMonth: 5,
    canExportPDF: false,
    hasPrioritySupport: false,
  },
  PRO_MONTHLY: {
    dailyMessages: -1, // unlimited
    monthlyUploads: -1, // unlimited
    maxFileSize: 100, // 100MB
    hasConversationMemory: true,
    canAccessProFeatures: true,
    canAccessAdvancedRAG: true,
    maxKnowledgeItems: -1, // unlimited
    customPrograms: -1, // unlimited
    customizationsPerMonth: -1, // unlimited
    canExportPDF: false,
    hasPrioritySupport: false,
  },
  PRO_YEARLY: {
    dailyMessages: -1, // unlimited
    monthlyUploads: -1, // unlimited
    maxFileSize: 100, // 100MB
    hasConversationMemory: true,
    canAccessProFeatures: true,
    canAccessAdvancedRAG: true,
    maxKnowledgeItems: -1, // unlimited
    customPrograms: -1, // unlimited
    customizationsPerMonth: -1, // unlimited
    canExportPDF: true,
    hasPrioritySupport: true,
  },
};
```

#### Legacy Function Support

All old functions remain available for backward compatibility:

- `getUserPlan()` → wraps `getUserSubscriptionTier()`
- `upgradeUserToPro()` → wraps `upgradeUserToProTier()` with automatic tier detection
- `downgradeUserToFree()` → wraps `downgradeUserToFreeTier()`

These functions are marked as `@deprecated` but fully functional.

### 3. Webhook Handler (`src/app/api/webhooks/lemon-squeezy/route.ts`)

#### New Variant-to-Tier Mapping

```typescript
function getSubscriptionTierFromVariant(variantId: string): 'PRO_MONTHLY' | 'PRO_YEARLY' {
  const monthlyVariantId = process.env.LEMONSQUEEZY_PRO_MONTHLY_VARIANT_ID;
  const yearlyVariantId = process.env.LEMONSQUEEZY_PRO_YEARLY_VARIANT_ID;

  if (variantId === yearlyVariantId) {
    return 'PRO_YEARLY';
  } else if (variantId === monthlyVariantId) {
    return 'PRO_MONTHLY';
  }

  // Default to PRO_MONTHLY if variant ID doesn't match
  logger.warn('Unknown variant ID, defaulting to PRO_MONTHLY', { variantId });
  return 'PRO_MONTHLY';
}
```

#### Updated Webhook Event Handlers

All subscription webhook events now:
1. Map variant ID to subscription tier
2. Update both `subscriptionTier` and legacy `plan` fields
3. Set `subscriptionStartDate` and `subscriptionEndDate`
4. Log tier information for debugging

Events handled:
- `subscription_created` / `subscription_updated` → `upgradeUserToProTier()`
- `subscription_payment_success` → `upgradeUserToProTier()` with tier detection from amount
- `subscription_cancelled` / `subscription_expired` / `subscription_past_due` → `downgradeUserToFreeTier()`

### 4. Environment Variables (`.env.example`)

Required environment variables for subscription system:

```bash
# LemonSqueezy Payment Configuration
LEMONSQUEEZY_API_KEY="your-api-key"
LEMONSQUEEZY_STORE_ID="your-store-id"
LEMONSQUEEZY_WEBHOOK_SECRET="your-webhook-secret"

# LemonSqueezy Subscription Product IDs
LEMONSQUEEZY_PRO_MONTHLY_PRODUCT_ID="product-id-for-monthly"
LEMONSQUEEZY_PRO_MONTHLY_VARIANT_ID="variant-id-for-monthly"
LEMONSQUEEZY_PRO_YEARLY_PRODUCT_ID="product-id-for-yearly"
LEMONSQUEEZY_PRO_YEARLY_VARIANT_ID="variant-id-for-yearly"
```

## Migration Path for Existing Users

### Automatic Migration

The system maintains backward compatibility by:

1. **Dual Field Sync**: Both `subscriptionTier` (new) and `plan` (legacy) fields are updated together
2. **Legacy Function Wrappers**: Old functions automatically detect tier and map to new system
3. **Webhook Compatibility**: Webhooks work with both old and new variant structures

### Existing Pro Users

- Existing Pro users keep their `plan = 'PRO'` status
- On next webhook event (renewal/update), they will be assigned to either `PRO_MONTHLY` or `PRO_YEARLY` based on their subscription's variant ID
- Until then, legacy `getUserPlan()` maps `PRO` → `PRO_YEARLY` limits

### Data Validation

Run the validation function periodically:

```typescript
import { validateSubscriptionSecurity } from '@/lib/subscription';

const results = await validateSubscriptionSecurity();
console.log(results);
// {
//   expiredActiveSubscriptions: 0,
//   proUsersWithoutValidSubscriptions: 0,
//   freeUsersWithActiveSubscriptions: 0,
//   actionsPerformed: []
// }
```

This function:
- Finds and downgrades users with expired subscriptions
- Fixes Pro users without valid subscriptions
- Upgrades Free users who have active subscriptions

## Testing Checklist

### Webhook Testing

1. **Test Subscription Created** (Monthly)
   - Create new subscription with monthly variant
   - Verify user upgraded to `PRO_MONTHLY` tier
   - Verify `subscriptionStartDate` and `subscriptionEndDate` set correctly

2. **Test Subscription Created** (Yearly)
   - Create new subscription with yearly variant
   - Verify user upgraded to `PRO_YEARLY` tier
   - Verify PDF export and priority support enabled

3. **Test Subscription Cancelled**
   - Cancel active subscription
   - Verify user downgraded to `FREE` tier
   - Verify `subscriptionStatus` set to 'cancelled'

4. **Test Subscription Renewal** (Payment Success)
   - Simulate renewal payment ($9 for monthly, $90 for yearly)
   - Verify tier detection from amount
   - Verify subscription period extended

### Feature Access Testing

1. **Free Tier Limits**
   - Verify 10 messages/day limit
   - Verify 2 custom programs limit
   - Verify 5 customizations/month limit
   - Verify no PDF export
   - Verify no priority support

2. **Pro Monthly Features**
   - Verify unlimited messages
   - Verify unlimited custom programs
   - Verify unlimited customizations
   - Verify advanced RAG access
   - Verify NO PDF export (Pro Yearly only)

3. **Pro Yearly Features**
   - Verify all Pro Monthly features
   - Verify PDF export enabled
   - Verify priority support flag

### Database Queries for Verification

```sql
-- Check user subscription tier distribution
SELECT "subscriptionTier", COUNT(*) as count
FROM "User"
GROUP BY "subscriptionTier";

-- Check users with mismatched plan and tier
SELECT id, plan, "subscriptionTier", "subscriptionStatus"
FROM "User"
WHERE (plan = 'PRO' AND "subscriptionTier" = 'FREE')
   OR (plan = 'FREE' AND "subscriptionTier" IN ('PRO_MONTHLY', 'PRO_YEARLY'));

-- Check subscriptions needing validation
SELECT u.id, u."subscriptionTier", s.status, s."currentPeriodEnd"
FROM "User" u
LEFT JOIN "Subscription" s ON u.id = s."userId"
WHERE u."subscriptionTier" IN ('PRO_MONTHLY', 'PRO_YEARLY')
  AND (s.id IS NULL OR s.status != 'active' OR s."currentPeriodEnd" < NOW());
```

## Deployment Steps

1. **Deploy Schema Changes**
   ```bash
   npx prisma db push
   ```

2. **Run Seed Script** (for new installs only)
   ```bash
   npm run seed
   ```

3. **Update Environment Variables** in production
   - Set all LemonSqueezy product/variant IDs
   - Verify webhook secret is correct

4. **Update LemonSqueezy Webhook**
   - Ensure webhook URL points to: `https://yourdomain.com/api/webhooks/lemon-squeezy`
   - Ensure all subscription events are enabled:
     - `subscription_created`
     - `subscription_updated`
     - `subscription_payment_success`
     - `subscription_cancelled`
     - `subscription_expired`
     - `subscription_past_due`

5. **Run Validation Script** after deployment
   ```bash
   # Via admin API endpoint
   curl -X POST https://yourdomain.com/api/admin/subscription-security \
     -H "Authorization: Bearer <admin_token>"
   ```

6. **Monitor Logs** for first few hours
   - Watch for webhook processing
   - Verify tier assignments
   - Check for any validation errors

## Breaking Changes

**None.** This is a backward-compatible migration:

- Old `plan` enum still exists and is kept in sync
- Old functions are wrapped with new implementations
- Existing subscriptions work with both old and new systems
- Gradual migration happens automatically via webhooks

## Future Enhancements

Consider implementing:

1. **Redis Caching** for subscription data (reduce database queries)
2. **Subscription Analytics** dashboard for admins
3. **Proration Handling** for tier upgrades/downgrades
4. **Grace Period** for expired subscriptions (e.g., 3-day grace)
5. **Email Notifications** for subscription events
6. **Customer Portal** for users to manage subscriptions

## Support

If issues arise:

1. Check logs: `src/app/api/webhooks/lemon-squeezy/route.ts` logs all events
2. Run validation: `validateSubscriptionSecurity()` to fix data inconsistencies
3. Verify environment variables are set correctly
4. Test webhook with LemonSqueezy's webhook testing tool
5. Check Prisma Studio to inspect database state directly

## Related Files

- Schema: `prisma/schema.prisma`
- Subscription lib: `src/lib/subscription.ts`
- Webhook handler: `src/app/api/webhooks/lemon-squeezy/route.ts`
- Seed script: `prisma/seed.ts`
- Environment: `.env.example`

---

**Migration Status**: ✅ Complete  
**Build Status**: ✅ Passing  
**Backward Compatibility**: ✅ Maintained  
**Deployment Ready**: ✅ Yes
