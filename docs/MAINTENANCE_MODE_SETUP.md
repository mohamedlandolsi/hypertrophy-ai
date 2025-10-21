# Maintenance Mode Setup Guide

## Overview

This guide explains how to enable "under construction" maintenance mode on your HypertroQ production deployment while maintaining access for yourself (the owner).

## How It Works

The maintenance mode system uses:
1. **Environment Variable Toggle**: `NEXT_PUBLIC_MAINTENANCE_MODE` to enable/disable maintenance
2. **IP Whitelisting**: `NEXT_PUBLIC_ALLOWED_IPS` to allow specific IPs to bypass maintenance
3. **Next.js Middleware**: Intercepts all requests and redirects non-whitelisted users to `/maintenance`
4. **Beautiful Maintenance Page**: Custom "under construction" page at `/maintenance`

## Step-by-Step Setup for Vercel

### Step 1: Find Your IP Address

1. Visit [https://whatismyipaddress.com](https://whatismyipaddress.com)
2. Copy your **IPv4 address** (format: xxx.xxx.xxx.xxx)
3. Save this - you'll need it in Step 3

**Important**: If you're on a dynamic IP connection (most home internet), your IP may change. Consider:
- Using a VPN with static IP
- Updating the IP in Vercel when it changes
- Adding multiple IPs if you work from different locations

### Step 2: Access Vercel Environment Variables

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your HypertroQ project
3. Navigate to: **Settings → Environment Variables**

### Step 3: Add Environment Variables

Add these two environment variables:

#### Variable 1: Enable Maintenance Mode
```
Variable Name: NEXT_PUBLIC_MAINTENANCE_MODE
Value: true
Environments: ✓ Production (check only Production)
```

#### Variable 2: Whitelist Your IP
```
Variable Name: NEXT_PUBLIC_ALLOWED_IPS
Value: YOUR_IP_ADDRESS_HERE (e.g., 123.456.789.012)
Environments: ✓ Production (check only Production)
```

**For multiple IPs**, separate with commas (no spaces):
```
Value: 123.456.789.012,98.765.43.210,45.123.67.89
```

### Step 4: Redeploy

After adding the environment variables:
1. Go to **Deployments** tab
2. Click the three dots (**...**) on the latest deployment
3. Select **Redeploy**
4. Or push a new commit to trigger automatic deployment

**Important**: Environment variables only take effect after redeployment!

### Step 5: Verify

1. Visit your production site from **a different device or network** (not your IP)
   - You should see the maintenance page
2. Visit from **your whitelisted IP**
   - You should have full access to the site

## Disabling Maintenance Mode

When ready to launch:

1. Go to Vercel → Settings → Environment Variables
2. Find `NEXT_PUBLIC_MAINTENANCE_MODE`
3. Change value from `true` to `false`
4. Click **Save**
5. Redeploy the application

OR simply delete the `NEXT_PUBLIC_MAINTENANCE_MODE` variable entirely.

## Local Development

For local development, maintenance mode is **disabled by default**.

To test maintenance mode locally:
1. Add to your `.env.local`:
   ```
   NEXT_PUBLIC_MAINTENANCE_MODE=true
   NEXT_PUBLIC_ALLOWED_IPS=127.0.0.1
   ```
2. Restart your dev server: `npm run dev`

## Troubleshooting

### "I'm locked out of my own site!"

**Solution**:
1. Go to Vercel Dashboard → Settings → Environment Variables
2. Update `NEXT_PUBLIC_ALLOWED_IPS` with your current IP address
3. Redeploy
4. If you can't access Vercel dashboard, remove maintenance mode variables from a team member's account

### "My IP keeps changing"

**Solutions**:
- Use a VPN service with static IP
- Add multiple IPs for different locations
- Use Vercel dashboard from a stable connection to update IP
- Consider using a proxy service with static IP

### "Maintenance page is not showing"

**Check**:
1. Environment variables are set in **Production** environment
2. You've redeployed after adding variables
3. Clear browser cache and cookies
4. Check that `NEXT_PUBLIC_MAINTENANCE_MODE=true` (not "TRUE" or "True")

### "Everyone sees the maintenance page, including me"

**Check**:
1. Your IP in `NEXT_PUBLIC_ALLOWED_IPS` matches your actual IP
2. Visit [https://whatismyipaddress.com](https://whatismyipaddress.com) to verify current IP
3. No spaces in the IP list (use commas only)
4. IP format is correct (xxx.xxx.xxx.xxx)

### "Some pages bypass maintenance mode"

The middleware is configured to protect all routes except:
- API routes (`/api/*`)
- Static files (`/_next/static/*`, `/_next/image/*`)
- Public assets (images, favicon, etc.)
- The maintenance page itself (`/maintenance`)

This is intentional to keep the site functional while showing maintenance to users.

## Technical Details

### Files Modified

1. **`src/middleware.ts`**
   - Added maintenance mode check with IP whitelisting
   - Uses `@vercel/functions` for IP detection
   - Redirects non-whitelisted users to `/maintenance`

2. **`src/app/maintenance/page.tsx`**
   - Updated with beautiful "under construction" design
   - Shows features preview and status information

3. **`.env.maintenance.example`**
   - Template with instructions for maintenance mode setup

### How IP Detection Works

The middleware uses Vercel's `@vercel/functions` package to detect the client's IP address:
```typescript
import { ipAddress } from '@vercel/functions';
const clientIP = ipAddress(request);
```

This works reliably on Vercel's Edge Runtime and captures the true client IP even behind proxies.

### Security Considerations

- IP addresses are public environment variables (visible to all team members)
- Don't rely solely on IP whitelisting for sensitive operations
- Maintenance mode is for public-facing pages, not for security
- Consider using VPN or static IP for consistent access

## Advanced Configuration

### Adding Time-Based Maintenance

To schedule maintenance mode, you could:
1. Use Vercel's Cron Jobs to toggle environment variables
2. Implement time-based checks in middleware
3. Use Vercel's Edge Config for instant toggle without redeploy

### Custom Maintenance Page Per Locale

The current maintenance page supports all locales. To customize:
- Edit `src/app/maintenance/page.tsx`
- Add locale detection and different messages
- Use `next-intl` for translations

### Monitoring Access

To log who's accessing during maintenance:
- Add console.log in middleware to track IPs
- Use Vercel Analytics to monitor traffic
- Set up Sentry or similar for access logs

## Support

If you encounter issues not covered here:
1. Check Vercel deployment logs
2. Review browser console for errors
3. Verify environment variables are correctly set
4. Contact support@hypertroq.com

---

**Last Updated**: January 2025
**Maintenance System Version**: 1.0.0
