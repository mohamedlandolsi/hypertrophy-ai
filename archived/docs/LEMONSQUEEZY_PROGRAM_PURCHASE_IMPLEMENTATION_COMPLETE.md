# LemonSqueezy Program Purchase Integration - Complete Implementation

**Date:** January 2025
**Status:** ✅ Complete - Build Successful

## Overview

Successfully implemented full LemonSqueezy integration for training program purchases, allowing admins to configure programs for sale and users to purchase them with one-time payments.

---

## Changes Summary

### 1. Database Schema Updates

**File:** `prisma/schema.prisma`

Added `lemonSqueezyVariantId` field to `TrainingProgram` model:

```prisma
model TrainingProgram {
  id                    String  @id @default(cuid())
  name                  Json
  description           Json
  price                 Int // Price in cents
  lemonSqueezyId        String? @unique // LemonSqueezy product ID
  lemonSqueezyVariantId String? // LemonSqueezy variant ID ✨ NEW
  isActive              Boolean @default(true)
  // ... other fields
}
```

**Migration:** Applied with `npx prisma db push` (development)

---

### 2. Validation Schema

**File:** `src/lib/validations/program-creation.ts`

Added `lemonSqueezyVariantId` to validation:

```typescript
export const programCreationSchema = z.object({
  // ... other fields
  lemonSqueezyId: z.string().min(1, 'LemonSqueezy ID is required').optional(),
  lemonSqueezyVariantId: z.string().min(1, 'LemonSqueezy Variant ID is required').optional(),
  // ... other fields
});
```

---

### 3. Admin Forms - Create Program

**File:** `src/components/admin/program-creation/basic-info-form.tsx`

**Added:**
- State management for LemonSqueezy IDs:
  ```typescript
  const [lemonSqueezyId, setLemonSqueezyId] = useState<string>('');
  const [lemonSqueezyVariantId, setLemonSqueezyVariantId] = useState<string>('');
  ```

- Form fields after price section:
  ```tsx
  <div className="space-y-4">
    <Label className="text-base font-semibold">LemonSqueezy Integration (Optional)</Label>
    
    <div>
      <Label htmlFor="lemonSqueezyId">LemonSqueezy Product ID</Label>
      <Input 
        id="lemonSqueezyId"
        placeholder="e.g., 123456"
        value={lemonSqueezyId}
        onChange={(e) => {
          setLemonSqueezyId(e.target.value);
          setValue('lemonSqueezyId', e.target.value || undefined);
        }}
      />
    </div>

    <div>
      <Label htmlFor="lemonSqueezyVariantId">LemonSqueezy Variant ID</Label>
      <Input 
        id="lemonSqueezyVariantId"
        placeholder="e.g., 789012"
        value={lemonSqueezyVariantId}
        onChange={(e) => {
          setLemonSqueezyVariantId(e.target.value);
          setValue('lemonSqueezyVariantId', e.target.value || undefined);
        }}
      />
    </div>
  </div>
  ```

- Effect hooks to sync form values with state

---

### 4. Admin Forms - Default Values

**File:** `src/app/[locale]/admin/programs/new/page.tsx`

Added to form default values:

```typescript
const methods = useForm({
  defaultValues: {
    // ... other defaults
    price: 0,
    lemonSqueezyId: undefined,
    lemonSqueezyVariantId: undefined,
    // ... other defaults
  }
});
```

---

### 5. Admin Forms - Edit Program

**File:** `src/app/[locale]/admin/programs/[id]/edit/page.tsx`

**Updated:**
1. Type definitions to include `lemonSqueezyVariantId`
2. Default values initialization
3. Form reset with fetched data
4. API submission payload

```typescript
// Type
type EditProgramFormData = {
  // ... other fields
  lemonSqueezyId?: string;
  lemonSqueezyVariantId?: string;
  // ... other fields
};

// Reset with fetched data
reset({
  // ... other fields
  lemonSqueezyId: programData.lemonSqueezyId || '',
  lemonSqueezyVariantId: programData.lemonSqueezyVariantId || '',
  // ... other fields
});
```

---

### 6. Program About Page - Buy Button

**File:** `src/app/[locale]/programs/[id]/about/page.tsx`

**Major Updates:**

1. **Interface Update:**
   ```typescript
   interface TrainingProgram {
     // ... existing fields
     lemonSqueezyId?: string;
     lemonSqueezyVariantId?: string;
     hasPurchased?: boolean;
   }
   ```

2. **State Management:**
   ```typescript
   const [isPurchasing, setIsPurchasing] = useState(false);
   const [error, setError] = useState<string | null>(null);
   ```

