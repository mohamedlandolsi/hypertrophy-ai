# Google OAuth Production Redirect Fix

## Problem
Google OAuth redirects users to `localhost:3000` even in production (`hypertroq.vercel.app`), causing authentication failures in the live environment.

## Root Cause
The issue is **NOT** in the code but in the Supabase dashboard configuration. The code correctly uses dynamic URLs:

```typescript
// ✅ CORRECT: This dynamically resolves to the current domain
redirectTo: `${window.location.origin}/auth/callback`
```

However, Supabase's OAuth provider settings may be configured to only allow specific redirect URLs.

## Solution

### Step 1: Update Supabase Dashboard Settings

1. **Go to Supabase Dashboard**
   - Navigate to your project at https://supabase.com/dashboard
   - Select your HypertroQ project

2. **Update Authentication Settings**
   - Go to **Authentication** → **URL Configuration**
   - Update the following settings:

   **Site URL:**
   ```
   https://hypertroq.vercel.app
   ```

   **Redirect URLs:** (Add both for development and production)
   ```
   http://localhost:3000/auth/callback
   https://hypertroq.vercel.app/auth/callback
   ```

3. **Update OAuth Provider Settings**
   - Go to **Authentication** → **Providers**
   - Click on **Google**
   - Ensure the **Redirect URL** shown matches your Supabase callback URL
   - Copy this URL for the next step

### Step 2: Update Google Cloud Console

1. **Go to Google Cloud Console**
   - Navigate to https://console.cloud.google.com
   - Select your project

2. **Update OAuth Consent Screen**
   - Go to **APIs & Services** → **OAuth consent screen**
   - Update **Authorized domains** to include:
     - `hypertroq.vercel.app`
     - `localhost` (for development)

3. **Update OAuth 2.0 Client IDs**
   - Go to **APIs & Services** → **Credentials**
   - Click on your OAuth 2.0 Client ID
   - Update **Authorized redirect URIs** to include:
     - The Supabase callback URL (from Step 1.3)
     - Example: `https://[your-project-ref].supabase.co/auth/v1/callback`

### Step 3: Verify Environment Variables

Ensure your production environment (Vercel) has the correct Supabase environment variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://[your-project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Step 4: Test the Fix

1. **Deploy to production** (if not already deployed)
2. **Visit** `https://hypertroq.vercel.app/login`
3. **Click "Sign In with Google"**
4. **Verify** that after OAuth completion, you're redirected to `https://hypertroq.vercel.app/auth/callback` and then to the appropriate page

## Code Review

The current implementation is **correct** and does not need changes:

### ✅ Login Form (`src/components/auth/login-form.tsx`)
```typescript
const { error } = await supabase.auth.signInWithOAuth({
  provider: "google",
  options: {
    redirectTo: `${window.location.origin}/auth/callback`, // ✅ Dynamic
  },
});
```

### ✅ Signup Form (`src/components/auth/signup-form.tsx`)
```typescript
const { error } = await supabase.auth.signInWithOAuth({
  provider: "google",
  options: {
    redirectTo: `${window.location.origin}/auth/callback`, // ✅ Dynamic
  },
});
```

### ✅ Auth Callback (`src/app/auth/callback/route.ts`)
```typescript
// Uses dynamic origin from the request
const { searchParams, origin } = new URL(request.url)
return NextResponse.redirect(`${origin}/onboarding`); // ✅ Dynamic
```

## Troubleshooting

If the issue persists after configuration updates:

1. **Clear browser cache** and cookies for both domains
2. **Wait 5-10 minutes** for Supabase/Google settings to propagate
3. **Check Supabase logs** in Authentication → Logs for any error messages
4. **Verify** that the Google OAuth app is published (not in testing mode)

## Expected Behavior After Fix

- **Development**: `http://localhost:3000/login` → Google OAuth → `http://localhost:3000/auth/callback`
- **Production**: `https://hypertroq.vercel.app/login` → Google OAuth → `https://hypertroq.vercel.app/auth/callback`

## Notes

- This is a **configuration issue**, not a code issue
- The dynamic redirect URL implementation is already correct
- Both local development and production environments will work after proper configuration
- No code changes are required
