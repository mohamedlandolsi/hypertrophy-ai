# WorkoutStructureSelector Component

**Location**: `src/components/WorkoutStructureSelector.tsx`

## Overview

A visual component that helps users choose how to structure their workouts within a training program. Offers three patterns: Repeating, A/B Split, and A/B/C Split, with clear explanations and workout count calculations.

## Component Purpose

After users select their training split (e.g., Upper/Lower, PPL), this component helps them decide how to organize the actual workouts:
- **Repeating**: Same workout every time (e.g., same "Upper" workout)
- **A/B Split**: Two variations that alternate (e.g., Upper A, Upper B)
- **A/B/C Split**: Three variations that rotate (e.g., Upper A, B, C)

## Props

```typescript
interface WorkoutStructureSelectorProps {
  splitStructure: {
    daysPerWeek: number;        // Training days per week
    pattern: string;            // Description of the pattern
    workoutTypes: string[];     // e.g., ['Upper', 'Lower'] or ['Push', 'Pull', 'Legs']
  };
  selectedType?: WorkoutStructureType;  // 'REPEATING' | 'AB' | 'ABC'
  onSelect: (type: WorkoutStructureType) => void;
}
```

## Features

### 1. Visual Cards
- Three options displayed as interactive cards
- Color-coded icons (Repeat, GitBranch, Layers)
- Selected state with checkmark indicator
- Workout count badge on each card

### 2. Smart Calculations
- Automatically calculates total workouts needed
- **Repeating**: 1 workout per workout type
- **A/B Split**: 2 workouts per workout type
- **A/B/C Split**: 3 workouts per workout type

### 3. Example Schedules
- Shows actual workout sequence based on split
- Generates realistic 7-day schedule preview
- Adapts to different split configurations

### 4. Selection Summary
- Alert box shows detailed breakdown when selected
- Lists all workout names that will be created
- Visual badges with workout names

### 5. Educational Info
- Bottom info card explains each structure type
- Use cases and benefits clearly described
- Helps users make informed decisions

## Usage Examples

### Basic Usage (Upper/Lower Split)

```tsx
import WorkoutStructureSelector from '@/components/WorkoutStructureSelector';

function ProgramBuilder() {
  const [structure, setStructure] = useState<WorkoutStructureType>();

  return (
    <WorkoutStructureSelector
      splitStructure={{
        daysPerWeek: 4,
        pattern: 'Upper/Lower/Upper/Lower',
        workoutTypes: ['Upper', 'Lower']
      }}
      selectedType={structure}
      onSelect={setStructure}
    />
  );
}
```

**Result**:
- Repeating: 2 workouts (Upper, Lower)
- A/B: 4 workouts (Upper A, Upper B, Lower A, Lower B)
- A/B/C: 6 workouts (Upper A/B/C, Lower A/B/C)

### Push/Pull/Legs Split

```tsx
<WorkoutStructureSelector
  splitStructure={{
    daysPerWeek: 6,
    pattern: 'Push/Pull/Legs/Push/Pull/Legs',
    workoutTypes: ['Push', 'Pull', 'Legs']
  }}
  selectedType={structure}
  onSelect={setStructure}
/>
```

**Result**:
- Repeating: 3 workouts
- A/B: 6 workouts
- A/B/C: 9 workouts

### Full Body Split

```tsx
<WorkoutStructureSelector
  splitStructure={{
    daysPerWeek: 3,
    pattern: 'Full Body',
    workoutTypes: ['Full Body']
  }}
  selectedType={structure}
  onSelect={setStructure}
/>
```

**Result**:
- Repeating: 1 workout
- A/B: 2 workouts
- A/B/C: 3 workouts

## Integration Points

### In Multi-Step Wizard

```tsx
// Step 1: Select training split
// Step 2: Select workout structure ← This component
// Step 3: Configure individual workouts

function ProgramWizard() {
  const [step, setStep] = useState(2);
  const [structure, setStructure] = useState<WorkoutStructureType>();

  const handleNext = () => {
    if (!structure) {
      alert('Please select a structure');
      return;
    }
    // Calculate workout count and navigate to workout builder
    setStep(3);
  };

  if (step === 2) {
    return (
      <>
        <WorkoutStructureSelector {...props} />
        <Button onClick={handleNext} disabled={!structure}>
          Next: Configure Workouts
        </Button>
      </>
    );
  }
}
```

### With Form State Management

```tsx
import { useForm } from 'react-hook-form';

function ProgramForm() {
  const { watch, setValue } = useForm({
    defaultValues: {
      workoutStructureType: undefined
    }
  });

  return (
    <WorkoutStructureSelector
      {...props}
      selectedType={watch('workoutStructureType')}
      onSelect={(type) => setValue('workoutStructureType', type)}
    />
  );
}
```

## Styling & Design

