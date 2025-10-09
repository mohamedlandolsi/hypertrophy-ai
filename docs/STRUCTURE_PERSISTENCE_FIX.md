# Training Structure Persistence Fix

## Issue
When users selected a training structure in the program guide customize tab and configured the schedule days, the selections were not persisting after save. Upon returning to the tab, everything appeared unselected.

## Root Cause
The API endpoint `/api/programs/customize/route.ts` was missing the `workoutPattern` field in:
1. The `CustomizationRequest` TypeScript interface
2. The database save operations (both create and update)

While the frontend component was correctly sending `workoutPattern` in the customization object, the API was silently ignoring it and not saving it to the database.

## Files Modified

### 1. `/src/app/api/programs/customize/route.ts`

**Changes:**
- Added `workoutPattern?: number` to `CustomizationRequest` interface
- Included `workoutPattern: customization.workoutPattern || 1` in the update operation
- Included `workoutPattern: customization.workoutPattern || 1` in the create operation

**Before:**
```typescript
interface CustomizationRequest {
  trainingProgramId: string;
  customization: {
    structureId: string;
    categoryType: 'MINIMALIST' | 'ESSENTIALIST' | 'MAXIMALIST';
    workoutConfiguration: Record<string, string[]>;
    weeklyScheduleMapping?: Record<string, string>;
  };
}

// Update operation
configuration: {
  structureId: customization.structureId,
  workoutConfiguration: customization.workoutConfiguration,
  weeklyScheduleMapping: customization.weeklyScheduleMapping || {},
  customizedAt: new Date().toISOString()
}
```

**After:**
```typescript
interface CustomizationRequest {
  trainingProgramId: string;
  customization: {
    structureId: string;
    categoryType: 'MINIMALIST' | 'ESSENTIALIST' | 'MAXIMALIST';
    workoutConfiguration: Record<string, string[]>;
    weeklyScheduleMapping?: Record<string, string>;
    workoutPattern?: number;  // ✅ Added
  };
}

// Update operation
configuration: {
  structureId: customization.structureId,
  workoutConfiguration: customization.workoutConfiguration,
  weeklyScheduleMapping: customization.weeklyScheduleMapping || {},
  workoutPattern: customization.workoutPattern || 1,  // ✅ Added
  customizedAt: new Date().toISOString()
}
```

## Data Flow

### Frontend → API → Database

1. **Frontend Component** (`program-customizer.tsx`):
   - User selects structure and configures schedule
   - State includes: `{ structureId, workoutPattern, weeklyScheduleMapping, ... }`
   - Calls API: `POST /api/programs/customize` with full customization object

2. **API Endpoint** (`/api/programs/customize/route.ts`):
   - ✅ Now accepts `workoutPattern` in request body
   - ✅ Validates and saves to database in `configuration` JSON field
   - Returns saved `userProgram` object

3. **Database** (Prisma - UserProgram model):
   - Stores in `configuration` JSON field: `{ structureId, workoutPattern, weeklyScheduleMapping, ... }`
   - Data persists across sessions

4. **Page Load** (`/programs/[id]/guide/page.tsx`):
   - Fetches `userCustomization` from database
   - Passes to `ProgramCustomizer` component
   - Component initializes state from `userCustomization?.configuration?.workoutPattern`

## Testing Checklist

- [x] Build successful (`npm run build`)
- [x] No TypeScript errors
- [ ] User can select structure and see it persist after save
- [ ] User can configure schedule days and see them persist
- [ ] Workout pattern selection persists
- [ ] Data loads correctly on page refresh
- [ ] Auto-save works when changing structure

## Related Files

- `src/components/programs/program-customizer.tsx` - Frontend component (already working)
- `src/app/[locale]/programs/[id]/guide/page.tsx` - Page that loads customization
- `src/app/api/programs/customize/route.ts` - API endpoint (fixed)
- `prisma/schema.prisma` - UserProgram model with configuration JSON field

## Notes

- The `workoutPattern` field defaults to `1` if not provided
- Pattern values: 1 = Same workout, 2 = A/B alternating, 3 = A/B/C rotation
- The fix also ensures `weeklyScheduleMapping` continues to work correctly
- The API auto-saves structure changes with a 500ms debounce