3. **Purchase Handler:**
   ```typescript
   const handlePurchase = async () => {
     // Check authentication
     if (!isAuthenticated) {
       router.push('/auth/login');
       return;
     }
     
     // Handle free programs
     if (program.price === 0) {
       router.push(`/programs/${programId}/guide`);
       return;
     }
     
     // Check if already purchased
     if (program.hasPurchased) {
       router.push(`/programs/${programId}/guide`);
       return;
     }
     
     // Validate LemonSqueezy configuration
     if (!program.lemonSqueezyId || !program.lemonSqueezyVariantId) {
       setError('This program is not available for purchase');
       return;
     }
     
     // Call checkout API
     try {
       setIsPurchasing(true);
       const response = await fetch('/api/checkout/create-program', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ programId: program.id }),
       });
       
       const data = await response.json();
       if (data.checkoutUrl) {
         window.location.href = data.checkoutUrl;
       }
     } catch (error) {
       setError(error.message);
     } finally {
       setIsPurchasing(false);
     }
   };
   ```

4. **UI Updates:**
   - Dynamic button text based on purchase status
   - Loading state with spinner
   - Error message display
   - FREE badge for zero-price programs
   - Conditional pricing display

---

### 7. API Endpoint - Program Details

**File:** `src/app/api/programs/[id]/route.ts`

**Enhanced to return:**
- `lemonSqueezyId`
- `lemonSqueezyVariantId`
- `hasPurchased` status (checks UserPurchase table)

```typescript
// Select LemonSqueezy fields
const program = await prisma.trainingProgram.findUnique({
  where: { id: programId, isActive: true },
  select: {
    // ... existing fields
    lemonSqueezyId: true,
    lemonSqueezyVariantId: true,
    // ... existing fields
  },
});

// Check purchase status
let hasPurchased = false;
if (user) {
  const userPurchase = await prisma.userPurchase.findUnique({
    where: {
      userId_trainingProgramId: {
        userId: user.id,
        trainingProgramId: program.id,
      },
    },
  });
  hasPurchased = !!userPurchase;
}

const responseData = {
  ...program,
  isOwned,
  hasPurchased,
};
```

---

### 8. Webhook Handler

**File:** `src/app/api/webhooks/lemon-squeezy/route.ts`

**Status:** ✅ Already Implemented

The webhook handler was already complete with:
- `order_created` event handling
- Product ID lookup in TrainingProgram table
- User validation via `custom_data.user_id`
- Price validation
- UserPurchase record creation
- Audit trail logging

**Key Logic:**
```typescript
case 'order_created':
  await handleOrderCreated(data, meta);
  break;

// Handler validates:
// 1. Order is paid
// 2. Product exists in TrainingProgram table
// 3. User ID from custom_data
// 4. Price matches program price
// 5. Creates UserPurchase record
// 6. Logs audit trail
```

---

## Backend Infrastructure (Pre-existing)

The following were already implemented from previous work:

### 1. LemonSqueezy Service
**File:** `src/lib/lemonsqueezy.ts`

Method `createProgramCheckoutUrl()` creates checkout sessions with:
- Product ID and Variant ID
- Custom data (user_id, program_id, purchase_type)
- Success/Cancel URLs
- One-time purchase configuration

### 2. Checkout API Endpoint
**File:** `src/app/api/checkout/create-program/route.ts`

Handles:
- User authentication
- Existing purchase check
- Program validation
- Checkout URL generation
- Error handling

---

## Testing Checklist

### Admin Flow
- ✅ Create new program with LemonSqueezy IDs
- ✅ Edit existing program LemonSqueezy IDs
- ✅ Price conversion (USD → TND)
- ✅ Form validation
- ✅ Build successful

### User Flow (Ready for Testing)
- ⏳ Visit program about page
- ⏳ See price and buy button
- ⏳ Click buy button (authenticated user)
- ⏳ Redirect to LemonSqueezy checkout
- ⏳ Complete purchase
- ⏳ Webhook processes order
- ⏳ UserPurchase record created
- ⏳ Button changes to "View Program"
- ⏳ Access guide page

### Edge Cases
- ⏳ Free programs (price = 0) - direct access
- ⏳ Already purchased - direct access
- ⏳ Unauthenticated - redirect to login
- ⏳ Missing LemonSqueezy IDs - error message
- ⏳ Invalid product - webhook validation fails

---

## Configuration Required

### LemonSqueezy Dashboard

1. **Create Product:**
   - Go to Products → New Product
   - Set name and description
   - Copy Product ID (e.g., `123456`)

2. **Create Variant:**
   - Under the product, create a variant
   - Set price
   - Copy Variant ID (e.g., `789012`)

3. **Configure Webhook:**
   - URL: `https://yourdomain.com/api/webhooks/lemon-squeezy`
   - Events: `order_created`, `subscription_*`
   - Secret: Set in `.env` as `LEMONSQUEEZY_WEBHOOK_SECRET`

### Admin Panel

1. Navigate to `/admin/programs/new` or edit existing program
2. Fill in basic info (name, description, price)
3. Enter LemonSqueezy Product ID
4. Enter LemonSqueezy Variant ID
5. Save program

