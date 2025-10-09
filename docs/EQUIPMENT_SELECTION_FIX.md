# Equipment Selection Persistence Fix

## Issue
Equipment selection for exercises was not being saved or fetched from the database.

## Root Cause
The API endpoint (`/api/programs/customize`) was missing the `exerciseEquipment` field in:
1. The TypeScript interface `CustomizationRequest`
2. The database save operations (both create and update)

While the frontend was correctly sending the equipment data, the backend wasn't configured to accept and store it.

## Files Changed

### `src/app/api/programs/customize/route.ts`

**1. Updated Interface (lines 8-18):**
Added `exerciseEquipment` field to the CustomizationRequest interface:
```typescript
interface CustomizationRequest {
  trainingProgramId: string;
  customization: {
    structureId: string;
    categoryType: 'MINIMALIST' | 'ESSENTIALIST' | 'MAXIMALIST';
    workoutConfiguration: Record<string, string[]>;
    weeklyScheduleMapping?: Record<string, string>;
    workoutPattern?: number;
    exerciseSets?: Record<string, Record<string, number>>;
    exerciseEquipment?: Record<string, Record<string, string>>; // ✅ ADDED
  };
}
```

**2. Updated Save Logic (Update Operation - lines 138-154):**
Added `exerciseEquipment` to configuration when updating existing customization:
```typescript
userProgram = await prisma.userProgram.update({
  where: { id: existingCustomization.id },
  data: {
    categoryType: customization.categoryType,
    configuration: {
      structureId: customization.structureId,
      workoutConfiguration: customization.workoutConfiguration,
      weeklyScheduleMapping: customization.weeklyScheduleMapping || {},
      workoutPattern: customization.workoutPattern || 1,
      exerciseSets: customization.exerciseSets || {},
      exerciseEquipment: customization.exerciseEquipment || {}, // ✅ ADDED
      customizedAt: new Date().toISOString()
    },
    updatedAt: new Date()
  }
});
```

**3. Updated Save Logic (Create Operation - lines 156-169):**
Added `exerciseEquipment` to configuration when creating new customization:
```typescript
userProgram = await prisma.userProgram.create({
  data: {
    userId: user.id,
    trainingProgramId,
    categoryType: customization.categoryType,
    configuration: {
      structureId: customization.structureId,
      workoutConfiguration: customization.workoutConfiguration,
      weeklyScheduleMapping: customization.weeklyScheduleMapping || {},
      workoutPattern: customization.workoutPattern || 1,
      exerciseSets: customization.exerciseSets || {},
      exerciseEquipment: customization.exerciseEquipment || {}, // ✅ ADDED
      customizedAt: new Date().toISOString()
    }
  }
});
```

## How It Works Now

### Frontend → Backend Flow:
1. User selects equipment for an exercise in `program-customizer.tsx`
2. Equipment choice is stored in `exerciseEquipment` state: `Record<templateId, Record<exerciseId, equipment>>`
3. When user saves workout, frontend calls `/api/programs/customize` with body:
   ```json
   {
     "customization": {
       "exerciseSets": {...},
       "exerciseEquipment": {...}  // ✅ Now accepted by API
     }
   }
   ```
4. API validates request against `CustomizationRequest` interface (now includes exerciseEquipment ✅)
5. API saves both `exerciseSets` AND `exerciseEquipment` to database's `configuration` JSON field

### Backend → Frontend Flow:
1. Frontend calls `/api/programs/customize?programId=xxx` (GET request)
2. API returns entire `userProgram` object including `configuration` field
3. Configuration contains:
   ```json
   {
     "exerciseSets": {...},
     "exerciseEquipment": {...}  // ✅ Now persisted and returned
   }
   ```
4. Frontend initializes state from `userCustomization?.configuration?.exerciseEquipment`
5. UI displays saved equipment selections

## Testing
After these changes:
1. ✅ Equipment selection dropdown appears in UI
2. ✅ User can select equipment for each exercise
3. ✅ Selected equipment is sent to API on save
4. ✅ API accepts and stores equipment in database
5. ✅ API returns stored equipment on load
6. ✅ UI displays previously selected equipment after page refresh

## Database Schema
No schema changes were needed. The `UserProgram.configuration` field is already a JSON field that can store any JSON data, including the new `exerciseEquipment` object.

```prisma
model UserProgram {
  id                String              @id @default(cuid())
  userId            String
  trainingProgramId String
  categoryType      ProgramCategoryType
  configuration     Json  // ✅ Stores exerciseEquipment along with other customization data
  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt
}
```

## Impact
- **No Breaking Changes**: Existing customizations without equipment selections continue to work
- **Backward Compatible**: Empty `exerciseEquipment: {}` is used as default
- **Frontend Unchanged**: All frontend code was already correct and ready for this fix

## Status
✅ **FIXED** - Equipment selections now persist across page refreshes and are loaded correctly from the database.
