# Manual Action Required: Update Environment Variables

## Critical: LemonSqueezy Store ID

The validation detected that `LEMONSQUEEZY_STORE_ID` contains a placeholder value.

### How to Fix:

1. **Get Your Store ID**:
   - Go to https://app.lemonsqueezy.com/settings/stores
   - Find your store ID (it's a number, e.g., "12345")

2. **Update .env.local**:
   - Open `.env.local` in your editor
   - Find the line: `LEMONSQUEEZY_STORE_ID="your-store-id"`
   - Replace with your actual Store ID: `LEMONSQUEEZY_STORE_ID="12345"`

3. **Verify**:
   ```powershell
   # After updating, verify the value is set
   node -e "require('dotenv').config({path:'.env.local'}); console.log('Store ID:', process.env.LEMONSQUEEZY_STORE_ID)"
   ```

## Optional: Verify Other LemonSqueezy Variables

While you're updating, also verify these are set correctly:

- `LEMONSQUEEZY_API_KEY` - Your API key from LemonSqueezy
- `LEMONSQUEEZY_PRO_MONTHLY_VARIANT_ID` - Product variant ID for monthly plan
- `LEMONSQUEEZY_PRO_YEARLY_VARIANT_ID` - Product variant ID for yearly plan
- `LEMONSQUEEZY_WEBHOOK_SECRET` - Webhook signing secret

All these values can be found in your LemonSqueezy dashboard.

## After Updating

Run validation again to confirm:
```powershell
npm run validate:deployment
```

The environment check should now pass! ✓
