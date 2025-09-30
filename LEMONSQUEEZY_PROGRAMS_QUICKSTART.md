# 🚀 Quick Start: LemonSqueezy Integration for Training Programs

## ✅ What's Been Implemented

I've set up the infrastructure to link training programs to LemonSqueezy products. Here's what's ready:

### 1. **Database Schema** ✅
Your `TrainingProgram` model already has:
```prisma
lemonSqueezyId String? @unique  // Store product ID here
price          Int              // Price in cents
```

### 2. **API Endpoint** ✅
**New route**: `/api/checkout/create-program`
- Creates checkout URL for program purchases
- Validates user authentication
- Checks for existing purchases
- Returns LemonSqueezy checkout URL

### 3. **LemonSqueezy Service** ✅
Added `createProgramCheckoutUrl()` method:
- Handles one-time purchases
- Passes custom data (user_id, program_id)
- Configures success/cancel URLs

---

## 📋 Step-by-Step Setup Guide

### Step 1: Create Products in LemonSqueezy Dashboard

For **EACH** training program:

1. **Go to**: LemonSqueezy Dashboard → Products → New Product

2. **Product Settings**:
   ```
   Name: Upper/Lower Split Program
   Type: Single payment (one-time purchase)
   Price: $49.00
   Description: [Your program description]
   ```

3. **After creation**, note down:
   - ✏️ **Product ID**: e.g., `123456`
   - ✏️ **Variant ID**: e.g., `456789`

4. **Repeat** for each program you want to sell

### Step 2: Update Your Admin Form

Currently, your admin form needs to include LemonSqueezy fields.

**File to edit**: `src/app/[locale]/admin/programs/new/page.tsx`

Add these form fields:

```tsx
{/* LemonSqueezy Integration */}
<Card>
  <CardHeader>
    <CardTitle>💳 Payment Integration (Optional)</CardTitle>
    <CardDescription>
      Link this program to a LemonSqueezy product for paid access
    </CardDescription>
  </CardHeader>
  <CardContent className="space-y-4">
    <div className="space-y-2">
      <Label htmlFor="lemonSqueezyId">
        LemonSqueezy Product ID
        <Badge variant="secondary" className="ml-2">Optional</Badge>
      </Label>
      <Input
        id="lemonSqueezyId"
        value={lemonSqueezyId}
        onChange={(e) => setLemonSqueezyId(e.target.value)}
        placeholder="e.g., 123456"
      />
      <p className="text-xs text-muted-foreground">
        Get this from LemonSqueezy Dashboard → Products → Your Product
      </p>
    </div>

    <div className="space-y-2">
      <Label htmlFor="lemonSqueezyVariantId">
        LemonSqueezy Variant ID
        <Badge variant="secondary" className="ml-2">Optional</Badge>
      </Label>
      <Input
        id="lemonSqueezyVariantId"
        value={lemonSqueezyVariantId}
        onChange={(e) => setLemonSqueezyVariantId(e.target.value)}
        placeholder="e.g., 456789"
      />
    </div>

    <Alert>
      <Info className="h-4 w-4" />
      <AlertDescription>
        Leave empty for free programs. Add IDs to enable paid purchases.
      </AlertDescription>
    </Alert>
  </CardContent>
</Card>
```

### Step 3: Store the IDs in Database

When saving a program, include the LemonSqueezy ID:

```typescript
const program = await prisma.trainingProgram.create({
  data: {
    // ... existing fields
    lemonSqueezyId: lemonSqueezyProductId || null,
    price: price * 100, // Convert dollars to cents
  }
});
```

### Step 4: Add "Buy Now" Button

**File**: `src/app/[locale]/programs/[id]/page.tsx` or wherever you display programs

```tsx
{/* Check if program is paid and user hasn't purchased */}
{program.price > 0 && program.lemonSqueezyId && !hasPurchased && (
  <Button
    size="lg"
    onClick={async () => {
      try {
        const response = await fetch('/api/checkout/create-program', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            programId: program.id,
            variantId: program.lemonSqueezyVariantId, // You'll need to store this too
          }),
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error);
        }
        
        const { checkoutUrl } = await response.json();
        window.location.href = checkoutUrl;
      } catch (error) {
        console.error('Checkout error:', error);
        toast({
          title: 'Error',
          description: 'Failed to create checkout. Please try again.',
          variant: 'destructive',
        });
      }
    }}
  >
    Buy Program - ${(program.price / 100).toFixed(2)}
  </Button>
)}
```

### Step 5: Update Webhook Handler

**File**: `src/app/api/webhooks/lemon-squeezy/route.ts`

Add handling for program purchases (if not already there):

```typescript
// In your webhook handler
if (eventName === 'order_created') {
  const customData = attributes.custom_data;
  
  if (customData?.purchase_type === 'training_program') {
    // This is a program purchase
    const userId = customData.user_id;
    const programId = customData.program_id;
    
    // Create purchase record
    await prisma.userPurchase.create({
      data: {
        userId,
        trainingProgramId: programId,
      },
    });
    
    console.log(`✅ Program purchase created for user ${userId}`);
  }
}
```

---

## 🎯 Pricing Strategy Recommendations

### Option A: Free + Paid Programs (Recommended)

```typescript
// Free programs
{
  price: 0,
  lemonSqueezyId: null,
  // Users can access immediately
}

// Paid programs
{
  price: 4900, // $49.00
  lemonSqueezyId: '123456',
  // Requires purchase
}
```

### Option B: Pro Subscribers Get Free Access

```typescript
// In your access check
const hasAccess = 
  userPlan === 'pro' || // Pro subscribers get all programs
  userHasPurchased(programId) || // Or specific purchase
  program.price === 0; // Or free program
```

---

## 📊 Database Schema Addition Needed

You should also store the **Variant ID** in your database:

```prisma
model TrainingProgram {
  // ... existing fields
  lemonSqueezyId String? @unique
  lemonSqueezyVariantId String? // Add this
  price Int
}
```

Run migration:
```bash
npx prisma migrate dev --name add-lemonsqueezy-variant-id
```

---

## 🧪 Testing Checklist

- [ ] Create test product in LemonSqueezy (test mode)
- [ ] Create program in admin panel with LemonSqueezy ID
- [ ] View program page and see "Buy Now" button
- [ ] Click button and verify checkout URL opens
- [ ] Complete test purchase
- [ ] Verify webhook receives `order_created` event
- [ ] Verify `UserPurchase` record created
- [ ] Verify user can access program guide
- [ ] Test with existing purchase (button should not show)

---

## 💡 Key Points

1. **Yes, create a separate LemonSqueezy product for each training program**
2. **Store the Product ID and Variant ID** in your database
3. **One-time purchase** (not subscription) for programs
4. **Webhook handles** the purchase confirmation
5. **UserPurchase table** tracks who bought what

---

## 🔧 What You Need to Do Next

1. ✅ **Already Done**: API endpoint `/api/checkout/create-program`
2. ✅ **Already Done**: LemonSqueezy service method
3. ⏳ **TODO**: Add LemonSqueezy fields to admin form
4. ⏳ **TODO**: Create products in LemonSqueezy dashboard
5. ⏳ **TODO**: Add variant ID field to database schema
6. ⏳ **TODO**: Add "Buy Now" button to program pages
7. ⏳ **TODO**: Update webhook to handle program purchases

---

## 📞 Need Help?

Check the detailed guide: `TRAINING_PROGRAM_LEMONSQUEEZY_INTEGRATION.md`

The infrastructure is ready - just follow the steps above! 🚀
