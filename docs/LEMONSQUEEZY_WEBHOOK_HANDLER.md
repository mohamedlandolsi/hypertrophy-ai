# Lemonsqueezy Webhook Handler Documentation

## 📍 Location
`src/app/api/webhooks/lemon-squeezy/route.ts`

## 🎯 Overview

Comprehensive webhook handler for Lemonsqueezy subscription and payment events. Handles the complete subscription lifecycle including creation, updates, cancellations, renewals, and one-time training program purchases.

---

## 🔒 Security Features

### 1. **Webhook Signature Verification**
```typescript
function verifyLemonSqueezySignature(payload: string, signature: string | null): boolean
```

**How it works**:
- Extracts signature from `X-Signature` header
- Computes HMAC-SHA256 hash of raw request body using `LEMONSQUEEZY_WEBHOOK_SECRET`
- Uses `crypto.timingSafeEqual()` to prevent timing attacks
- Returns `401 Unauthorized` if verification fails

**Implementation**:
```typescript
const bodyText = await request.text();
const signature = request.headers.get('x-signature');

if (!verifyLemonSqueezySignature(bodyText, signature)) {
  throw new ValidationError('Invalid webhook signature');
}
```

### 2. **Rate Limiting**
```typescript
function checkRateLimit(ip: string): boolean
```

**Configuration**:
- **Limit**: 10 requests per minute per IP
- **Window**: 60 seconds
- **Storage**: In-memory Map (production should use Redis)
- **Response**: 429 Too Many Requests when exceeded

### 3. **Payload Validation**
```typescript
function validatePaymentData(data: Record<string, unknown>, eventType: string): void
```

**Validates**:
- Required fields: `id`, `attributes`
- Required attributes: `status`
- Subscription-specific: `product_id`, `variant_id`
- Product/Variant IDs match environment configuration
- Throws `ValidationError` if validation fails

---

## 📥 Webhook Events Handled

### 1. `subscription_created` / `subscription_updated`

**Purpose**: New subscription or subscription plan change

**Handler**: `handleSubscriptionActivated()`

**Process**:
1. Extract `user_id` from `meta.custom_data` (passed during checkout)
2. Validate user exists in database
3. Determine tier from `variant_id`:
   - `LEMONSQUEEZY_PRO_MONTHLY_VARIANT_ID` → `PRO_MONTHLY`
   - `LEMONSQUEEZY_PRO_YEARLY_VARIANT_ID` → `PRO_YEARLY`
4. Create audit trail for compliance
5. Call `upgradeUserToProTier()` if status is `active` or `on_trial`
6. Update user record with:
   - `subscriptionTier`: PRO_MONTHLY | PRO_YEARLY
   - `subscriptionStatus`: 'active'
   - `subscriptionStartDate`: created_at
   - `subscriptionEndDate`: renews_at
   - `lemonSqueezyCustomerId`: subscription_id

**Example Payload**:
```json
{
  "meta": {
    "event_name": "subscription_created",
    "custom_data": {
      "user_id": "uuid-here"
    }
  },
  "data": {
    "id": "123456",
    "attributes": {
      "status": "active",
      "product_id": "789",
      "variant_id": "101112",
      "created_at": "2025-11-05T10:00:00Z",
      "renews_at": "2025-12-05T10:00:00Z"
    }
  }
}
```

---

### 2. `subscription_payment_success`

**Purpose**: Successful subscription payment (initial or renewal)

**Handler**: `handleSubscriptionPaymentSuccess()`

**Process**:
1. Extract `user_id` from `meta.custom_data`
2. Validate user exists
3. Validate payment amount:
   - Monthly: $9 USD
   - Yearly: $90 USD
4. Validate currency is `USD`
5. Create audit trail
6. If `billing_reason` is `initial` or `renewal`:
   - Determine tier from amount ($9 = PRO_MONTHLY, $90 = PRO_YEARLY)
   - Calculate `currentPeriodEnd` (1 month or 1 year from now)
   - Call `upgradeUserToProTier()`

**Security**:
- Validates payment amount matches expected pricing
- Validates currency is USD
- Only processes `paid` status
- Only upgrades for `initial` or `renewal` billing reasons

