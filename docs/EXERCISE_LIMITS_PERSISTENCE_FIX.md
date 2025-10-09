# Exercise Limits Per Muscle Group - Persistence Fix

## Problem
Exercise limits configured per muscle group in the admin UI were not persisting to the database. When returning to edit a program, the limits would reset to default values (2 exercises per muscle).

## Root Cause
The `exercisesPerMuscle` field was missing from multiple places in the complete data flow cycle:

1. **Validation Schemas**: The `workoutTemplateSchema` in `src/lib/validations/program-creation.ts` didn't include the `exercisesPerMuscle` field
2. **Update Schema**: The `UpdateTrainingProgramSchema` in `src/app/api/admin/programs/actions.ts` didn't validate this field
3. **Database Operations**: Both `createTrainingProgram` and `updateTrainingProgram` weren't including the field when creating workout templates
4. **Edit Page Data Transform (Save)**: The `handleSaveAndExit` function in the edit page was filtering out the field when submitting data
5. **Edit Page Data Transform (Load)**: The `loadProgramData` function was NOT including the field when loading data from the API into the form

The complete cycle was broken: even though we fixed saving, the data wasn't being loaded back into the form when the edit page opened.

## Solution

### 1. Updated Validation Schema
**File**: `src/lib/validations/program-creation.ts`

Added `exercisesPerMuscle` to the `workoutTemplateSchema`:

```typescript
const workoutTemplateSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Workout name is required'),
  muscleGroups: z.array(z.string()).default([]),
  exercisesPerMuscle: z.record(z.string(), z.number()).optional(), // ✅ Added
  exercises: z.array(exerciseInTemplateSchema).default([]),
});
```

### 2. Updated UpdateTrainingProgramSchema
**File**: `src/app/api/admin/programs/actions.ts`

Added `exercisesPerMuscle` to the update schema:

```typescript
workoutTemplates: z.array(z.object({
  id: z.string(),
  name: z.string().min(1, 'Workout name is required'),
  muscleGroups: z.array(z.string()).default([]),
  exercisesPerMuscle: z.record(z.string(), z.number()).optional(), // ✅ Added
  exercises: z.array(z.object({
    id: z.string(),
    targetedMuscle: z.enum([...]).optional(),
    selectedExercise: z.string().optional(),
  })).default([]),
})).optional(),
```

### 3. Updated createTrainingProgram Function
**File**: `src/app/api/admin/programs/actions.ts` (lines ~157-172)

Added `exercisesPerMuscle` to the data mapping when creating templates:

```typescript
await tx.workoutTemplate.createMany({
  data: validatedData.workoutTemplates.map((template, index) => ({
    trainingProgramId: trainingProgram.id,
    name: {
      en: template.name,
      ar: template.name,
      fr: template.name,
    },
    order: index + 1,
    requiredMuscleGroups: template.muscleGroups,
    exercisesPerMuscle: template.exercisesPerMuscle || undefined, // ✅ Added
  })),
});
```

### 4. Updated updateTrainingProgram Function
**File**: `src/app/api/admin/programs/actions.ts` (lines ~305-325)

Added `exercisesPerMuscle` to the data when creating templates during update:

```typescript
await tx.workoutTemplate.create({
  data: {
    id: template.id.startsWith('new-') ? undefined : template.id,
    trainingProgramId: validatedData.id,
    name: {
      en: template.name,
      ar: template.name,
      fr: template.name,
      _exerciseData: template.exercises || [],
    },
    order: i + 1,
    requiredMuscleGroups: template.muscleGroups,
    exercisesPerMuscle: template.exercisesPerMuscle || undefined, // ✅ Added
  },
});
```

### 5. Updated Edit Page Data Transformation
**File**: `src/app/[locale]/admin/programs/[id]/edit/page.tsx` (lines ~320-333)

Added `exercisesPerMuscle` to the workoutTemplates mapping in `handleSaveAndExit`:

```typescript
workoutTemplates: data.workoutTemplates.map((template) => ({
  id: template.id,
  name: template.name,
  muscleGroups: template.muscleGroups,
  exercisesPerMuscle: template.exercisesPerMuscle, // ✅ Added
  exercises: (template.exercises || []).map((exercise: unknown) => {
    const ex = exercise as ExerciseData;
    return {
      id: ex.id,
      targetedMuscle: ex.targetedMuscle,
      selectedExercise: ex.selectedExercise
    };
  })
})),
```

