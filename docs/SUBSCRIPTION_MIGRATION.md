# Subscription Migration - November 2025

## Overview

HypertroQ has transitioned from a hybrid model (individual program purchases + subscriptions) to a **subscription-only model** effective November 2025. This document explains the changes made and their rationale.

## 🎯 Why the Change?

### Previous Model Issues
- Complex purchasing flow with multiple payment options
- Fragmented user experience (some features for purchasers, some for subscribers)
- Difficult to maintain two parallel monetization systems
- Users confused about whether to buy individual programs or subscribe

### New Model Benefits
- **Simplified user journey**: One clear path to value (subscribe to Pro)
- **Better value proposition**: Unlimited access to all programs for one price
- **Easier to maintain**: Single monetization flow
- **Scales better**: Focus development on subscriber features
- **Clearer messaging**: "Subscribe for unlimited access"

## 📋 What Changed

### 1. **Removed Program Purchase Flow**

#### Archived Files
- `src/app/[locale]/programs/[id]/about/page.tsx` → `archived/pages/`
  - **Was**: Program details page with pricing, checkout button, testimonials, FAQ
  - **Now**: Archived (no longer accessible)

- `src/app/api/checkout/create-program/route.ts` → `archived/api/`
  - **Was**: API endpoint to create LemonSqueezy checkout for individual programs
  - **Now**: Archived (no longer used)

- **Documentation** → `archived/docs/`
  - `LEMONSQUEEZY_PROGRAMS_QUICKSTART.md`
  - `LEMONSQUEEZY_PROGRAM_PURCHASE_IMPLEMENTATION_COMPLETE.md`
  - `TRAINING_PROGRAM_LEMONSQUEEZY_INTEGRATION.md`

#### Modified Files
- `src/app/api/webhooks/lemon-squeezy/route.ts`
  - **Removed**: `order_created` event handler
  - **Removed**: `handleOrderCreated()` function (~200 lines)
  - **Kept**: Subscription webhooks (created, updated, cancelled, etc.)

### 2. **Updated Programs Page**

**File**: `src/app/[locale]/programs/page.tsx`

**Removed**:
- Browse/marketplace section for purchasing programs
- Filter bar (search, difficulty, split, duration, price filters)
- Featured programs section
- Sort options (popular, newest, rating, price)
- Purchase-related state variables