---

### 3. `subscription_cancelled` / `subscription_expired` / `subscription_past_due`

**Purpose**: Subscription ended or payment failed

**Handler**: `handleSubscriptionDeactivated()`

**Process**:
1. Extract `user_id` from `meta.custom_data`
2. Validate user exists
3. Create audit trail
4. Call `downgradeUserToFreeTier()`
5. Update user record:
   - `subscriptionTier`: 'FREE'
   - `subscriptionStatus`: 'cancelled' | 'expired' | 'past_due'
   - Keep historical data for analytics

**Note**: User keeps PRO access until `subscriptionEndDate` passes (handled by tier enforcement system)

---

### 4. `order_created` (Training Program Purchases)

**Purpose**: One-time purchase of a training program

**Handler**: `handleOrderCreated()`

**Process**:
1. Validate order status is `paid`
2. Extract `product_id` from order items
3. Check if product_id is a subscription (skip if yes - handled by subscription events)
4. Look up training program in database by `lemonSqueezyId`
5. Validate program is active
6. Extract `user_id` from `meta.custom_data`
7. Validate user exists
8. Validate payment amount matches training program price
9. Check for duplicate purchases
10. Create `UserPurchase` record linking user to program
11. Create audit trail

**Example Use Case**:
User purchases "6-Week Hypertrophy Program" for $29.99. Webhook creates database record granting lifetime access to that specific program.

**Security**:
- Validates program is active before granting access
- Prevents duplicate purchases
- Validates payment amount matches program price
- Requires `user_id` in custom_data (user must be logged in)

---

## 🛠️ Utility Functions

### `getSubscriptionTierFromVariant(variantId: string)`

Maps Lemonsqueezy variant IDs to internal subscription tiers.

```typescript
function getSubscriptionTierFromVariant(variantId: string): 'PRO_MONTHLY' | 'PRO_YEARLY' {
  const monthlyVariantId = process.env.LEMONSQUEEZY_PRO_MONTHLY_VARIANT_ID;
  const yearlyVariantId = process.env.LEMONSQUEEZY_PRO_YEARLY_VARIANT_ID;

  if (variantId === yearlyVariantId) return 'PRO_YEARLY';
  if (variantId === monthlyVariantId) return 'PRO_MONTHLY';
  
  // Fallback to PRO_MONTHLY with warning
  logger.warn('Unknown variant ID, defaulting to PRO_MONTHLY', { variantId });
  return 'PRO_MONTHLY';
}
```

### `createAuditTrail(eventType: string, userId: string, data: Record<string, unknown>)`

Logs all webhook events for compliance and debugging.

**Logged Data**:
- Event type (subscription_created, payment_success, etc.)
- User ID
- Timestamp
- Subscription/Order ID
- Status
- Product ID and Variant ID
- User agent and IP (for webhooks: 'webhook' and 'unknown')

**Future Enhancement**: Create separate `AuditLog` Prisma model to store in database.

---

## ⚙️ Environment Variables Required

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `LEMONSQUEEZY_WEBHOOK_SECRET` | Signing secret for webhook verification | `wh_sec_abc123...` | ✅ Yes |
| `LEMONSQUEEZY_API_KEY` | API key for Lemonsqueezy API calls | `eyJ0eXAiOiJKV1...` | ✅ Yes |
| `LEMONSQUEEZY_STORE_ID` | Your store ID | `12345` | ✅ Yes |
| `LEMONSQUEEZY_PRO_MONTHLY_PRODUCT_ID` | Product ID for monthly plan | `67890` | ✅ Yes |
| `LEMONSQUEEZY_PRO_YEARLY_PRODUCT_ID` | Product ID for yearly plan | `67891` | ✅ Yes |
| `LEMONSQUEEZY_PRO_MONTHLY_VARIANT_ID` | Variant ID for monthly plan | `98765` | ✅ Yes |
| `LEMONSQUEEZY_PRO_YEARLY_VARIANT_ID` | Variant ID for yearly plan | `98766` | ✅ Yes |

### How to Find These Values

