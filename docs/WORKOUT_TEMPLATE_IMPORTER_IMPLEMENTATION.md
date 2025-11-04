# Workout Template Importer Implementation

**Status**: ✅ Complete  
**Date**: November 3, 2025  
**File**: `src/components/WorkoutTemplateImporter.tsx`

## Overview

A reusable modal component that allows users to browse, preview, and import pre-configured workout templates into their training programs. Features a dual-dialog interface with search, filtering, and conflict resolution capabilities.

## Features

### 1. **Main Template Browser Dialog**

#### Search Functionality
- Real-time search input
- Searches across workout name and type fields
- Debounced API calls for performance
- Clear visual feedback during loading

#### Filter System
- **Training Split Filter**: Filter templates by their associated training split
- **Difficulty Filter**: Filter by beginner/intermediate/advanced levels
- Dynamic filter options based on available templates
- "All" option for each filter

#### Template Grid
- Responsive grid layout (1 column mobile, 2 desktop)
- Each template card displays:
  - Workout name and type badge
  - Exercise count
  - Training split name
  - Difficulty badge (color-coded)
  - Focus areas (up to 3 visible, "+N" for more)
  - Preview button
- Click anywhere on card to preview
- Hover effects for better UX

### 2. **Preview Dialog**

#### Template Details
- Full workout name and type
- Difficulty badge
- Total exercise count
- Conflict resolution strategy selector

#### Exercise List
- Scrollable list of all exercises (400px max height)
- Each exercise shows:
  - Order number (1, 2, 3...)
  - Exercise name
  - Sets and reps configuration
  - Primary muscle badge
  - Exercise type (COMPOUND/ISOLATION)
  - Bilateral/unilateral indicator
  - Secondary muscles (if any)
- Professional card-based layout

#### Conflict Resolution
Three strategies for handling name conflicts:
1. **Rename automatically**: Adds "(1)", "(2)", etc. to workout name
2. **Skip import**: Cancels import if name exists
3. **Replace existing**: Deletes old workout and imports new one

### 3. **Import Process**

- Transaction-based for data integrity
- Progress indication during import
- Success/error toast notifications
- Automatic data refresh after import
- Modal closes automatically on success
- Filter state resets after successful import

## Component API

```typescript
export interface WorkoutTemplateImporterProps {
  programId: string;              // Required: Target program ID
  open: boolean;                  // Control modal visibility
  onOpenChange: (open: boolean) => void;  // Callback for modal state
  onImportSuccess?: () => void;   // Optional: Called after successful import
}
```

### Usage Example

```tsx
import WorkoutTemplateImporter from '@/components/WorkoutTemplateImporter';

function MyComponent() {
  const [importerOpen, setImporterOpen] = useState(false);
  
  return (
    <>
      <Button onClick={() => setImporterOpen(true)}>
        Import Template
      </Button>
      
      <WorkoutTemplateImporter
        programId={programId}
        open={importerOpen}
        onOpenChange={setImporterOpen}
        onImportSuccess={() => {
          // Refresh workout list
          fetchWorkouts();
        }}
      />
    </>
  );
}
```

## Backend Integration

### API Endpoints

#### 1. GET /api/workout-templates
Fetches available workout templates for importing.

**Query Parameters:**
- `search` (optional): Search term for name/type
- `splitId` (optional): Filter by training split ID
- `difficulty` (optional): Filter by difficulty level

**Response:**
```typescript
{
  success: true,
  templates: WorkoutTemplate[],
  filters: {
    splits: Split[],
    difficulties: string[]
  }
}
```

**Template Source:**
- Queries existing `Workout` records with exercises
- Creates "template library" from user-created workouts
- Returns up to 50 templates, ordered by exercise count and creation date

#### 2. POST /api/programs/[id]/import-template
Imports a workout template into the target program.

**Request Body:**
```typescript
{
  templateId: string,           // Required: ID of template to import
  conflictStrategy: 'rename' | 'skip' | 'replace'  // Default: 'rename'
}
```

