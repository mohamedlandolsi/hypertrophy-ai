# Workout Pattern Multiplication - Complete Implementation

## Overview
Implemented workout pattern multiplication feature that displays workouts based on the selected pattern (1x, 2x, or 3x) with independent exercise selection for each pattern variant.

## Feature Description

### Pattern Types
1. **Pattern 1 - Same Workout Repeated**: Displays workouts normally (e.g., Upper Body, Lower Body)
2. **Pattern 2 - Workout A and B**: Displays 2x workouts with A/B labels (e.g., Upper Body (A), Lower Body (A), Upper Body (B), Lower Body (B))
3. **Pattern 3 - Workout A, B, and C**: Displays 3x workouts with A/B/C labels (e.g., Upper Body (A), Lower Body (A), Upper Body (B), Lower Body (B), Upper Body (C), Lower Body (C))

### Key Functionality
- **Independent Exercise Selection**: Each pattern variant (A, B, C) can have different exercises selected
- **Pattern-Aware IDs**: Uses unique IDs like `upper-body-A`, `upper-body-B`, etc.
- **Visual Differentiation**: Pattern labels displayed as badges next to workout names
- **Database Persistence**: Pattern selection and per-variant exercise configuration saved to database

## Files Modified

### 1. `/src/app/api/programs/customize/route.ts`

**Purpose**: API endpoint for saving program customization

**Changes**:
- Added `workoutPattern?: number` to `CustomizationRequest` interface
- Included `workoutPattern` in both create and update operations
- Defaults to `1` if not provided

```typescript
interface CustomizationRequest {
  trainingProgramId: string;
  customization: {
    structureId: string;
    categoryType: 'MINIMALIST' | 'ESSENTIALIST' | 'MAXIMALIST';
    workoutConfiguration: Record<string, string[]>;
    weeklyScheduleMapping?: Record<string, string>;
    workoutPattern?: number; // ✅ Added
  };
}

// In save operations
configuration: {
  structureId: customization.structureId,
  workoutConfiguration: customization.workoutConfiguration,
  weeklyScheduleMapping: customization.weeklyScheduleMapping || {},
  workoutPattern: customization.workoutPattern || 1, // ✅ Added
  customizedAt: new Date().toISOString()
}
```

### 2. `/src/components/programs/workout-templates.tsx`

**Purpose**: Displays workouts in the "Workouts" tab (read-only view)

**Changes**:
- Added `WorkoutTemplateWithPattern` interface with pattern-aware fields
- Created `getWorkoutsToDisplay()` function to multiply workouts based on pattern
- Updated workout display to use `displayId` for unique identification
- Updated exercise configuration lookups to use `displayId` instead of `template.id`

**Key Interface**:
```typescript
interface WorkoutTemplateWithPattern {
  id: string;
  name: Record<string, string>;
  order: number;
  requiredMuscleGroups: string[];
  patternLabel: string | null; // 'A', 'B', or 'C'
  patternIndex: number; // 0, 1, or 2
  displayId?: string; // e.g., 'upper-body-A'
}
```

**Key Function**:
```typescript
const getWorkoutsToDisplay = (): WorkoutTemplateWithPattern[] => {
  const baseWorkouts = program.workoutTemplates || [];
  
  if (workoutPattern === 1) {
    // Pattern 1: Show workouts as-is
    return baseWorkouts.map(workout => ({
      ...workout,
      patternLabel: null,
      patternIndex: 0
    }));
  } else {
    // Pattern 2 or 3: Multiply workouts
    const expandedWorkouts: WorkoutTemplateWithPattern[] = [];
    const labels = ['A', 'B', 'C'];
    
    for (let patternIndex = 0; patternIndex < workoutPattern; patternIndex++) {
      baseWorkouts.forEach(workout => {
        expandedWorkouts.push({
          ...workout,
          patternLabel: labels[patternIndex],
          patternIndex: patternIndex,
          displayId: `${workout.id}-${labels[patternIndex]}`
        });
      });
    }
    
    return expandedWorkouts;
  }
};
```