### 6. Updated TypeScript Type Definition (EditProgramFormData)
**File**: `src/app/[locale]/admin/programs/[id]/edit/page.tsx` (lines ~54-61)

Added `exercisesPerMuscle` to the `EditProgramFormData` type:

```typescript
workoutTemplates: Array<{
  id: string;
  name: string;
  muscleGroups: string[];
  exercisesPerMuscle?: Record<string, number>; // ✅ Added
  exercises: unknown[];
}>;
```

### 7. Updated Edit Page Data Loading (CRITICAL FIX)
**File**: `src/app/[locale]/admin/programs/[id]/edit/page.tsx` (lines ~203-210)

Added `exercisesPerMuscle` to the workoutTemplates transformation in `loadProgramData`:

```typescript
const transformedWorkoutTemplates = programData.workoutTemplates.map((template, idx) => ({
  id: template.id,
  name: template.name.en || `Workout ${idx + 1}`,
  muscleGroups: template.requiredMuscleGroups,
  exercisesPerMuscle: template.exercisesPerMuscle || {}, // ✅ Added - THIS WAS THE KEY MISSING PIECE!
  exercises: (template.name as Record<string, unknown>)?._exerciseData as unknown[] || [],
}));
```

### 8. Updated TypeScript Type Definition (TrainingProgramData)
**File**: `src/app/[locale]/admin/programs/[id]/edit/page.tsx` (lines ~110-116)

Added `exercisesPerMuscle` to the `TrainingProgramData.workoutTemplates` interface:

```typescript
workoutTemplates: Array<{
  id: string;
  name: Record<string, string>;
  order: number;
  requiredMuscleGroups: string[];
  exercisesPerMuscle?: Record<string, number>; // ✅ Added
}>;
```

## Important Notes

- **Type Handling**: Use `undefined` (not `null`) for optional JSON fields in Prisma operations to avoid type errors
- **Data Format**: The `exercisesPerMuscle` field stores a record like `{"chest": 2, "trapezius_rhomboids": 3}` where keys are muscle group IDs and values are the exercise limits
- **Backward Compatibility**: The field is optional, so existing programs without this data will continue to work with default limits
- **Complete Round-Trip**: The fix ensures data flows correctly in both directions:
  - **Save Path**: UI → Form → Edit Page Transform → API → Validation → Database ✅
  - **Load Path**: Database → API → Edit Page Transform → Form → UI ✅

## Why It Works Now

✅ **UI Layer**: Form correctly updates `exercisesPerMuscle` field  
✅ **Edit Page (Save)**: Includes `exercisesPerMuscle` in submission payload  
✅ **Validation**: Zod validates and preserves the field  
✅ **Database**: Both create and update operations save the field  
✅ **API Response**: Returns the field when fetching program data  
✅ **Edit Page (Load)**: Includes `exercisesPerMuscle` when loading data into form  
✅ **UI Display**: User sees their saved limits on reload!

## Testing Checklist

- [x] Build successful with no errors
- [x] Lint passes with no warnings
- [ ] Create new program with exercise limits → verify limits persist after save/reload
- [ ] Edit existing program → change exercise limits → verify changes persist
- [ ] Verify limits display correctly in user program customizer
- [ ] Test with different muscle groups including "Trapezius & Rhomboids" consolidation

## Related Changes

This fix completes the exercise limits feature that includes:
1. Database schema with `exercisesPerMuscle` JSON field
2. Admin UI for setting limits (1-6 exercises per muscle)
3. User customizer reading admin-defined limits
4. Muscle group consolidation (Trapezius & Rhomboids)
5. **Data persistence** (this fix)

## Files Modified

1. `src/lib/validations/program-creation.ts` - Added field to validation schema
2. `src/app/api/admin/programs/actions.ts` - Added field to update schema and both create/update operations
3. `src/app/[locale]/admin/programs/[id]/edit/page.tsx` - Added field to workoutTemplates mapping and TypeScript type definition

## Build Results

```
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages (58/58)
✓ Collecting build traces
✓ Finalizing page optimization
```

**Status**: ✅ All checks passed