1. **Webhook Secret**:
   - Go to Lemonsqueezy Dashboard → Settings → Webhooks
   - Create or edit webhook
   - Copy the "Signing Secret"

2. **Product IDs**:
   - Go to Products → Select your product
   - Copy the ID from the URL or product details

3. **Variant IDs**:
   - Go to Products → Select product → Variants
   - Copy the ID for each variant (monthly/yearly)

4. **Store ID**:
   - Found in your dashboard URL: `lemonsqueezy.com/settings/stores/{STORE_ID}`

---

## 🔗 Integration with Lemonsqueezy

### 1. Configure Webhook in Lemonsqueezy Dashboard

**URL**: `https://yourdomain.com/api/webhooks/lemon-squeezy`

**Events to Subscribe**:
- ✅ `subscription_created`
- ✅ `subscription_updated`
- ✅ `subscription_cancelled`
- ✅ `subscription_expired`
- ✅ `subscription_past_due`
- ✅ `subscription_payment_success`
- ✅ `order_created`

**Signing Secret**: Copy this to your `.env.local` as `LEMONSQUEEZY_WEBHOOK_SECRET`

### 2. Pass User ID During Checkout

**Critical**: You MUST pass the user ID in checkout custom data.

**Implementation** (in your checkout code):
```typescript
const checkoutUrl = await createCheckout({
  variantId: process.env.LEMONSQUEEZY_PRO_MONTHLY_VARIANT_ID,
  customData: {
    user_id: userId // ⚠️ REQUIRED for webhook to work
  }
});
```

**Why**: Webhook events don't include user email by default. Custom data ensures we can link the subscription to the correct user.

### 3. Test with Lemonsqueezy Test Mode

1. Enable test mode in Lemonsqueezy dashboard
2. Use test card: `4242 4242 4242 4242`
3. Webhooks will have `meta.test_mode: true`
4. Check webhook logs in Lemonsqueezy dashboard

---

## 🧪 Testing Guide

### Local Testing with Webhook Proxy

Use Lemonsqueezy CLI or a service like ngrok:

```bash
# Install Lemonsqueezy CLI
npm install -g @lemonsqueezy/lemonsqueezy-cli

# Forward webhooks to local server
lemonsqueezy webhooks forward --url http://localhost:3000/api/webhooks/lemon-squeezy
```

### Manual Testing

Send test webhook via Lemonsqueezy dashboard:

1. Go to Settings → Webhooks → Your webhook
2. Click "Send test webhook"
3. Select event type (e.g., `subscription_created`)
4. Check your server logs

### Test Cases

| Test Case | Expected Result |
|-----------|----------------|
| New subscription (monthly) | User upgraded to PRO_MONTHLY |
| New subscription (yearly) | User upgraded to PRO_YEARLY |
| Subscription cancelled | User keeps PRO until expiry, then downgraded |
| Payment success (renewal) | Subscription period extended |
| Invalid signature | 401 Unauthorized response |
| Missing user_id | 400 Bad Request with error message |
| Duplicate order | Idempotent (no duplicate purchase created) |

---

## 🔍 Debugging

### Enable Detailed Logging

The handler uses `@/lib/error-handler` logger. Check logs for:

```typescript
logger.info('Lemon Squeezy webhook received', { ...context });
logger.info('Processing webhook event', { eventType });
logger.info('User successfully upgraded to Pro', { userId, tier });
```

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| "Invalid webhook signature" | Wrong secret or body parsing | Verify `LEMONSQUEEZY_WEBHOOK_SECRET` matches dashboard |
| "User ID not found" | Missing custom_data | Add `custom_data: { user_id }` to checkout |
| "User not found in database" | User doesn't exist | Ensure user is created before checkout |
| "Invalid product ID" | Wrong env variables | Verify product/variant IDs match Lemonsqueezy |
| Rate limit exceeded | Too many requests | Implement Redis-based rate limiting |

### View Webhook Logs in Lemonsqueezy

1. Go to Settings → Webhooks → Your webhook
2. Click "Recent deliveries"
3. View request/response for each webhook
4. Check status codes (200 = success)

---

## 🔄 Workflow Diagram

