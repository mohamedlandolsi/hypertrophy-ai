# Lemonsqueezy Webhook Setup - Quick Start Guide

## 🚀 5-Minute Setup

### Step 1: Get Your Lemonsqueezy Credentials

1. **Login to Lemonsqueezy Dashboard**: https://app.lemonsqueezy.com
2. **Get Store ID**:
   - Click on your store name
   - Copy the ID from URL: `lemonsqueezy.com/settings/stores/{STORE_ID}`
3. **Get API Key**:
   - Go to Settings → API
   - Create new API key
   - Copy the key (starts with `eyJ0eXAiOiJKV1...`)

### Step 2: Create Products & Variants

1. **Create Monthly Subscription**:
   - Go to Products → New Product
   - Name: "HypertroQ Pro - Monthly"
   - Price: $9/month
   - Type: Subscription
   - Copy Product ID and Variant ID

2. **Create Yearly Subscription**:
   - Go to Products → New Product
   - Name: "HypertroQ Pro - Yearly"
   - Price: $90/year
   - Type: Subscription
   - Copy Product ID and Variant ID

### Step 3: Configure Webhook

1. **Go to Settings → Webhooks**
2. **Click "Create Webhook"**
3. **Configure**:
   ```
   URL: https://yourdomain.com/api/webhooks/lemon-squeezy
   
   Events (check these):
   ✅ subscription_created
   ✅ subscription_updated
   ✅ subscription_cancelled
   ✅ subscription_expired
   ✅ subscription_past_due
   ✅ subscription_payment_success
   ✅ order_created
   ```
4. **Copy the Signing Secret** (you'll need this for `.env.local`)

### Step 4: Update `.env.local`

Add these variables to your `.env.local` file:

```bash
# Lemonsqueezy API
LEMONSQUEEZY_API_KEY="eyJ0eXAiOiJKV1QiLCJhbGc..."
LEMONSQUEEZY_STORE_ID="12345"

# Webhook Secret (from Step 3)
LEMONSQUEEZY_WEBHOOK_SECRET="wh_sec_abc123..."

# Monthly Subscription (from Step 2)
LEMONSQUEEZY_PRO_MONTHLY_PRODUCT_ID="67890"
LEMONSQUEEZY_PRO_MONTHLY_VARIANT_ID="98765"

# Yearly Subscription (from Step 2)
LEMONSQUEEZY_PRO_YEARLY_PRODUCT_ID="67891"
LEMONSQUEEZY_PRO_YEARLY_VARIANT_ID="98766"
```

### Step 5: Test the Webhook

#### Option A: Test Mode (Recommended First)

1. **Enable Test Mode** in Lemonsqueezy dashboard
2. **Use Test Card**: `4242 4242 4242 4242`, any future date, any CVC
3. **Complete a test purchase**
4. **Check webhook logs**:
   - Lemonsqueezy Dashboard → Settings → Webhooks → Recent Deliveries
   - Your server logs (should see "Lemon Squeezy webhook received")

#### Option B: Local Testing with ngrok

If testing locally:

```bash
# Install ngrok
npm install -g ngrok

# Start your Next.js server
npm run dev

# In another terminal, expose local server
ngrok http 3000

# Use the ngrok URL for webhook
# Example: https://abc123.ngrok.io/api/webhooks/lemon-squeezy
```

### Step 6: Verify Webhook Handler

Check that the webhook handler exists at:
```
src/app/api/webhooks/lemon-squeezy/route.ts
```

If it exists, you're done! ✅

If not, the file is already implemented in your codebase. Just verify the path.

---

## ✅ Verification Checklist

- [ ] Lemonsqueezy account created
- [ ] Store ID copied
- [ ] API key generated
- [ ] Monthly subscription product created
- [ ] Yearly subscription product created
- [ ] Product IDs and Variant IDs copied
- [ ] Webhook configured in dashboard
- [ ] Webhook secret copied
- [ ] All environment variables added to `.env.local`
- [ ] Server restarted (to load new env vars)
- [ ] Test purchase completed successfully
- [ ] Webhook delivery shows 200 OK in dashboard
- [ ] User upgraded to PRO in database

---

## 🐛 Troubleshooting

### "Invalid webhook signature"
**Solution**: Double-check `LEMONSQUEEZY_WEBHOOK_SECRET` matches exactly what's in the dashboard

### "User ID not found"
**Solution**: Make sure you're passing `custom_data: { user_id }` in checkout:
```typescript
const checkoutUrl = await createCheckout({
  variantId: process.env.LEMONSQUEEZY_PRO_MONTHLY_VARIANT_ID,
  customData: {
    user_id: userId // ⚠️ Required!
  }
});
```

### Webhook not firing
1. Check webhook is enabled in dashboard
2. Check URL is correct and accessible
3. Check Recent Deliveries in dashboard for error messages
4. Verify your server is running and accessible

### "User not found in database"
**Solution**: Ensure user is registered in your app before purchasing

---

## 📚 Next Steps

1. **Read Full Documentation**: `docs/LEMONSQUEEZY_WEBHOOK_HANDLER.md`
2. **Review Subscription Library**: `src/lib/subscription.ts`
3. **Check Tier Enforcement**: `src/lib/tier-limits.ts`
4. **Test All Events**:
   - Subscription creation
   - Subscription renewal
   - Subscription cancellation
   - Training program purchase

---

## 🆘 Need Help?

- **Lemonsqueezy Docs**: https://docs.lemonsqueezy.com/api/webhooks
- **Full Handler Docs**: `docs/LEMONSQUEEZY_WEBHOOK_HANDLER.md`
- **Lemonsqueezy Support**: support@lemonsqueezy.com

---

**Setup Time**: ~5 minutes  
**Difficulty**: Easy  
**Status**: ✅ Webhook handler already implemented!