### 3. `/src/components/programs/program-customizer.tsx`

**Purpose**: Customize tab where users select exercises for each workout

**Changes**:
- Added `WorkoutTemplateWithPattern` interface (same as workout-templates.tsx)
- Created `getWorkoutTemplatesForPattern()` function to generate pattern-aware workouts
- Updated workout template rendering to display pattern variants
- Added pattern info alert when user is customizing A/B/C variants
- Updated all references from `template.id` to `template.displayId`
- Updated description to show total workout count (e.g., "6 workout variations (2 base × 3 patterns)")

**Key Changes**:
```typescript
// Generate pattern-aware workouts
const workoutTemplatesForDisplay = getWorkoutTemplatesForPattern();

// Display pattern info
{template.patternLabel && (
  <Alert>
    <Info className="h-4 w-4" />
    <AlertDescription>
      This is <strong>{displayName}</strong>. 
      Select different exercises than other patterns to create workout variation.
    </AlertDescription>
  </Alert>
)}

// Use displayId for exercise selection
onClick={() => toggleExerciseSelection(template.displayId, exercise.id)}
selectedExercises = customization.workoutConfiguration[template.displayId] || []
```

## Data Structure

### Database Schema
```typescript
// UserProgram model (Prisma)
{
  userId: string,
  trainingProgramId: string,
  categoryType: 'MINIMALIST' | 'ESSENTIALIST' | 'MAXIMALIST',
  configuration: {
    structureId: string,
    workoutPattern: number, // 1, 2, or 3
    weeklyScheduleMapping: Record<string, string>,
    workoutConfiguration: {
      // Pattern 1 (same workout)
      "upper-body": ["exercise-id-1", "exercise-id-2"],
      "lower-body": ["exercise-id-3", "exercise-id-4"],
      
      // Pattern 2 or 3 (A/B/C variants)
      "upper-body-A": ["exercise-id-1", "exercise-id-2"],
      "upper-body-B": ["exercise-id-5", "exercise-id-6"],
      "upper-body-C": ["exercise-id-7", "exercise-id-8"],
      "lower-body-A": ["exercise-id-3", "exercise-id-4"],
      "lower-body-B": ["exercise-id-9", "exercise-id-10"],
      "lower-body-C": ["exercise-id-11", "exercise-id-12"]
    }
  }
}
```

## User Flow

### 1. Select Pattern
1. Navigate to `/programs/[id]/guide`
2. Go to **Customize** tab
3. Under **Pattern** section, select workout pattern:
   - ✓ Same workout repeated (Pattern 1)
   - ○ Workout A and B (Pattern 2)
   - ○ Workout A, B, and C (Pattern 3)

### 2. Customize Workouts
1. Scroll to **Workout Templates** section
2. For Pattern 1: See normal workout list
3. For Pattern 2/3: See multiplied workouts with A/B/C labels
4. Expand each workout to select exercises
5. Pattern info alert reminds users to select different exercises for variation

### 3. View Workouts
1. Click **Save Customization**
2. Go to **Workouts** tab (AI Assistant - coming soon)
3. See workouts displayed according to pattern:
   - Pattern 1: Upper Body, Lower Body
   - Pattern 2: Upper Body (A), Lower Body (A), Upper Body (B), Lower Body (B)
   - Pattern 3: Upper Body (A), Lower Body (A), Upper Body (B), Lower Body (B), Upper Body (C), Lower Body (C)

## Visual Examples

### Pattern 1 - Same Workout Repeated
```
Workouts:
- Upper Body
- Lower Body

Training Schedule: Mon, Wed, Fri
Mon: Upper Body
Wed: Lower Body  
Fri: Upper Body (same as Monday)
```

### Pattern 2 - Workout A and B
```
Workouts:
- Upper Body (A)
- Lower Body (A)
- Upper Body (B)
- Lower Body (B)

Training Schedule: Mon, Wed, Fri
Mon: Upper Body (A)
Wed: Lower Body (A)
Fri: Upper Body (B) (different exercises than A)
```