**Response:**
```typescript
{
  success: true,
  workout: Workout,             // Imported workout with exercises
  renamed: boolean              // True if name was automatically changed
}
```

**Process:**
1. Verifies program ownership
2. Fetches template with exercises
3. Checks for name conflicts
4. Applies conflict resolution strategy
5. Executes transaction:
   - Creates new workout
   - Bulk creates workout exercises
   - Returns complete workout with relations
6. Returns result with renamed flag

## Transaction Safety

The import process uses Prisma transactions to ensure data integrity:

```typescript
const importedWorkout = await prisma.$transaction(async (tx) => {
  // Create workout
  const newWorkout = await tx.workout.create({ ... });
  
  // Create exercises
  await tx.workoutExercise.createMany({ ... });
  
  // Fetch complete workout
  return await tx.workout.findUnique({ ... });
});
```

If any step fails, the entire import is rolled back.

## Data Models

```typescript
interface WorkoutTemplate {
  id: string;
  name: string;
  type: string;
  exerciseCount: number;
  exercises: TemplateExercise[];
  split: Split;
}

interface TemplateExercise {
  id: string;
  exerciseId: string;
  exercise: Exercise;
  sets: number;
  reps: string;
  isBilateral: boolean;
  order: number;
}

interface Split {
  id: string;
  name: string;
  difficulty: string;
  focusAreas?: string[];
}
```

## State Management

```typescript
// Dialog states
const [loading, setLoading] = useState(false);
const [importing, setImporting] = useState(false);
const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
const [filters, setFilters] = useState<Filters>({ splits: [], difficulties: [] });

// Filter states
const [searchQuery, setSearchQuery] = useState('');
const [selectedSplit, setSelectedSplit] = useState<string>('all');
const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');

// Preview states
const [previewTemplate, setPreviewTemplate] = useState<WorkoutTemplate | null>(null);
const [conflictStrategy, setConflictStrategy] = useState<ConflictStrategy>('rename');
```

## Color Coding

### Difficulty Badges
- **Beginner**: Green
- **Intermediate**: Yellow
- **Advanced**: Red
- **Unknown**: Gray

```typescript
const getDifficultyColor = (difficulty: string) => {
  switch (difficulty.toLowerCase()) {
    case 'beginner': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'intermediate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    case 'advanced': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
  }
};
```

## User Flow

1. **Open Importer**: User clicks "Import Template" button
2. **Browse Templates**: View grid of available templates
3. **Search/Filter**: Narrow down options using search and filters
4. **Preview Template**: Click template card to see full details
5. **Select Strategy**: Choose conflict resolution strategy
6. **Import**: Click "Import Workout" button
7. **Confirmation**: See success toast notification
8. **Auto-close**: Modal closes and parent component refreshes

## Error Handling

### Loading States
- Skeleton loading during template fetch
- Spinner during import process
- Disabled buttons during operations

### Error Scenarios
1. **Failed Fetch**: Toast error + alert in modal
2. **Failed Import**: Toast error + import button re-enabled
3. **Conflict Skip**: Warning toast + modal remains open
4. **No Templates**: Helpful alert message with suggestions

### User Feedback
- Success: Green toast with workout name
- Renamed: Info toast showing new name
- Skipped: Warning toast about existing workout
- Error: Red toast with error message

## Responsive Design

- **Mobile (< 768px)**: 
  - Single column template grid
  - Stacked filters
  - Full-width dialog
  
- **Desktop (≥ 768px)**:
  - Two-column template grid
  - Side-by-side filters
  - Max-width 4xl dialog

## Accessibility

- Keyboard navigation for dialogs
- Focus management on open/close
- Screen reader labels for all icons
- Color + text for status (not color-only)
- Semantic HTML structure

## Integration with Workouts Page

The component is integrated into the workouts page:

