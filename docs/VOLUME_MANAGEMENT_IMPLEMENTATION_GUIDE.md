# Volume Management Feature - Implementation Guide

## Completed (✅)

### Database & Backend
1. ✅ Added `volumeRange` field to Prisma schema
2. ✅ Updated Zod validation schemas
3. ✅ Modified API create/update operations  
4. ✅ Updated all TypeScript interfaces
5. ✅ Admin UI for setting volume ranges (min/max sets per muscle)

### Files Modified:
- `prisma/schema.prisma`
- `src/lib/validations/program-creation.ts`
- `src/app/api/admin/programs/actions.ts`
- `src/app/[locale]/admin/programs/[id]/edit/page.tsx`
- `src/components/admin/program-creation/workout-templates-form.tsx`

## Remaining Work (TODO)

### User-Facing Features in Program Customizer

File: `src/components/programs/program-customizer.tsx`

#### 1. Filter Exercises by Volume Contribution

**Location:** In the exercise list rendering (around line 1247)

```typescript
// Add this filter when mapping exercises
const filteredExercises = availableExercises.filter((exercise: Exercise) => {
  const contribution = exercise.volumeContributions?.[muscleGroup] || 0;
  return contribution >= 0.75; // Only show exercises with 75%+ contribution
});

// Then map filteredExercises instead of availableExercises
{filteredExercises.map((exercise: Exercise) => {
  // ... existing code
})}
```

#### 2. Add State for Exercise Sets

**Location:** After customization state declaration (around line 155)

```typescript
// Add new state for tracking sets per exercise
const [exerciseSets, setExerciseSets] = useState<Record<string, Record<string, number>>>({});

// Helper to get/set exercise sets
const getExerciseSets = (templateId: string, exerciseId: string) => {
  return exerciseSets[templateId]?.[exerciseId] || 3; // default 3 sets
};

const setExerciseSetCount = (templateId: string, exerciseId: string, sets: number) => {
  setExerciseSets(prev => ({
    ...prev,
    [templateId]: {
      ...(prev[templateId] || {}),
      [exerciseId]: sets
    }
  }));
};
```

#### 3. Add Sets Selection UI

**Location:** Inside exercise card (around line 1261)

```typescript
// Add after the exercise name/equipment display
{isSelected && (
  <div className="mt-2 flex items-center space-x-2">
    <Label htmlFor={`sets-${template.displayId}-${exercise.id}`} className="text-xs">
      Sets:
    </Label>
    <Select
      value={getExerciseSets(template.displayId, exercise.id).toString()}
      onValueChange={(value) => setExerciseSetCount(template.displayId, exercise.id, parseInt(value))}
    >
      <SelectTrigger id={`sets-${template.displayId}-${exercise.id}`} className="w-20">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
          <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
)}
```

#### 4. Calculate Volume Per Muscle

**Location:** Add helper function after exercise-related functions (around line 745)

```typescript
// Calculate total volume for a muscle in a workout
const calculateMuscleVolume = (template: WorkoutTemplateWithPattern, muscleGroup: string): number => {
  const selectedExercises = customization.workoutConfiguration[template.displayId] || [];
  let totalVolume = 0;
  
  selectedExercises.forEach(exerciseId => {
    const sets = getExerciseSets(template.displayId, exerciseId);
    const exercise = Object.values(exercisesByMuscleGroup).flat().find(ex => ex.id === exerciseId);
    
    if (exercise && exercise.volumeContributions) {
      const contribution = exercise.volumeContributions[muscleGroup] || 0;
      totalVolume += sets * contribution;
    }
  });
  
  return Math.round(totalVolume);
};

// Get volume range from template
const getVolumeRange = (template: WorkoutTemplateWithPattern, muscleGroup: string) => {
  const volumeRange = template.volumeRange as Record<string, { min: number; max: number }> | undefined;
  return volumeRange?.[muscleGroup] || { min: 2, max: 5 };
};

// Determine volume status
const getVolumeStatus = (volume: number, range: { min: number; max: number }) => {
  if (volume < range.min) {
    return { 
      color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', 
      label: 'Too Low',
      icon: '⚠️'
    };
  }
  if (volume > range.max) {
    return { 
      color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', 
      label: 'Too High',
      icon: '⚠️'
    };
  }
  return { 
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', 
    label: 'Optimal',
    icon: '✓'
  };
};
```

#### 5. Display Volume Indicator

**Location:** In the muscle group badge area (around line 1195)

```typescript
// Add volume indicator next to muscle group badge
{validMuscleGroups.map((muscleGroup: string) => {
  const muscle = muscleGroupMapping[muscleGroup.toLowerCase()];
  const volume = calculateMuscleVolume(template, muscleGroup);
  const range = getVolumeRange(template, muscleGroup);
  const status = getVolumeStatus(volume, range);
  
  return (
    <div key={muscleGroup} className="flex items-center space-x-2">
      <Badge variant="secondary" className={muscleColors[muscleGroup]}>
        {muscle?.name || muscleGroup}
      </Badge>
      <Badge className={status.color}>
        {status.icon} {volume}/{range.min}-{range.max} sets
      </Badge>
    </div>
  );
})}
```