### Pattern 3 - Workout A, B, and C
```
Workouts:
- Upper Body (A)
- Lower Body (A)
- Upper Body (B)
- Lower Body (B)
- Upper Body (C)
- Lower Body (C)

Training Schedule: Mon, Tue, Thu, Fri, Sat
Mon: Upper Body (A)
Tue: Lower Body (A)
Thu: Upper Body (B) (different exercises than A)
Fri: Lower Body (B) (different exercises than A)
Sat: Upper Body (C) (different exercises than A & B)
```

## Technical Details

### ID Generation
- **Base ID**: `upper-body` (from program.workoutTemplates)
- **Pattern 1**: Uses base ID directly
- **Pattern 2**: `upper-body-A`, `upper-body-B`
- **Pattern 3**: `upper-body-A`, `upper-body-B`, `upper-body-C`

### State Management
```typescript
// Frontend state
customization: {
  workoutPattern: 2, // User selected pattern
  workoutConfiguration: {
    "upper-body-A": ["ex1", "ex2"],
    "upper-body-B": ["ex3", "ex4"],
    // ... more workouts
  }
}

// Sent to API
POST /api/programs/customize
{
  trainingProgramId: "program-id",
  customization: { ... } // Same as above
}

// Saved to database
UserProgram.configuration = {
  workoutPattern: 2,
  workoutConfiguration: { ... }
}
```

### Pattern Multiplication Logic
```typescript
// For 2 base workouts (Upper Body, Lower Body) and Pattern 2:
baseWorkouts = [
  { id: 'upper-body', name: 'Upper Body', order: 0 },
  { id: 'lower-body', name: 'Lower Body', order: 1 }
]

// After multiplication:
expandedWorkouts = [
  { id: 'upper-body', displayId: 'upper-body-A', patternLabel: 'A', order: 0 },
  { id: 'lower-body', displayId: 'lower-body-A', patternLabel: 'A', order: 1 },
  { id: 'upper-body', displayId: 'upper-body-B', patternLabel: 'B', order: 0 },
  { id: 'lower-body', displayId: 'lower-body-B', patternLabel: 'B', order: 1 }
]
```

## Benefits

1. **Workout Variety**: Users can create different workouts for each pattern to avoid monotony
2. **Progressive Overload**: Alternate between exercise variations (A uses barbell, B uses dumbbells)
3. **Muscle Confusion**: Different exercises target muscles from different angles
4. **Flexibility**: Users can choose how much variation they want (1x, 2x, or 3x)
5. **Personalization**: Each user's program is fully customized to their preferences

## Testing Checklist

- [x] Build successful
- [x] No TypeScript errors
- [ ] Pattern 1 displays workouts normally
- [ ] Pattern 2 multiplies workouts by 2 with A/B labels
- [ ] Pattern 3 multiplies workouts by 3 with A/B/C labels
- [ ] Exercise selection works for each pattern variant
- [ ] Different exercises can be selected for A, B, and C
- [ ] Customization saves correctly to database
- [ ] Customization loads correctly on page refresh
- [ ] Workouts tab displays pattern-aware workouts
- [ ] Exercise counts show correctly for each variant

## Future Enhancements

1. **Copy Exercises**: Add button to copy exercise selection from variant A to B/C as starting point
2. **Pattern Suggestions**: Suggest appropriate pattern based on training frequency
3. **Visual Schedule**: Show which pattern variant will be performed on which day
4. **Exercise Swap**: Swap exercises between pattern variants with drag-and-drop
5. **Pattern Analytics**: Track which patterns users prefer and their effectiveness

## Notes

- Pattern selection is saved in `configuration.workoutPattern`
- Exercise selection is saved per workout variant using `displayId` as key
- Original `template.id` is preserved as `originalId` for reference
- Pattern multiplication happens client-side for better performance
- Database stores flat structure (no nested arrays for patterns)
