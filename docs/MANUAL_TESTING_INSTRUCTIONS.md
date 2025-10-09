/**
 * Manual Testing Instructions for Google OAuth to Onboarding Flow
 * 
 * This document provides step-by-step instructions to manually test
 * that Google OAuth users are redirected to the onboarding page.
 */

# Manual Testing Instructions

## Prerequisites
1. Make sure the development server is running: `npm run dev`
2. Visit http://localhost:3000
3. Make sure you're logged out (visit /debug/clear-session if needed)

## Test 1: New Google OAuth User
1. Go to http://localhost:3000
2. You should see "Get Started Free" and "Sign In" buttons
3. Click "Get Started Free" or "Sign In"
4. Choose "Continue with Google"
5. Complete Google OAuth flow
6. **Expected Result**: You should be redirected to http://localhost:3000/onboarding
7. You should see the onboarding wizard with 4 steps

## Test 2: Complete Onboarding
1. From the onboarding page, either:
   - Complete all 4 steps, OR
   - Click "Skip for now"
2. **Expected Result**: You should be redirected to http://localhost:3000/chat

## Test 3: Returning Google User
1. Log out (visit /debug/clear-session)
2. Go to http://localhost:3000
3. Click "Sign In"
4. Choose "Continue with Google" (same Google account)
5. **Expected Result**: You should be redirected directly to http://localhost:3000/chat
   (skipping onboarding since you already completed it)

## Test 4: Home Page Button Behavior
1. When logged out: Home page shows "Get Started Free" + "Sign In"
2. When logged in: Home page shows "Go to Chat"
3. Smooth loading animation during auth check

## What's Implemented

### Database Schema
- Added `hasCompletedOnboarding` boolean field to User model
- Defaults to `false` for all new users

### Auth Callback Logic (/auth/callback/route.ts)
```typescript
// Check if user exists in our database, create if not
const appUser = await prisma.user.upsert({
  where: { id: session.user.id },
  update: {}, // Don't update anything if user exists
  create: {
    id: session.user.id,
    role: 'user',
    hasCompletedOnboarding: false, // NEW USERS START HERE
  },
  select: { hasCompletedOnboarding: true }
});

// If the user hasn't completed onboarding, send them to the wizard
if (!appUser.hasCompletedOnboarding) {
  return NextResponse.redirect(`${origin}/onboarding`); // REDIRECT TO ONBOARDING
}

// Otherwise, send them to the main chat page
return NextResponse.redirect(`${origin}${next}`);
```

### Onboarding Wizard (/onboarding)
- 4-step wizard: Personal Info, Training Info, Goals, Environment
- Users can complete all steps or skip
- Data is saved to ClientMemory table
- After completion/skip, `hasCompletedOnboarding` is set to `true`
- Users are redirected to /chat

### Home Page Updates
- Dynamic button rendering based on auth state
- Logged-out users: "Get Started Free" + "Sign In"
- Logged-in users: "Go to Chat"
- Smooth loading states and animations

## Key Files Modified
- prisma/schema.prisma (added hasCompletedOnboarding field)
- src/app/auth/callback/route.ts (onboarding redirect logic)
- src/app/onboarding/ (complete wizard implementation)
- src/app/page.tsx (dynamic button logic)
- src/app/api/user/role/route.ts (new users start with hasCompletedOnboarding: false)

## Result
✅ **Google OAuth users are now redirected to onboarding page instead of dashboard/chat**
✅ **All sign-up methods (Google OAuth, email/password) redirect to onboarding**
✅ **Existing users skip onboarding and go directly to chat**
✅ **Race conditions between auth callback and user role API are handled**
✅ **Home page shows appropriate buttons based on auth state**