```tsx
// In workouts page
const [importerOpen, setImporterOpen] = useState(false);

// Action bar
<Button onClick={() => setImporterOpen(true)} variant="outline">
  <Download className="h-4 w-4 mr-2" />
  Import Template
</Button>

// Component
<WorkoutTemplateImporter
  programId={programId}
  open={importerOpen}
  onOpenChange={setImporterOpen}
  onImportSuccess={fetchProgramData}
/>
```

## Build Results

✅ **Build Status**: Successful  
✅ **Bundle Impact**: Minimal (included in workouts page 27 kB)  
✅ **Type Checking**: Passed  
✅ **ESLint**: No errors

## Testing Checklist

### Template Browser
- [ ] Open modal shows loading state
- [ ] Templates load and display correctly
- [ ] Search filters templates in real-time
- [ ] Split filter works correctly
- [ ] Difficulty filter works correctly
- [ ] "All" options reset filters
- [ ] Empty state shows when no templates found
- [ ] Template cards display all information
- [ ] Hover effects work on cards

### Preview Dialog
- [ ] Clicking template opens preview
- [ ] Preview shows all exercise details
- [ ] Conflict strategy selector works
- [ ] Back button returns to browser
- [ ] Close button (X) works
- [ ] Dialog can be closed with escape key

### Import Process
- [ ] Import button triggers API call
- [ ] Loading state shows during import
- [ ] Success toast appears on completion
- [ ] Modal closes after success
- [ ] Parent component refreshes data
- [ ] Rename strategy adds (1), (2), etc.
- [ ] Skip strategy prevents import
- [ ] Replace strategy deletes old workout
- [ ] Error toast shows on failure
- [ ] Import button re-enables after error

### Edge Cases
- [ ] Importing with no existing workouts
- [ ] Importing with conflicting name
- [ ] Importing with same name multiple times
- [ ] Network error during fetch
- [ ] Network error during import
- [ ] Unauthorized access handling
- [ ] Program not found handling

## Known Limitations

1. **Template Source**: Currently uses existing user workouts as templates. In future, could add curated admin-created templates.

2. **No Bulk Import**: Can only import one workout at a time. Could add multi-select for bulk imports.

3. **No Template Editing**: Templates are imported as-is. Could add option to modify before importing.

4. **Fixed Conflict Strategies**: Only three strategies available. Could add more granular control (e.g., merge exercises).

## Future Enhancements

1. **Admin-Curated Templates**: Add ability for admins to create official templates
2. **Template Categories**: Organize templates by goal (strength, hypertrophy, endurance)
3. **Template Ratings**: Allow users to rate templates
4. **Bulk Import**: Select and import multiple templates at once
5. **Template Modification**: Edit template before importing
6. **Exercise Substitution**: Replace exercises during import based on available equipment
7. **Template Sharing**: Allow users to share their workouts as templates
8. **Template History**: Track which templates user has imported
9. **Smart Recommendations**: Suggest templates based on user's split and goals
10. **Template Preview Stats**: Show volume, intensity, and frequency metrics

## Related Files

- **Component**: `src/components/WorkoutTemplateImporter.tsx` (450+ lines)
- **API Routes**:
  - `src/app/api/workout-templates/route.ts` (150+ lines)
  - `src/app/api/programs/[id]/import-template/route.ts` (180+ lines)
- **Integration**: `src/app/[locale]/programs/[id]/workouts/page.tsx`
- **Dependencies**: 
  - `shadcn/ui` Dialog, Select, Input, Card, Badge, ScrollArea
  - `lucide-react` icons
  - `sonner` toasts

## Conclusion

The WorkoutTemplateImporter provides a seamless way for users to quickly populate their training programs with pre-configured workouts. The dual-dialog design separates browsing from previewing, while the transaction-based import ensures data integrity. Comprehensive error handling and conflict resolution make it robust for real-world usage. The component's modular design makes it easy to integrate into any program management interface.
