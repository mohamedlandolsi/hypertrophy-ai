# Production Checkout Debugging Guide

## 🔍 Step-by-Step Production Debugging

### 1. Verify Deployment
Make sure all the recent changes have been deployed to production:
- UpgradeButton fixes (useEffect for defaultInterval sync)
- Enhanced logging
- CSP updates

### 2. Test in Production Browser Console

1. Open your production site (e.g., yourdomain.com/pricing)
2. Open browser Developer Tools (F12) → Console tab
3. Follow these steps and capture the console output:

#### Step A: Load Pricing Page
- Go to /pricing
- Look for logs like:
  ```
  UpgradeButton rendered with: { defaultInterval: 'month', showDialog: false }
  ```

#### Step B: Toggle to Yearly
- Click the yearly toggle switch
- Look for logs like:
  ```
  Pricing page: billing interval changing from month to year
  UpgradeButton: defaultInterval changed to: year
  UpgradeButton: selectedInterval updated to: year
  UpgradeButton rendered with: { defaultInterval: 'year', showDialog: false }
  ```

#### Step C: Click Upgrade to Pro
- Click the "Upgrade to Pro" button
- Look for logs like:
  ```
  [PRODUCTION] handleUpgrade called with interval: year
  [PRODUCTION] selectedInterval state: year
  [PRODUCTION] defaultInterval prop: year
  [PRODUCTION] Final interval being used: year
  [PRODUCTION] showDialog: false
  ```

#### Step D: Check Network Tab
- Go to Network tab in DevTools
- Look for the POST request to `/api/checkout/create`
- Check the request payload - it should show:
  ```json
  { "interval": "year", "currency": "USD" }
  ```

### 3. Deployment Checklist

Make sure these files are deployed with the latest changes:

#### `src/components/upgrade-button.tsx`
- ✅ useEffect that syncs defaultInterval with selectedInterval
- ✅ Enhanced logging with [PRODUCTION]/[DEVELOPMENT] tags

#### `src/app/pricing/page.tsx`
- ✅ Enhanced logging for billing interval changes

#### `next.config.ts`
- ✅ Updated CSP that allows LemonSqueezy in production

### 4. If Issues Persist

If you still see the monthly checkout in production after confirming the logs show "year":

#### Option A: Clear Browser Cache
- Hard refresh (Ctrl+F5)
- Clear browser cache for your domain
- Try incognito/private browsing mode

#### Option B: Check LemonSqueezy Dashboard
- Log into your LemonSqueezy dashboard
- Verify that variant ID 896458 is correctly configured as yearly
- Check if there are any checkout URL configuration issues

#### Option C: Test with Direct API Call
Add this to browser console on your production site:
```javascript
// Test direct API call
fetch('/api/checkout/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ interval: 'year', currency: 'USD' })
})
.then(r => r.json())
.then(data => {
  console.log('Direct API test result:', data);
  if (data.checkoutUrl) {
    console.log('Opening checkout URL:', data.checkoutUrl);
    window.open(data.checkoutUrl, '_blank');
  }
});
```

### 5. Expected Results

✅ **Working correctly:** Console shows "year" interval, checkout opens yearly plan
❌ **Still broken:** Console shows "month" interval OR yearly interval but monthly checkout

### 6. Quick Fix for Immediate Testing

If the issue persists, you can temporarily force yearly checkout by modifying the pricing page button to hardcode 'year':

In `src/app/pricing/page.tsx`, temporarily change:
```tsx
defaultInterval={billingInterval}
```
to:
```tsx
defaultInterval="year"
```

This will help confirm if the issue is with the toggle logic or the checkout creation.

## 📝 Send Me This Info

Please test the above and send me:
1. Console logs from steps A, B, C, D
2. Network request payload
3. Whether the direct API test works correctly
4. Current production URL so I can test too if possible

This will help identify exactly where the issue is occurring.
