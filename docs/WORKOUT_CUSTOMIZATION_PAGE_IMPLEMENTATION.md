# Workout Customization Page Implementation

**Status**: ✅ Complete  
**Date**: November 3, 2025  
**File**: `src/app/[locale]/programs/[id]/workouts/page.tsx`

## Overview

Comprehensive workout customization page that allows users to configure all workouts for their training program. Features a three-tab interface: Overview, Edit Workout, and Weekly Preview.

## Features

### 1. **Top Section**
- **Program Header**: Displays program name, description, and key metadata
- **Badges**: Shows training split, workout structure type, and training frequency
- **Edit Structure Button**: Quick access to modify split/structure configuration
- **Progress Card**: Visual progress bar showing workout completion status

### 2. **Tab 1: Structure Overview**
Provides a bird's-eye view of all workouts:

- **Workout Grid**: 
  - Responsive grid (1 column mobile, 2 tablet, 3 desktop)
  - Each card shows:
    - Workout name and type badge
    - Assigned training days
    - Exercise count
    - Completion status (checkmark for complete)
  - Click-to-edit functionality
  - Visual distinction for complete vs incomplete workouts

- **Progress Checklist**:
  - Lists all workouts with completion status
  - Quick navigation to incomplete workouts
  - Shows exercise count per workout

### 3. **Tab 2: Edit Workout**
Full-screen workout editing experience:

- **Back Button**: Return to overview
- **WorkoutEditor Component**: Complete workout customization interface
  - Editable workout name
  - Drag-and-drop exercise reordering
  - Add/remove exercises
  - Configure sets, reps, and bilateral settings
  - Real-time volume feedback
  - Save functionality with API integration

### 4. **Tab 3: Weekly Preview**
Calendar-style view of entire training week:

- **7-Day Schedule**: One card per day (Monday through Sunday)
- **Day Cards**:
  - Shows workouts assigned to each day
  - Color-coded by workout type
  - Expandable to show full exercise list
  - Rest days clearly marked
  
- **Expandable Exercise Lists**:
  - Numbered exercise order
  - Exercise name and sets/reps
  - Muscle group badges
  - Unilateral/bilateral indicators
  - Color-coded muscle indicators
  - Quick edit button per workout

### 5. **Navigation & Validation**
- **Bottom Navigation Bar**:
  - "Back to Structure" button
  - "Complete & Next" button (disabled until all workouts configured)
  - Warning alert if workouts incomplete

- **Validation**:
  - Tracks workout completion (requires at least 1 exercise)
  - Prevents proceeding until all workouts complete
  - Clear error messaging

## Technical Details

### API Integration

#### Fetch Program Data
```typescript
GET /api/programs/[id]/split-structure
```
Returns program with:
- Training split details
- Structure configuration
- All workouts with exercises
- Nested exercise details

#### Save Workout
```typescript
PATCH /api/programs/[id]/workouts/[workoutId]
```
WorkoutEditor component handles this internally.

### Data Models

```typescript
interface ProgramData {
  id: string;
  name: string;
  description: string;
  workoutStructureType: 'REPEATING' | 'AB' | 'ABC';
  split: TrainingSplit;
  structure: TrainingSplitStructure;
  workouts: Workout[];
}

interface Workout {
  id: string;
  name: string;
  type: string;
  assignedDays: string[];
  exercises: WorkoutExercise[];
}

interface WorkoutExercise {
  id: string;
  exerciseId: string;
  sets: number;
  reps: string;
  isBilateral: boolean;
  order: number;
  exercise: Exercise;
}
```

### State Management

```typescript
const [program, setProgram] = useState<ProgramData | null>(null);
const [loading, setLoading] = useState(true);
const [activeTab, setActiveTab] = useState<'overview' | 'edit' | 'preview'>('overview');
const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
```

### Progress Tracking

```typescript
const getProgressStats = () => {
  const total = program.workouts.length;
  const completed = program.workouts.filter((w) => w.exercises.length > 0).length;
  const percentage = Math.round((completed / total) * 100);
  return { completed, total, percentage };
};

const canProceedToNext = () => {
  const stats = getProgressStats();
  return stats.completed === stats.total && stats.total > 0;
};
```

## Color Coding System

### Workout Types
- **Upper**: Blue
- **Lower**: Purple
- **Push**: Orange
- **Pull**: Cyan
- **Legs**: Indigo
- **Chest**: Pink
- **Back**: Teal
- **Shoulders**: Amber
- **Arms**: Rose
- **Full Body**: Violet

### Muscle Groups
- **Chest**: Pink
- **Back**: Teal
- **Shoulders**: Amber
- **Biceps**: Blue
- **Triceps**: Purple
- **Forearms**: Slate
- **Quads**: Indigo
- **Hamstrings**: Orange
- **Glutes**: Rose
- **Calves**: Cyan
- **Abs**: Green
- **Lower Back**: Yellow

## User Flow