---

## Environment Variables

Required for LemonSqueezy integration:

```env
LEMONSQUEEZY_API_KEY=your_api_key
LEMONSQUEEZY_STORE_ID=your_store_id
LEMONSQUEEZY_WEBHOOK_SECRET=your_webhook_secret
```

---

## Database Schema

### TrainingProgram
```prisma
model TrainingProgram {
  id                    String  @id @default(cuid())
  lemonSqueezyId        String? @unique
  lemonSqueezyVariantId String?
  price                 Int     // Cents
  // ... other fields
  
  userPurchases UserPurchase[]
}
```

### UserPurchase
```prisma
model UserPurchase {
  userId             String
  trainingProgramId  String
  purchaseDate       DateTime @default(now())
  
  user    User             @relation(...)
  program TrainingProgram  @relation(...)
  
  @@id([userId, trainingProgramId])
}
```

---

## Key Features

### Admin Features
✅ Set price in USD (auto-converts to TND)
✅ Configure LemonSqueezy Product ID
✅ Configure LemonSqueezy Variant ID
✅ Optional - can leave blank for free programs
✅ Edit existing program payment settings

### User Features
✅ View program price on about page
✅ One-click purchase button
✅ Free program direct access
✅ Already purchased - direct access
✅ Purchase validation and error handling
✅ Loading states during checkout creation

### System Features
✅ Secure webhook validation
✅ Duplicate purchase prevention
✅ Price validation
✅ User authentication enforcement
✅ Audit trail logging
✅ Error handling and recovery

---

## File Changes Summary

### Modified Files (9)
1. `prisma/schema.prisma` - Added lemonSqueezyVariantId field
2. `src/lib/validations/program-creation.ts` - Added variant ID validation
3. `src/components/admin/program-creation/basic-info-form.tsx` - Added form fields
4. `src/app/[locale]/admin/programs/new/page.tsx` - Added default values
5. `src/app/[locale]/admin/programs/[id]/edit/page.tsx` - Added variant ID handling
6. `src/app/[locale]/programs/[id]/about/page.tsx` - Complete purchase flow
7. `src/app/api/programs/[id]/route.ts` - Added purchase status
8. No webhook changes needed - already complete
9. Build successful - all TypeScript compiled

### Pre-existing Files (3)
- `src/lib/lemonsqueezy.ts` - createProgramCheckoutUrl method
- `src/app/api/checkout/create-program/route.ts` - Checkout API
- `src/app/api/webhooks/lemon-squeezy/route.ts` - Webhook handler

---

## Build Status

```
✅ Build completed successfully
✅ No TypeScript errors
✅ No compilation warnings (except Supabase realtime dependency)
✅ All routes generated properly
✅ Program about page: 5.55 kB, 163 kB First Load JS
```

---

## Next Steps

1. **Create LemonSqueezy Products:**
   - Set up products in LemonSqueezy dashboard
   - Note down Product IDs and Variant IDs

2. **Configure Webhook:**
   - Add webhook endpoint to LemonSqueezy
   - Test webhook with test purchases

3. **Test Purchase Flow:**
   - Create test program with LemonSqueezy IDs
   - Make test purchase
   - Verify UserPurchase record creation
   - Verify access granted

4. **Production Deployment:**
   - Ensure environment variables set
   - Deploy to production
   - Test live purchase flow

---

## Documentation References

- See `LEMONSQUEEZY_PROGRAMS_QUICKSTART.md` for quick start guide
- See `TRAINING_PROGRAM_LEMONSQUEEZY_INTEGRATION.md` for detailed integration guide

---

## Support & Troubleshooting

### Common Issues

**1. Buy button shows "not available for purchase"**
- Ensure lemonSqueezyId and lemonSqueezyVariantId are set in admin panel
- Check that program price > 0 (unless it should be free)

**2. Webhook not receiving orders**
- Verify webhook URL is correct in LemonSqueezy dashboard
- Check LEMONSQUEEZY_WEBHOOK_SECRET is set
- Review webhook logs: `src/app/api/webhooks/lemon-squeezy/route.ts`

**3. User can't access after purchase**
- Check UserPurchase record exists in database
- Verify userId matches between webhook and user
- Check guide page access logic in `verifyProgramAccess()`

**4. Price mismatch errors**
- Ensure LemonSqueezy variant price matches program.price (in cents)
- TND pricing stored in cents: $29.99 USD ≈ 9,470 cents TND

---

## Conclusion

✅ **Implementation Complete**
✅ **Build Successful**
✅ **Ready for Testing**

The LemonSqueezy training program purchase integration is fully implemented with:
- Admin configuration UI
- User purchase flow
- Webhook processing
- Database persistence
- Access control
- Error handling

All code changes are TypeScript-safe and follow existing project patterns.
