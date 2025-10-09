# Training Program LemonSqueezy Integration Guide

## Overview
Each training program should be linked to a separate LemonSqueezy product for one-time purchases.

## Architecture

### Current Setup
- **Subscription Products**: Pro Monthly & Pro Yearly (for AI chat access)
- **Training Programs**: Individual products (one-time purchase)

### Database Schema
```prisma
model TrainingProgram {
  lemonSqueezyId String? @unique  // Store LemonSqueezy product ID here
  price          Int              // Price in cents
  // ... other fields
}
```

## Implementation Guide

### Step 1: Create Products in LemonSqueezy Dashboard

For each training program:

1. **Navigate**: LemonSqueezy Dashboard → Products → New Product
2. **Product Settings**:
   - **Name**: "Upper/Lower Split Program" (match your program name)
   - **Type**: Single payment (one-time)
   - **Price**: $49.00 (or your price)
   - **Description**: Copy from your program description
   
3. **Variant Settings**:
   - LemonSqueezy auto-creates a default variant
   - Note the **Product ID** (e.g., `123456`)
   - Note the **Variant ID** (e.g., `456789`)

4. **Webhook Configuration** (important!):
   - Add your webhook URL: `https://yourdomain.com/api/webhooks/lemon-squeezy`
   - Enable events: `order_created`, `order_refunded`

### Step 2: Update Admin Program Creation Form

Add LemonSqueezy ID field to your program creation/edit forms:

**Location**: `src/app/[locale]/admin/programs/new/page.tsx`

```tsx
// Add to form state
const [lemonSqueezyProductId, setLemonSqueezyProductId] = useState('');
const [lemonSqueezyVariantId, setLemonSqueezyVariantId] = useState('');

// Add to form UI
<div className="space-y-2">
  <Label htmlFor="lemonSqueezyProductId">
    LemonSqueezy Product ID
    <span className="text-sm text-gray-500 ml-2">(Optional - for paid programs)</span>
  </Label>
  <Input
    id="lemonSqueezyProductId"
    value={lemonSqueezyProductId}
    onChange={(e) => setLemonSqueezyProductId(e.target.value)}
    placeholder="e.g., 123456"
  />
  <p className="text-xs text-gray-500">
    Get this from LemonSqueezy Dashboard → Products → Your Product
  </p>
</div>

<div className="space-y-2">
  <Label htmlFor="lemonSqueezyVariantId">
    LemonSqueezy Variant ID
  </Label>
  <Input
    id="lemonSqueezyVariantId"
    value={lemonSqueezyVariantId}
    onChange={(e) => setLemonSqueezyVariantId(e.target.value)}
    placeholder="e.g., 456789"
  />
</div>
```

### Step 3: Update API to Store LemonSqueezy IDs

**Location**: `src/app/api/admin/programs/actions.ts`

```typescript
// When creating program
const program = await prisma.trainingProgram.create({
  data: {
    // ... existing fields
    lemonSqueezyId: data.lemonSqueezyProductId || null,
    price: data.price * 100, // Convert to cents
  }
});
```

### Step 4: Create Checkout Flow

**Location**: `src/lib/lemonsqueezy.ts`

```typescript
// Add method to create checkout for training programs
async createProgramCheckoutUrl(
  programId: string,
  variantId: string,
  userId: string,
  userEmail: string
): Promise<string> {
  const checkoutData = {
    data: {
      type: 'checkouts',
      attributes: {
        checkout_data: {
          email: userEmail,
          custom: {
            user_id: userId,
            program_id: programId, // Important for webhook
          },
        },
        product_options: {
          enabled_variants: [variantId],
          redirect_url: `${process.env.NEXT_PUBLIC_SITE_URL}/programs/${programId}/guide`,
        },
      },
      relationships: {
        store: { data: { type: 'stores', id: this.storeId } },
        variant: { data: { type: 'variants', id: variantId } },
      },
    },
  };

  const result = await this.makeRequest('/checkouts', {
    method: 'POST',
    body: JSON.stringify(checkoutData),
  });

  return result.data.attributes.url;
}
```

### Step 5: Update Webhook Handler

**Location**: `src/app/api/webhooks/lemon-squeezy/route.ts`

Add handling for program purchases:

```typescript
if (eventName === 'order_created') {
  const customData = attributes.first_order_item?.product_id;
  const userId = attributes.custom_data?.user_id;
  const programId = attributes.custom_data?.program_id;

  if (programId && userId) {
    // This is a program purchase
    await prisma.userPurchase.create({
      data: {
        userId,
        trainingProgramId: programId,
        // ... other fields
      },
    });
  }
}
```

### Step 6: Add "Buy Now" Button to Programs

**Location**: `src/app/[locale]/programs/[id]/page.tsx`

```tsx
<Button
  onClick={async () => {
    const response = await fetch('/api/checkout/create-program', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        programId: program.id,
        variantId: program.lemonSqueezyVariantId,
      }),
    });
    
    const { checkoutUrl } = await response.json();
    window.location.href = checkoutUrl;
  }}
>
  Buy Program - ${program.price / 100}
</Button>
```

## Pricing Strategy

### Recommended Approach:

1. **Free Programs**: Set `price: 0` and `lemonSqueezyId: null`
   - Users can access immediately
   - No purchase required

2. **Paid Programs**: Set `price: 4900` (for $49) and add LemonSqueezy ID
   - One-time purchase
   - Lifetime access after purchase

3. **Pro Subscription**: Keep existing monthly/yearly subscriptions
   - Gives access to AI chat features
   - Does NOT include training programs (unless you want to bundle)

## Alternative: Bundle Strategy (Optional)

If you want Pro subscribers to get programs for free:

```typescript
// Check access in program page
const hasAccess = 
  userPlan === 'pro' || // Pro subscribers get free access
  userHasPurchased(programId); // Or one-time purchase
```

## Testing Checklist

- [ ] Create test product in LemonSqueezy test mode
- [ ] Store product ID in training program
- [ ] Generate checkout URL
- [ ] Complete test purchase
- [ ] Verify webhook receives order
- [ ] Verify UserPurchase record created
- [ ] Verify user can access program guide

## Environment Variables

Add to `.env.local`:

```env
# Existing
LEMONSQUEEZY_API_KEY=your_api_key
LEMONSQUEEZY_STORE_ID=your_store_id
LEMONSQUEEZY_WEBHOOK_SECRET=your_webhook_secret

# No new variables needed - use product IDs in database
```

## Benefits of This Approach

1. ✅ Flexible pricing per program
2. ✅ Easy to add/remove programs
3. ✅ Clear separation: subscriptions vs. programs
4. ✅ Better analytics in LemonSqueezy
5. ✅ Users can buy specific programs they want
6. ✅ No code changes needed for new programs