1. **Initial Load**: Fetch program with all workouts and exercise details
2. **Overview Tab**: Review all workouts, see completion status
3. **Select Workout**: Click a workout card to edit
4. **Edit Tab**: Configure exercises using WorkoutEditor component
5. **Save Workout**: WorkoutEditor saves changes, page refreshes data
6. **Preview Tab**: Review entire week's training schedule
7. **Expand Days**: Click days to see detailed exercise lists
8. **Complete**: Once all workouts configured, proceed to next step

## Responsive Design

- **Mobile (< 640px)**: Single column workout grid, stacked tabs
- **Tablet (640px - 1024px)**: Two-column workout grid, horizontal tabs
- **Desktop (> 1024px)**: Three-column workout grid, full-width tabs

## Accessibility Features

- Keyboard navigation for tabs
- Screen reader labels for status indicators
- Color + icon combinations for status (not color-only)
- Focus indicators on interactive elements
- Semantic HTML structure

## Integration Points

### Previous Step
`/[locale]/programs/[id]/split-structure` - Configure training split and structure

### Next Step
`/[locale]/programs/[id]/review` - Review and finalize program

### Component Dependencies
- `WorkoutEditor` - Main editing interface
- `shadcn/ui` components: Tabs, Card, Badge, Progress, ScrollArea, Button, Alert
- `lucide-react` icons

## API Route Updates

### Enhanced Split-Structure Route

**File**: `src/app/api/programs/[id]/split-structure/route.ts`

**Changes**:
1. Added nested exercise includes:
```typescript
workouts: {
  include: {
    exercises: {
      include: {
        exercise: {
          select: {
            id: true,
            name: true,
            primaryMuscle: true,
            secondaryMuscles: true,
            exerciseType: true,
            volumeContributions: true,
            canBeUnilateral: true
          }
        }
      },
      orderBy: { order: 'asc' }
    }
  },
  orderBy: { createdAt: 'asc' }
}
```

2. Added `workoutStructureType` to response:
```typescript
return NextResponse.json({
  success: true,
  program: {
    // ... other fields
    workoutStructureType: program.workoutStructureType,
    // ...
  }
});
```

## Build Results

✅ **Build Status**: Successful  
✅ **Bundle Size**: 27.7 kB (workouts page)  
✅ **First Load JS**: 181 kB  
✅ **Type Checking**: Passed  
✅ **ESLint**: No errors

## Testing Checklist

- [ ] Load page with empty workouts (should show overview tab)
- [ ] Load page with completed workouts (should show progress)
- [ ] Click workout card to switch to edit tab
- [ ] Edit workout using WorkoutEditor component
- [ ] Save workout and verify data refreshes
- [ ] Switch to preview tab
- [ ] Expand/collapse days in weekly preview
- [ ] Verify workout type colors
- [ ] Verify muscle group colors
- [ ] Test "Back to Structure" button
- [ ] Test "Complete & Next" button (disabled when incomplete)
- [ ] Test "Complete & Next" button (enabled when all complete)
- [ ] Test breadcrumb navigation
- [ ] Test mobile responsive layout
- [ ] Test tablet responsive layout
- [ ] Test keyboard navigation

## Known Limitations

1. **"Add Workout" functionality**: Currently not implemented. Business logic needed to determine when structure allows additional workouts.

2. **Next Step Route**: Currently routes to `/[locale]/programs/[id]/review` which may not exist yet. Update `handleNextStep()` when next step is implemented.

3. **Exercise Count**: Weekly preview shows total exercises but doesn't account for bilateral vs unilateral (which effectively doubles volume).

## Future Enhancements

1. **Workout Templates**: Allow importing exercises from templates
2. **Workout Reordering**: Drag-and-drop reordering of workouts themselves
3. **Bulk Actions**: Select multiple workouts for batch operations
4. **Export/Import**: Export workout configuration to JSON
5. **Workout Notes**: Add custom notes to workouts
6. **Rest Day Exercises**: Optional light activities or stretching for rest days
7. **Progressive Overload Tracking**: Track planned progression week-over-week
8. **Volume Analytics**: Detailed breakdown by muscle group across entire week
9. **Exercise Substitutions**: Suggest alternative exercises for equipment limitations
10. **AI Recommendations**: Suggest exercises based on workout type and goals

## Related Documentation

- [WorkoutEditor Component](./WORKOUT_EDITOR_IMPLEMENTATION.md) - Component documentation (to be created)
- [WorkoutStructureSelector Component](./WORKOUT_STRUCTURE_SELECTOR_IMPLEMENTATION.md) - Structure selection
- [Split Structure Page](./SPLIT_STRUCTURE_PAGE.md) - Previous step documentation (to be created)
- [API Routes](./API_ROUTES.md) - Complete API documentation (to be created)

## Conclusion

The workout customization page provides a comprehensive interface for configuring training programs. With its three-tab design, users can efficiently manage all aspects of their workout plan while maintaining visibility of their progress and weekly schedule. The integration with WorkoutEditor component ensures a consistent editing experience, while the overview and preview tabs provide crucial context for decision-making.