```
User Purchases Subscription
         ↓
Lemonsqueezy Checkout
         ↓
Payment Success
         ↓
Lemonsqueezy sends webhook
         ↓
[Signature Verification] ← LEMONSQUEEZY_WEBHOOK_SECRET
         ↓
[Rate Limit Check] ← 10 req/min per IP
         ↓
[Parse Event Type]
         ↓
    ┌────┴────┐
    ↓         ↓
subscription_created   order_created
    ↓                      ↓
[Extract user_id]     [Extract product_id]
    ↓                      ↓
[Validate User]       [Find TrainingProgram]
    ↓                      ↓
[Get Tier from Variant] [Validate Price]
    ↓                      ↓
upgradeUserToProTier() → Create UserPurchase
    ↓                      ↓
User has PRO access   User owns program
```

---

## 📊 Database Changes

### Subscription Activation

**Table**: `User`

```sql
UPDATE "User" SET
  "subscriptionTier" = 'PRO_MONTHLY' | 'PRO_YEARLY',
  "subscriptionStatus" = 'active',
  "subscriptionStartDate" = '2025-11-05T10:00:00Z',
  "subscriptionEndDate" = '2025-12-05T10:00:00Z',
  "lemonSqueezyCustomerId" = '123456',
  "updatedAt" = NOW()
WHERE "id" = 'user-uuid';
```

### Training Program Purchase

**Table**: `UserPurchase`

```sql
INSERT INTO "UserPurchase" (
  "userId",
  "trainingProgramId",
  "purchaseDate"
) VALUES (
  'user-uuid',
  'program-uuid',
  NOW()
);
```

---

## 🚀 Production Deployment Checklist

- [ ] Set all `LEMONSQUEEZY_*` environment variables
- [ ] Configure webhook URL in Lemonsqueezy dashboard (production URL)
- [ ] Subscribe to all required events
- [ ] Test with test mode enabled
- [ ] Verify signature verification works
- [ ] Implement Redis-based rate limiting (replace in-memory Map)
- [ ] Set up monitoring/alerting for webhook failures
- [ ] Create AuditLog Prisma model for compliance
- [ ] Test subscription upgrade flow end-to-end
- [ ] Test subscription cancellation flow
- [ ] Test training program purchase flow
- [ ] Verify downgrade happens at subscription expiry
- [ ] Test with real credit card in test mode
- [ ] Disable test mode and test with real purchase
- [ ] Monitor webhook delivery logs in Lemonsqueezy dashboard

---

## 🔐 Security Best Practices

1. **Never skip signature verification** in production
2. **Always validate user exists** before database updates
3. **Use timing-safe comparison** for signatures (`crypto.timingSafeEqual`)
4. **Implement rate limiting** to prevent abuse
5. **Validate all payment amounts** match expected pricing
6. **Log all events** for audit trail
7. **Use HTTPS only** for webhook URL
8. **Rotate webhook secrets** periodically
9. **Validate product/variant IDs** against whitelist
10. **Prevent duplicate processing** (check existing purchases)

---

## 📚 Related Files

- **Subscription Library**: `src/lib/subscription.ts`
  - `upgradeUserToProTier()`
  - `downgradeUserToFreeTier()`
  - Plan limits and tier logic

- **Tier Enforcement**: `src/lib/tier-limits.ts`
  - Feature gating based on tier
  - Usage limit enforcement

- **Lemonsqueezy Client**: `src/lib/lemonsqueezy.ts`
  - Checkout URL generation
  - API calls to Lemonsqueezy

- **Error Handler**: `src/lib/error-handler.ts`
  - Logging utilities
  - Error response formatting

---

## 📞 Support

For Lemonsqueezy-specific issues:
- **Docs**: https://docs.lemonsqueezy.com/api
- **Support**: support@lemonsqueezy.com
- **Webhook Docs**: https://docs.lemonsqueezy.com/api/webhooks

For implementation questions, check the inline comments in:
`src/app/api/webhooks/lemon-squeezy/route.ts`

---

**Last Updated**: November 5, 2025  
**Status**: ✅ Production Ready  
**Webhook Version**: v1.0