### Visual Hierarchy
1. **Header**: Component title and description
2. **Cards Grid**: 3 columns on desktop, stacked on mobile
3. **Selection Summary**: Alert box with workout breakdown
4. **Info Section**: Educational content at bottom

### Color Coding
- **Repeating**: Blue (`text-blue-600`)
- **A/B Split**: Purple (`text-purple-600`)
- **A/B/C Split**: Orange (`text-orange-600`)

### Interactive States
- **Default**: Outlined card with hover shadow
- **Selected**: Ring border, filled checkmark icon
- **Hover**: Shadow increase for better feedback

## Calculation Logic

### Workout Count Formula

```typescript
// Repeating: 1 workout per type
workoutCount = workoutTypes.length

// A/B: 2 workouts per type
workoutCount = workoutTypes.length * 2

// A/B/C: 3 workouts per type
workoutCount = workoutTypes.length * 3
```

### Workout Name Generation

```typescript
// Repeating
['Upper', 'Lower']

// A/B
['Upper A', 'Upper B', 'Lower A', 'Lower B']

// A/B/C
['Upper A', 'Upper B', 'Upper C', 'Lower A', 'Lower B', 'Lower C']
```

### Schedule Preview

```typescript
// For a 4-day Upper/Lower with A/B structure:
// Day 1: Upper A
// Day 2: Lower A
// Day 3: Upper B
// Day 4: Lower B
// Day 5: Rest
// Day 6: Rest
// Day 7: Rest
```

## Helper Function

```typescript
import { generateWorkoutNames } from '@/components/WorkoutStructureSelector.examples';

const workoutNames = generateWorkoutNames(
  ['Upper', 'Lower'],
  'AB'
);
// Returns: ['Upper A', 'Upper B', 'Lower A', 'Lower B']
```

## Validation & Error Handling

### Required Selection
- Component shows which structure is selected
- Parent form should validate selection before proceeding

### Edit Mode Warning
```tsx
const handleSelect = (type: WorkoutStructureType) => {
  if (isEditMode && type !== currentStructure) {
    const confirmed = confirm(
      'Changing structure will affect existing workouts. Continue?'
    );
    if (!confirmed) return;
  }
  onSelect(type);
};
```

## Accessibility

- ✅ Keyboard navigable (cards are clickable)
- ✅ Visual selection indicators
- ✅ Clear labels and descriptions
- ✅ Color is not the only differentiator (icons + text)

## Mobile Responsive

- Desktop: 3-column grid
- Tablet: 2-column grid  
- Mobile: Stacked single column
- Touch-friendly card sizes

## Best Practices

### 1. Show After Split Selection
Only show this component after user has selected their training split.

### 2. Provide Context
Explain that this determines how many unique workouts they'll create.

### 3. Save Selection
Persist the selection so users can review/edit later.

### 4. Validate Before Proceeding
```tsx
if (!selectedStructure) {
  toast.error('Please select a workout structure');
  return;
}
```

### 5. Calculate Next Steps
```tsx
const workoutCount = calculateWorkoutCount(
  splitStructure.workoutTypes,
  selectedStructure
);

// Navigate to workout builder with count
router.push(`/programs/${id}/workouts?count=${workoutCount}`);
```

## Related Components

- **SplitSelector**: For choosing training split (Upper/Lower, PPL, etc.)
- **WorkoutBuilder**: For configuring individual workouts after structure selection
- **ProgramWizard**: Multi-step program creation flow that uses this component

## Examples File

See `src/components/WorkoutStructureSelector.examples.tsx` for:
- 6 complete usage examples
- Integration with forms
- Multi-step wizard patterns
- Edit mode handling
- Helper function for workout name generation

## API Integration

After structure selection, typical flow:

```typescript
// 1. Save structure choice
await fetch(`/api/programs/${programId}`, {
  method: 'PATCH',
  body: JSON.stringify({
    workoutStructureType: selectedType
  })
});

// 2. Generate workout templates
const workoutNames = generateWorkoutNames(
  splitStructure.workoutTypes,
  selectedType
);

// 3. Create workout records
for (const name of workoutNames) {
  await fetch(`/api/programs/${programId}/workouts`, {
    method: 'POST',
    body: JSON.stringify({ name, type: extractType(name) })
  });
}
```

## Testing Considerations

```typescript
// Test cases:
// 1. Render all 3 options
// 2. Select each option and verify onSelect callback
// 3. Verify workout count calculations
// 4. Check selected state visual feedback
// 5. Test with different split configurations
// 6. Verify example schedule generation
// 7. Test responsive layout
```

## Dependencies

- shadcn/ui components: Card, Button, Badge, Alert
- Lucide icons: Repeat, GitBranch, Layers, CheckCircle2, Info, Dumbbell
- Tailwind CSS for styling
- TypeScript for type safety

---

**Status**: ✅ Implemented and Build Verified  
**Build Size**: Component compiled successfully in production build  
**Next Steps**: Integrate into program creation wizard flow