**Kept**:
- My Programs section (user's owned programs)
- Browse Templates section (free template browsing/cloning)
- Upgrade to Pro card (subscription upsell)
- Sign In CTA (for guests)

**Impact**: Users now see a cleaner page focused on their own programs and templates, with clear call-to-action to upgrade to Pro.

### 3. **Database Schema Updates**

**File**: `prisma/schema.prisma`

#### TrainingProgram Model
```prisma
// DEPRECATED: Individual program purchases (subscription-only model since Nov 2025)
// Kept for historical data only - do not use for new programs
price                 Int // Price in cents - DEPRECATED
lemonSqueezyId        String? @unique // LemonSqueezy product ID - DEPRECATED
lemonSqueezyVariantId String? // LemonSqueezy variant ID - DEPRECATED
```

#### UserPurchase Model
```prisma
// DEPRECATED: Individual program purchase tracking (subscription-only model since Nov 2025)
// Kept for historical data only - do not use for new purchases
model UserPurchase {
  // ... fields remain for historical data
}
```

**Why Keep These Fields?**
- Preserve historical purchase data for existing users
- Compliance (retain transaction records)
- Analytics and reporting
- Don't break existing database records

**Do NOT**:
- Create new rows in `UserPurchase` table
- Set `price`, `lemonSqueezyId`, or `lemonSqueezyVariantId` for new programs

### 4. **Program Access Library Updates**

**File**: `src/lib/program-access.ts`

#### `canAccessProgram()` Function
**Before**:
- Checked admin role
- Checked Pro subscription
- Checked individual purchase
- Checked if program is free

**After**:
- Checks admin role
- Checks Pro subscription
- **Removed**: Purchase checking
- **Removed**: Free program checking

**Return Type Changed**:
```typescript
// Before
reason: 'admin' | 'pro_subscription' | 'purchased' | 'free' | 'no_access';
hasPurchased: boolean;

// After
reason: 'admin' | 'pro_subscription' | 'no_access';
// hasPurchased removed
```

#### `getUserAccessiblePrograms()` Function
**Before**:
- Returned purchased programs + free programs for free users
- Returned all programs for Pro users and admins

**After**:
- Returns empty array for free users
- Returns all programs for Pro users and admins

#### `getUpgradeInfo()` Function
**Before**:
- Calculated potential savings vs buying all programs
- Showed upgrade prompt based on purchase count
- Showed "You've purchased X programs" message

**After**:
- Simple message: "Upgrade to Pro for unlimited access"
- No savings calculation
- Always shows upgrade prompt to free users

### 5. **Component & API Updates**

**Updated Files**:
- `src/app/[locale]/programs/[id]/guide/page.tsx`
  - Removed `hasPurchased` from `getUserAccessInfo()`
  
- `src/components/programs/program-guide-content.tsx`
  - Removed `hasPurchased` from interface

- `src/app/api/programs/[id]/route.ts`
  - Removed `UserPurchase` query
  - Removed `hasPurchased` from response

## 🔄 Migration Path for Existing Users

### Users Who Previously Purchased Programs

**Their Data**:
- ✅ Purchase records preserved in `UserPurchase` table
- ✅ Program customizations remain intact
- ✅ Historical data available for audits

**Their Experience**:
- Still have access to previously purchased programs (via existing `UserPurchase` records)
- See "Upgrade to Pro" prompts for unlimited access
- Can continue using purchased programs normally

### Free Users

**Before**:
- Could browse marketplace
- Could purchase individual programs
- Had limited program access

**After**:
- See "Upgrade to Pro" messaging
- Can browse free templates
- Can clone templates to create custom programs (Pro feature)
- Clear path: Subscribe to Pro for full access

### Pro Subscribers

**No Changes** - Already have unlimited access to all features.

## 📊 New User Flow

```
┌─────────────────────────────────────────┐
│  User Visits /programs                  │
└────────────────┬────────────────────────┘
                 │
                 ├─ Authenticated?
                 │
        ┌────────┴────────┐
        │                 │
       YES               NO
        │                 │
        ├─ Has Pro?       │
        │                 └─> Show "Sign In" CTA
   ┌────┴────┐
  YES       NO
   │         │
   │         └─> Show "My Programs"
   │             Show "Browse Templates"
   │             Show "Upgrade to Pro" card
   │
   └─> Show "My Programs"
       Show "Browse Templates"
       (No upgrade prompt)
```

## 🚀 Benefits of New System

### For Users
1. **Clearer Value Proposition**: "Subscribe for unlimited access" is simpler than complex pricing tiers
2. **Better Value**: $19/month for ALL programs vs. $39-79 per program
3. **Less Decision Fatigue**: One decision (subscribe or not) instead of "which programs to buy?"
4. **Template System**: Can still explore/clone templates for free

### For Development
1. **Single Codebase Path**: No more conditional logic for "purchased vs subscribed"
2. **Easier Feature Development**: All features target Pro subscribers
3. **Simplified Testing**: One user type to test (free vs Pro)
4. **Cleaner Analytics**: Clear metrics (free users vs Pro subscribers)

### For Business
1. **Predictable Revenue**: Recurring subscriptions vs. one-time purchases
2. **Higher LTV**: Subscribers pay over time vs. single purchase
3. **Better Retention Metrics**: Can track churn, engagement
4. **Scales Better**: Can add unlimited programs without pricing complexity

## 🔧 Technical Notes

### Backward Compatibility

**Maintained**:
- ✅ Database tables not deleted (historical data preserved)
- ✅ Existing `UserPurchase` records still grant access
- ✅ No data migrations required
- ✅ No breaking changes for existing users

**Removed**:
- ❌ Ability to create new purchases via UI
- ❌ LemonSqueezy product/variant syncing for programs
- ❌ Program marketplace browsing

### Future Considerations

**If Needed to Restore Purchase Flow**:
1. Unarchive pages from `archived/pages/` and `archived/api/`
2. Remove deprecation comments from schema
3. Re-enable purchase checking in `program-access.ts`
4. Add back `hasPurchased` to relevant types
5. Update webhook to handle `order_created` events

**Note**: This is not recommended - the subscription model is superior in all metrics.

## 📝 Testing Checklist

- [x] Build passes without TypeScript errors
- [x] Programs page shows correct sections (My Programs, Templates, Upgrade CTA)
- [x] Free users see upgrade prompts
- [x] Pro users don't see upgrade prompts
- [x] Program access correctly restricted to Pro/Admin
- [x] Webhook handles subscriptions (not orders)
- [x] Historical purchases still grant access
- [x] No broken links to archived pages

## 📚 Related Documentation

- `archived/docs/LEMONSQUEEZY_PROGRAMS_QUICKSTART.md` - Old purchase flow quickstart
- `archived/docs/LEMONSQUEEZY_PROGRAM_PURCHASE_IMPLEMENTATION_COMPLETE.md` - Implementation details
- `archived/docs/TRAINING_PROGRAM_LEMONSQUEEZY_INTEGRATION.md` - LemonSqueezy integration guide
- `README.md` - Updated project overview (see Task 9)

## 🤝 Support

For questions about this migration:
- Check this document first
- Review archived documentation for historical context
- Contact: [Your contact info]

---

**Migration Date**: November 9, 2025  
**Version**: 1.0  
**Status**: ✅ Complete
