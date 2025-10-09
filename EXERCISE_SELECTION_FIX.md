# Exercise Selection Not Working Fix

## Date: October 6, 2025

## Problem Reported
User reported: "In the program guide page, under customize tab, under workouts tab, in a workout template when I want to select exercises I'm not able to do that, I click on an exercise and it's not selected."

## Root Cause Analysis

The issue was in the exercise selection click handler in the program customizer component.

### The Data Structure:

When workout templates are displayed, especially with patterns (2x or 3x workout patterns), the system creates different identifiers:

- **`id`**: The original database ID of the workout template
- **`displayId`**: A unique identifier for each displayed instance
  - For pattern 1 (no multiplication): `displayId = id`
  - For pattern 2 or 3: `displayId = "${id}-A"`, `"${id}-B"`, etc.
- **`baseId`**: Always the original template ID

### The Problem:

1. The `workoutConfiguration` state stores selected exercises keyed by `displayId`
2. When displaying selected exercises, the code correctly used: `customization.workoutConfiguration[template.displayId]`
3. But when toggling exercise selection, it was passing `template.id` instead of `template.displayId`

### Code Flow:

**Before Fix (Broken):**
```
User clicks exercise
  ↓
onClick calls: toggleExerciseSelection(template.id, exercise.id)
  ↓ (template.id might be "workout-123" or could be something else)
Function updates: workoutConfiguration["workout-123"]
  ↓
Display reads: workoutConfiguration[template.displayId] (e.g., "workout-123-A")
  ↓
❌ Mismatch! Keys don't match, so selection not shown
```

**After Fix (Working):**
```
User clicks exercise
  ↓
onClick calls: toggleExerciseSelection(template.displayId, exercise.id)
  ↓ (template.displayId is "workout-123-A")
Function updates: workoutConfiguration["workout-123-A"]
  ↓
Display reads: workoutConfiguration[template.displayId] ("workout-123-A")
  ↓
✅ Keys match! Selection properly displayed
```

## The Fix

### Location: `src/components/programs/program-customizer.tsx` (line ~1261)

**Before:**
```tsx
onClick={() => canSelect || isSelected ? toggleExerciseSelection(template.id, exercise.id) : undefined}
```

**After:**
```tsx
onClick={() => canSelect || isSelected ? toggleExerciseSelection(template.displayId, exercise.id) : undefined}
```

### Why This Fix Works:

1. **Consistent Key Usage**: Both reading and writing to `workoutConfiguration` now use the same key (`displayId`)
2. **Pattern Support**: Works correctly whether the user has pattern 1, 2, or 3 selected
3. **No Side Effects**: The `toggleExerciseSelection` function doesn't care what the ID is, it just uses it as a key

## Impact

This fix ensures that:
- ✅ Exercise selection works for all workout patterns (1x, 2x, 3x)
- ✅ Selected exercises are properly tracked in state
- ✅ Visual feedback (checkmarks, highlighting) displays correctly
- ✅ Exercise limits per muscle group are enforced correctly

## Testing

### Before Fix:
1. Go to program customizer
2. Select workout pattern (any pattern)
3. Click on an exercise
4. **BUG**: Exercise not selected, no visual feedback ❌

### After Fix:
1. Go to program customizer
2. Select workout pattern (any pattern)
3. Click on an exercise
4. **FIXED**: Exercise selected, checkmark appears ✅
5. Click again to deselect
6. **FIXED**: Exercise deselected, checkmark disappears ✅

## Build Results

```
✓ Linting and checking validity of types
✓ Build successful
✓ 0 errors, 0 warnings
```

## Related Code

The `WorkoutTemplateWithPattern` interface shows all the ID fields:
```typescript
interface WorkoutTemplateWithPattern {
  id: string;              // Original database ID
  name: Record<string, string>;
  order: number;
  requiredMuscleGroups: string[];
  exercisesPerMuscle?: Record<string, number>;
  patternLabel: string | null;  // "A", "B", "C" or null
  patternIndex: number;          // 0, 1, 2
  displayId: string;            // Unique display identifier
  baseId: string;               // Original template ID (same as id)
}
```

## Key Learnings

1. **Display IDs vs Database IDs**: When displaying repeated/multiplied items, always use display IDs for UI state management
2. **Consistency is Key**: Reading and writing to the same state object must use the same keys
3. **Pattern Complexity**: Workout pattern multiplication adds complexity that needs to be handled in the UI layer

## Status

✅ **COMPLETE** - Exercise selection now works correctly for all workout patterns.

User can now:
- Click to select exercises in any workout template
- See visual feedback (checkmarks) immediately
- Deselect exercises by clicking again
- Works with 1x, 2x, and 3x workout patterns