#### 6. Add Muscle Priority/Ordering Feature

**Location:** Add new state and UI in muscle group section (around line 1180)

```typescript
// Add state for muscle ordering
const [musclePriorityOrder, setMusclePriorityOrder] = useState<Record<string, string[]>>({});

// Helper to get ordered muscles
const getOrderedMuscles = (templateId: string, muscles: string[]) => {
  const order = musclePriorityOrder[templateId];
  if (!order) return muscles;
  
  // Sort based on custom order, then append remaining
  const ordered = [...order].filter(m => muscles.includes(m));
  const remaining = muscles.filter(m => !order.includes(m));
  return [...ordered, ...remaining];
};

// Add UI for reordering (use drag-and-drop or up/down buttons)
// Using simple up/down buttons:
<div className="flex items-center space-x-2">
  <Badge variant="secondary">{muscle.name}</Badge>
  <div className="flex space-x-1">
    <Button 
      size="icon" 
      variant="ghost" 
      className="h-6 w-6"
      onClick={() => moveMuscleUp(template.displayId, muscleGroup)}
    >
      ↑
    </Button>
    <Button 
      size="icon" 
      variant="ghost" 
      className="h-6 w-6"
      onClick={() => moveMuscleDown(template.displayId, muscleGroup)}
    >
      ↓
    </Button>
  </div>
</div>

// Helper functions for reordering
const moveMuscleUp = (templateId: string, muscleGroup: string) => {
  const currentOrder = musclePriorityOrder[templateId] || [];
  const index = currentOrder.indexOf(muscleGroup);
  if (index > 0) {
    const newOrder = [...currentOrder];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    setMusclePriorityOrder(prev => ({ ...prev, [templateId]: newOrder }));
  }
};

const moveMuscleDown = (templateId: string, muscleGroup: string) => {
  const currentOrder = musclePriorityOrder[templateId] || [];
  const index = currentOrder.indexOf(muscleGroup);
  if (index < currentOrder.length - 1 && index !== -1) {
    const newOrder = [...currentOrder];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    setMusclePriorityOrder(prev => ({ ...prev, [templateId]: newOrder }));
  }
};
```

#### 7. Update TypeScript Interface

**Location:** WorkoutTemplateWithPattern interface (around line 458)

```typescript
interface WorkoutTemplateWithPattern {
  id: string;
  name: Record<string, string>;
  order: number;
  requiredMuscleGroups: string[];
  exercisesPerMuscle?: Record<string, number>;
  volumeRange?: Record<string, { min: number; max: number }>; // Add this
  patternLabel: string | null;
  patternIndex: number;
  displayId: string;
  baseId: string;
}
```

#### 8. Persist Exercise Sets Data

**Location:** In save/submit functions (around line 505)

```typescript
// Add exerciseSets to the configuration being saved
const saveConfiguration = async () => {
  setIsSaving(true);
  try {
    const response = await fetch('/api/programs/customize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        trainingProgramId: program.id,
        customization: {
          structureId: customization.structureId,
          categoryType: customization.categoryType,
          workoutConfiguration: customization.workoutConfiguration,
          weeklyScheduleMapping: customization.weeklyScheduleMapping,
          workoutPattern: savedWorkoutPattern,
          exerciseSets: exerciseSets, // Add this
          musclePriorityOrder: musclePriorityOrder, // Add this
        }
      }),
    });
    
    // ... rest of save logic
  } catch (error) {
    // ... error handling
  } finally {
    setIsSaving(false);
  }
};
```

## Testing Checklist

After implementing all features:

- [ ] Admin can set volume ranges for each muscle (e.g., 2-5 sets)
- [ ] Only exercises with ≥0.75 volume contribution show in user interface
- [ ] User can select 1-10 sets per exercise
- [ ] Volume calculation works correctly (sets × contribution)
- [ ] Volume indicator shows green/yellow/red based on range
- [ ] User can reorder muscles by priority (weak/strong points)
- [ ] Exercise sets persist after save
- [ ] Muscle order persists after save
- [ ] Volume indicator updates in real-time as sets change
- [ ] Build completes successfully: `npm run build`

## Additional Considerations

### UI/UX Improvements:
- Add tooltips explaining volume contribution
- Show percentage contribution on exercise cards
- Add visual feedback when volume is out of range
- Consider adding a "Reset to Recommended" button for sets

### Performance:
- Memoize volume calculations with `useMemo`
- Debounce set changes to avoid excessive re-renders

### Accessibility:
- Ensure all interactive elements have proper labels
- Add keyboard navigation for muscle reordering
- Provide screen reader announcements for volume status

## Current Status

✅ Backend/Database: Complete
✅ Admin UI: Complete  
✅ Build: Passing
⏳ User Customizer: Implementation guide provided above

All foundational work is complete. The remaining work involves adding the user-facing UI features to the program customizer component following the patterns provided in this guide.
