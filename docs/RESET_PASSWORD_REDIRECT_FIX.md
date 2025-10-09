# Reset Password Email Redirect Fix ✅

## Problem
Reset password links in emails were redirecting to `localhost:3000` instead of the production domain `hypertroq.com`.

## Root Cause
Auth forms were using `window.location.origin` which resolves to localhost during development, and this value was being used even in production builds.

## Solution Implemented

### 1. Created Utility Functions
**File**: `src/lib/utils/site-url.ts`

```typescript
export function getSiteUrl(): string {
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_SITE_URL || 'https://hypertroq.com';
  }
  return process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
}

export function getAuthCallbackUrl(next?: string): string {
  const baseUrl = getSiteUrl();
  const nextParam = next ? `?next=${encodeURIComponent(next)}` : '';
  return `${baseUrl}/auth/callback${nextParam}`;
}
```

### 2. Updated Auth Forms
Fixed redirect URLs in all authentication forms:

**Files Updated**:
- `src/components/auth/reset-password-form.tsx`
- `src/components/auth/signup-form.tsx` 
- `src/components/auth/login-form.tsx`

**Before**:
```typescript
redirectTo: `${window.location.origin}/auth/callback`
```

**After**:
```typescript
redirectTo: getAuthCallbackUrl()
```

## Supabase Dashboard Configuration Required

### 🔧 **Action Required: Update Supabase Settings**

1. **Go to Supabase Dashboard**: https://app.supabase.com
2. **Select your project**
3. **Navigate**: Settings → Authentication → URL Configuration

### 4. **Update Site URL**:
```
Site URL: https://hypertroq.com
```

### 5. **Update Redirect URLs**:
Add these URLs to the "Redirect URLs" list:
```
https://hypertroq.com/auth/callback
https://hypertroq.com/
https://hypertroq.com/login
https://hypertroq.com/signup
https://hypertroq.com/update-password
```

### 6. **Additional Domains** (if using multiple domains):
If you're also using `hypertroq.vercel.app`, add these as well:
```
https://hypertroq.vercel.app/auth/callback
https://hypertroq.vercel.app/
https://hypertroq.vercel.app/login
https://hypertroq.vercel.app/signup
https://hypertroq.vercel.app/update-password
```

### 7. **Environment Variables**
Make sure your production environment has:
```bash
NEXT_PUBLIC_SITE_URL=https://hypertroq.com
```

## What This Fixes

### ✅ **Before Fix**:
- Reset password emails → `http://localhost:3000/auth/callback?next=/update-password`
- User clicks link → Error or wrong domain

### ✅ **After Fix**:
- Reset password emails → `https://hypertroq.com/auth/callback?next=/update-password`
- User clicks link → Proper redirect to production site

## Files Modified
1. `src/lib/utils/site-url.ts` (NEW)
2. `src/components/auth/reset-password-form.tsx`
3. `src/components/auth/signup-form.tsx`
4. `src/components/auth/login-form.tsx`

## Testing
- ✅ Build completes successfully
- ✅ All auth forms now use environment-based URLs
- ✅ Proper fallbacks for both development and production

## Next Steps
1. **Deploy the code changes**
2. **Update Supabase dashboard settings** (as outlined above)
3. **Test password reset flow** in production
4. **Verify all auth redirects work correctly**
