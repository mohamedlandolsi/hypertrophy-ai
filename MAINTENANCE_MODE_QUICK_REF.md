# 🚧 Maintenance Mode - Quick Reference

## Enable Maintenance Mode (Show "Under Construction")

### In Vercel Dashboard:

1. **Get Your IP**: Visit https://whatismyipaddress.com
2. **Add Environment Variables**:
   ```
   NEXT_PUBLIC_MAINTENANCE_MODE = true
   NEXT_PUBLIC_ALLOWED_IPS = YOUR_IP_ADDRESS
   ```
3. **Redeploy** your application

✅ **Result**: All users see maintenance page, except you!

---

## Disable Maintenance Mode (Go Live)

### In Vercel Dashboard:

1. **Update Environment Variable**:
   ```
   NEXT_PUBLIC_MAINTENANCE_MODE = false
   ```
   (or delete it entirely)
2. **Redeploy** your application

✅ **Result**: Site is live for everyone!

---

## Testing Locally

### In `.env.local`:
```bash
NEXT_PUBLIC_MAINTENANCE_MODE=true
NEXT_PUBLIC_ALLOWED_IPS=127.0.0.1
```

Run: `npm run dev`

---

## Multiple IPs (Team Access)

```
NEXT_PUBLIC_ALLOWED_IPS = 123.456.789.012,98.765.43.210,45.67.89.123
```
(comma-separated, no spaces)

---

## Emergency: Locked Out?

1. Go to Vercel Dashboard (from any device)
2. Update `NEXT_PUBLIC_ALLOWED_IPS` with current IP
3. Redeploy

---

## Files Modified

- ✅ `src/middleware.ts` - IP whitelisting logic
- ✅ `src/app/maintenance/page.tsx` - Beautiful maintenance page
- ✅ `docs/MAINTENANCE_MODE_SETUP.md` - Full documentation

---

## What Users See

### ❌ Non-Whitelisted IP:
→ Redirected to beautiful "Under Construction" page
→ Shows features preview, status, contact info

### ✅ Whitelisted IP (You):
→ Full site access
→ All features available
→ No restrictions

---

## Pro Tips

💡 **Static IP**: Use VPN for consistent IP address
💡 **Multiple Locations**: Add all your IPs to whitelist
💡 **Team Access**: Add team member IPs separated by commas
💡 **Test First**: Enable on Preview deployment before Production

---

**Need Help?** See full docs: `docs/MAINTENANCE_MODE_SETUP.md`
