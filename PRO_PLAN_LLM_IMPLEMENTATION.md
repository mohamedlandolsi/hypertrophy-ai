# Pro Plan LLM Configuration Implementation

## Overview
This implementation adds separate LLM model configuration for Free and Pro tier users in the AI configuration page, allowing administrators to set different models for each user plan.

## Changes Made

### 1. Database Schema Updates
- Added `freeModelName` field to `AIConfiguration` model for Free tier users
- Added `proModelName` field to `AIConfiguration` model for Pro tier users
- Updated Prisma schema and created migration `20250730161152_add_tier_specific_models`

### 2. Admin Settings Page Updates (`src/app/[locale]/admin/settings/page.tsx`)
- Updated `AIConfiguration` interface to include both `freeModelName` and `proModelName`
- Replaced single model selector with two separate selectors:
  - **Free Tier Model**: For users with FREE plan
  - **Pro Tier Model**: For users with PRO plan
- Improved UI layout with clear labels and descriptions for each tier

### 3. API Configuration Updates (`src/app/api/admin/config/route.ts`)
- Updated request body parsing to handle both model fields
- Added validation for both `freeModelName` and `proModelName`
- Updated database operations to save both model configurations

### 4. Gemini Service Updates (`src/lib/gemini.ts`)
- Modified `getAIConfiguration()` function to accept `userPlan` parameter
- Updated model selection logic to return appropriate model based on user plan:
  - FREE plan → uses `freeModelName`
  - PRO plan → uses `proModelName`
- Updated `sendToGeminiWithCitations()` to accept and use user plan parameter

### 5. Chat API Updates (`src/app/api/chat/route.ts`)
- Added user plan fetching for authenticated users
- Updated calls to `sendToGeminiWithCitations()` to pass user plan:
  - Guest users → defaults to FREE plan
  - Authenticated users → uses their actual plan from database

## User Experience

### For Administrators
1. Navigate to Admin Settings page
2. See two separate model selectors:
   - **Free Tier Model**: Configure model for free users
   - **Pro Tier Model**: Configure model for pro users
3. Save configuration applies to both models

### For End Users
- **Free Users**: Automatically use the model configured for free tier
- **Pro Users**: Automatically use the model configured for pro tier
- **Guest Users**: Use the free tier model
- Users don't see any difference in UI - the model selection happens behind the scenes

## Technical Implementation Details

### Model Selection Logic
```typescript
// In getAIConfiguration function
const modelName = userPlan === 'PRO' ? config.proModelName : config.freeModelName;
```

### User Plan Detection
```typescript
// In chat API
const dbUser = await prisma.user.upsert({
  where: { id: user.id },
  update: {},
  create: { id: user.id },
  select: { plan: true }
});
const userPlan = dbUser.plan;
```

## Testing
- Created test script `test-model-selection.js` to verify model selection logic
- Verified database schema changes with migration
- Tested admin interface for both model configurations

## Benefits
1. **Flexibility**: Different models for different user tiers
2. **Cost Control**: Use cheaper models for free users, premium models for paying users
3. **Performance Optimization**: Balance between cost and quality based on user value
4. **Easy Administration**: Simple interface to manage both configurations
5. **Backward Compatibility**: Existing functionality preserved, only enhanced

## Default Configuration
- **Free Tier**: `gemini-2.5-flash` (fast and cost-effective)
- **Pro Tier**: `gemini-2.5-pro` (premium model with enhanced capabilities)

## Future Enhancements
- Could add tier-specific settings for other parameters (temperature, max tokens, etc.)
- Could add usage analytics to compare performance between tiers
- Could add automatic model switching based on usage patterns
