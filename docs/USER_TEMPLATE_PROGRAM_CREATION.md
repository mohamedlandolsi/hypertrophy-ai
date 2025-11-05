# User Template-Based Program Creation Feature

## Overview
This feature allows users to create training programs by cloning admin-created templates. It connects the user-facing app to the admin template management system, providing a quick start option for users who want to begin with a professionally designed program.

## Architecture

### Flow Diagram
```
User → Programs/Create Page → Two Options:
  1. Use Template → UserTemplateSelector → Confirmation → API → CustomTrainingProgram
  2. Start from Scratch → (Existing guided creation flow)
```

### Database Schema Relationships
```
ProgramTemplate (Admin-created blueprints)
  └── TemplateWorkout[]
      └── TemplateExercise[]

CustomTrainingProgram (User instances)
  └── Workout[]
      └── WorkoutExercise[]
```

**Key Point**: Templates are blueprints. When a user selects a template, the system clones all data into their own `CustomTrainingProgram` instance.

## Components

### 1. UserTemplateSelector Component
**Location**: `src/components/UserTemplateSelector.tsx`

**Purpose**: Modal that displays all active program templates for users to browse and select.

**Features**:
- **Template Display**: Grid of cards showing template details
- **Filters**:
  - Difficulty Level: All, Beginner, Intermediate, Advanced
  - Split Type: Dynamically generated from available splits
  - Search: Filters by name, description, target audience
- **Sorting**: Most Popular (default), Name
- **Template Card Details**:
  - Name and difficulty badge
  - Training split and duration
  - Description (first 100 chars)
  - Target audience
  - Usage count (how many users have used it)
  - Number of workouts
- **Confirmation Modal**: Shows template preview and allows custom program naming

**Props**:
```typescript
interface UserTemplateSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locale: string;
}
```

**State Management**:
- `templates`: All fetched templates
- `filteredTemplates`: After applying filters/search/sort
- `confirmationData`: Selected template for confirmation
- `customName`: User's custom program name

**Key Functions**:
- `fetchTemplates()`: GET /api/programs/templates
- `handleUseTemplate()`: Opens confirmation modal
- `handleConfirmCreate()`: POST /api/programs/create-from-template

**Error Handling**:
- Network errors show toast notification
- Tier limit errors show upgrade prompt with direct link to pricing
- Empty state when no templates match filters

### 2. Updated Program Creation Page
**Location**: `src/app/[locale]/programs/create/page.tsx`

**Changes**:
- Added `creationMode` state: 'template' | 'scratch' | null
- New "Step 0": Choose creation method before existing flow
- Two option cards:
  - **Use Template**: Opens UserTemplateSelector, lists benefits (pre-built workouts, proven structures, quick start)
  - **Start from Scratch**: Existing guided flow, lists benefits (full control, custom split, build your way)
- UserTemplateSelector integrated as modal

**Usage**:
```typescript
<UserTemplateSelector
  open={showTemplateSelector}
  onOpenChange={setShowTemplateSelector}
  locale={locale}
/>
```

## API Routes

### 1. GET /api/programs/templates
**Purpose**: Fetch all active templates for user browsing

**Authentication**: Required (user must be logged in)

**Response**:
```typescript
{
  templates: Array<{
    id: string;
    name: string;
    description: string | null;
    difficultyLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
    targetAudience: string | null;
    estimatedDurationWeeks: number | null;
    thumbnailUrl: string | null;
    popularity: number;
    trainingSplit: { name: string };
    splitStructure: { pattern: string; daysPerWeek: number };
    _count: {
      trainingPrograms: number; // Usage count
      templateWorkouts: number;
    };
  }>
}
```

**Query**: Orders by popularity (DESC)

**Location**: `src/app/api/programs/templates/route.ts`

### 2. POST /api/programs/create-from-template
**Purpose**: Clone a template into a user's CustomTrainingProgram

**Authentication**: Required

**Request Body**:
```typescript
{
  templateId: string; // CUID of ProgramTemplate
  customName?: string; // Optional custom program name
}
```

**Validation**: Zod schema validates CUID format and name length (1-100 chars)

**Process** (executed in Prisma transaction):
1. **Tier Limit Check**:
   - Counts user's existing `customTrainingPrograms`
   - FREE plan: limit of 2 programs
   - PRO plan: unlimited (-1)
   - Returns 403 error if limit reached

2. **Template Validation**:
   - Checks template exists
   - Checks template is active (`isActive: true`)
   - Returns 404 if not found, 400 if inactive

3. **Program Creation**:
   - Creates `CustomTrainingProgram` with:
     - `userId`: Current user
     - `name`: customName or template name
     - `description`: Template description
     - `splitId`, `structureId`, `workoutStructureType`: Copied from template
     - `status`: 'ACTIVE'

4. **Workout Cloning**:
   - For each `TemplateWorkout`:
     - Creates new `Workout` linked to program
     - Preserves: name, type, assignedDays
     - **Note**: `order` field removed from Workout model

5. **Exercise Cloning**:
   - For each `TemplateExercise` in each workout:
     - Creates new `WorkoutExercise` linked to workout
     - Preserves: exerciseId, sets, reps, isUnilateral, order

6. **Popularity Increment**:
   - Increments `template.popularity` by 1

7. **Return**:
   - Fetches created program with full details:
     - trainingSplit, splitStructure
     - workouts with exercises (ordered by `order`)
     - exercise details (name, type, muscles)
     - workout count

**Success Response** (201):
```typescript
{
  success: true;
  program: CustomTrainingProgram; // With full relations
  message: "Program created successfully from template";
}
```

**Error Responses**:
- **401**: Authentication required
- **403**: Tier limit reached (includes `requiresUpgrade: true`)
- **404**: Template not found or user not found
- **400**: Template inactive or validation failed
- **500**: Internal server error

**Tier Limit Error Structure**:
```typescript
{
  error: 'Program limit reached';
  message: 'You have reached the limit of 2 program(s)...';
  requiresUpgrade: true;
  currentPlan: 'FREE';
  currentCount: 2;
  limit: 2;
}
```

**Location**: `src/app/api/programs/create-from-template/route.ts`

## User Flow

### Complete User Journey

1. **Navigate to Create Program**:
   - User clicks "Create Program" from programs page
   - Lands on `/programs/create` page

2. **Choose Creation Method**:
   - Sees two cards: "Use Template" and "Start from Scratch"
   - Clicks "Use Template" → Opens UserTemplateSelector modal

3. **Browse Templates**:
   - Views all active templates as cards
   - Can filter by difficulty and split type
   - Can search by name/description
   - Can sort by popularity or name
   - Sees usage stats and workout count

4. **Select Template**:
   - Clicks "Use Template" button on desired card
   - Confirmation modal opens

5. **Customize Name** (Optional):
   - Can enter custom program name
   - Can leave empty to use template name
   - Sees explanation of what will happen

6. **Create Program**:
   - Clicks "Create Program" button
   - API clones template with all workouts/exercises
   - If tier limit reached: shows upgrade prompt
   - If successful: shows success toast

7. **Redirect**:
   - Automatically redirects to `/programs/{programId}/build`
   - User can now customize their cloned program

8. **Post-Creation**:
   - Program appears in user's program list
   - Template's popularity counter incremented
   - User can modify workouts/exercises independently

## Tier Limits

### FREE Plan
- **Limit**: 2 custom programs
- **Behavior**: 
  - Can create up to 2 programs from templates
  - Third attempt shows upgrade prompt
  - Prompt includes direct link to pricing page

### PRO Plan
- **Limit**: Unlimited (-1)
- **Behavior**: No restrictions on program creation

### Enforcement
- Checked in `POST /api/programs/create-from-template`
- Uses `PLAN_LIMITS[user.plan].customPrograms`
- Returns 403 with `requiresUpgrade: true` flag

## Error Handling

### User-Facing Errors

1. **Network Errors**:
   - Shows toast: "Failed to load templates. Please try again."
   - User can retry by reopening modal

2. **Tier Limit Errors**:
   - Shows toast with upgrade button
   - Button links directly to pricing page
   - Includes clear message about limit

3. **Template Inactive**:
   - Shows toast: "This template is no longer available"
   - Automatically refetches template list

4. **Empty Results**:
   - Shows "No templates found" message
   - Suggests adjusting filters

### Developer Errors

1. **Missing Template**:
   - 404 error with clear message
   - Logged to console for debugging

2. **Validation Errors**:
   - Zod validation shows detailed error messages
   - Returns 400 with error details

3. **Transaction Failures**:
   - All changes rolled back automatically
   - Returns 500 with generic error
   - Detailed error logged server-side

## Database Transactions

### Why Transactions?
Creating a program from a template involves multiple database operations:
1. Create CustomTrainingProgram
2. Create multiple Workouts
3. Create multiple WorkoutExercises
4. Increment template popularity

If any step fails, all changes must be rolled back to maintain data consistency.

### Implementation
```typescript
await prisma.$transaction(async (tx) => {
  const program = await tx.customTrainingProgram.create(...);
  
  for (const templateWorkout of template.templateWorkouts) {
    const workout = await tx.workout.create(...);
    
    for (const templateExercise of templateWorkout.templateExercises) {
      await tx.workoutExercise.create(...);
    }
  }
  
  await tx.programTemplate.update(...);
  
  return await tx.customTrainingProgram.findUnique(...);
});
```

### Failure Scenarios
- **Duplicate workout names**: Continues (names don't need to be unique)
- **Invalid exercise ID**: Transaction fails, all rolled back
- **User deletes account mid-creation**: Transaction fails (foreign key constraint)
- **Template deleted mid-creation**: Transaction fails (template not found)

## Performance Considerations

### Template Fetching
- All templates fetched at once (reasonable for < 100 templates)
- Filtering/sorting done client-side for instant feedback
- Future optimization: Server-side pagination if > 100 templates

### Program Cloning
- Transaction ensures atomic operation
- Multiple INSERT operations wrapped in single transaction
- Typical template: 6 workouts × 8 exercises = 48 inserts + program + popularity
- ~50 database operations in < 500ms

### Optimization Opportunities
1. **Batch inserts**: Use `createMany()` for exercises (requires Prisma 4.8+)
2. **Background jobs**: Queue popularity increment (non-critical)
3. **Caching**: Cache template list on client for 5 minutes

## Testing Checklist

### Manual Testing

**Template Browsing**:
- [ ] All active templates display
- [ ] Difficulty filter works correctly
- [ ] Split type filter updates dynamically
- [ ] Search filters by name, description, audience
- [ ] Sorting by popularity shows highest first
- [ ] Usage count displays correctly

**Template Selection**:
- [ ] Clicking "Use Template" opens confirmation modal
- [ ] Template details display correctly
- [ ] Custom name input works
- [ ] Leaving name empty uses template name
- [ ] Cancel button closes modal

**Program Creation**:
- [ ] Success creates program with all workouts
- [ ] Workouts have correct exercises
- [ ] Exercise order preserved
- [ ] Sets/reps/unilateral copied correctly
- [ ] Redirects to build page
- [ ] Success toast shows correct program name

**Tier Limits**:
- [ ] FREE user can create 2 programs
- [ ] Third attempt shows upgrade prompt
- [ ] Upgrade button links to pricing
- [ ] PRO user has no limit

**Error Handling**:
- [ ] Inactive template shows error
- [ ] Deleted template shows error
- [ ] Network error shows retry option
- [ ] Empty search shows "no results" message

### Database Verification

**After Creating Program**:
```sql
-- Check program created
SELECT * FROM "CustomTrainingProgram" WHERE id = '{programId}';

-- Check workouts cloned (should match template count)
SELECT COUNT(*) FROM "Workout" WHERE "programId" = '{programId}';

-- Check exercises cloned
SELECT COUNT(*) FROM "WorkoutExercise" w
JOIN "Workout" wo ON w."workoutId" = wo.id
WHERE wo."programId" = '{programId}';

-- Check popularity incremented
SELECT popularity FROM "ProgramTemplate" WHERE id = '{templateId}';
```

### API Testing

**Test Template Fetching**:
```bash
curl -X GET http://localhost:3000/api/programs/templates \
  -H "Authorization: Bearer {token}"
```

**Test Program Creation**:
```bash
curl -X POST http://localhost:3000/api/programs/create-from-template \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{"templateId": "clx...", "customName": "My Custom Program"}'
```

**Test Tier Limit**:
```bash
# Create 3 programs as FREE user (3rd should fail)
for i in {1..3}; do
  curl -X POST http://localhost:3000/api/programs/create-from-template \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer {token}" \
    -d "{\"templateId\": \"clx...\", \"customName\": \"Program $i\"}"
done
```

## Security Considerations

### Authentication
- All endpoints require authenticated user
- No guest access to templates or creation
- User ID extracted from Supabase session

### Authorization
- Users can only create programs for themselves
- Cannot specify different userId in request
- Admin templates are read-only for users

### Data Validation
- Template ID validated as CUID format
- Custom name length limited to 100 chars
- SQL injection prevented by Prisma parameterization

### Rate Limiting
- Tier limits prevent abuse:
  - FREE: 2 programs max
  - PRO: Unlimited
- Future: Add daily creation limit (e.g., 10/day)

### Template Tampering
- Template ID validated before cloning
- Active status checked to prevent using deleted templates
- Transaction ensures atomic operation

## Future Enhancements

### Priority 1: User Experience
1. **Template Preview**:
   - Show full workout breakdown before creation
   - Display exercise list with sets/reps
   - Visual calendar showing workout schedule

2. **Template Ratings**:
   - Allow users to rate templates
   - Show average rating on cards
   - Sort by "Highest Rated"

3. **Template Categories**:
   - Group by goal (Strength, Hypertrophy, Cut, etc.)
   - Filter by category
   - Show popular templates per category

### Priority 2: Performance
1. **Pagination**:
   - Server-side pagination for > 100 templates
   - Infinite scroll on template selector
   - Reduce initial load time

2. **Caching**:
   - Cache template list on client (5 min)
   - Cache popular templates on server (Redis)
   - Stale-while-revalidate strategy

3. **Batch Operations**:
   - Use `createMany()` for exercises
   - Reduce transaction time by 50%

### Priority 3: Analytics
1. **Usage Tracking**:
   - Track which templates are most cloned
   - Identify unused templates
   - Show "trending" badge on popular templates

2. **Conversion Metrics**:
   - Track template → program completion rate
   - Identify templates with high abandonment
   - A/B test template descriptions

3. **Admin Dashboard**:
   - Show template performance metrics
   - Identify templates needing updates
   - Display user feedback

## Troubleshooting

### Common Issues

**Issue**: Templates not loading
- **Cause**: API endpoint returns 401
- **Solution**: Check user authentication, refresh session

**Issue**: "Program limit reached" for PRO user
- **Cause**: User plan not synced correctly
- **Solution**: Check `user.plan` field in database, verify subscription

**Issue**: Workouts not cloned
- **Cause**: Template has no templateWorkouts
- **Solution**: Verify template has workouts in admin panel

**Issue**: Exercise order incorrect
- **Cause**: Missing `order` field in WorkoutExercise
- **Solution**: Ensure `order` preserved during cloning

**Issue**: Transaction timeout
- **Cause**: Template has too many exercises (>100)
- **Solution**: Increase `maxDuration` in route config

### Debug Commands

**Check Template Structure**:
```typescript
const template = await prisma.programTemplate.findUnique({
  where: { id: 'templateId' },
  include: {
    templateWorkouts: {
      include: {
        templateExercises: true
      }
    }
  }
});
console.log(JSON.stringify(template, null, 2));
```

**Check User Tier Limits**:
```typescript
const user = await prisma.user.findUnique({
  where: { id: 'userId' },
  select: {
    plan: true,
    _count: {
      select: {
        customTrainingPrograms: true
      }
    }
  }
});
console.log('Plan:', user.plan);
console.log('Programs:', user._count.customTrainingPrograms);
console.log('Limit:', PLAN_LIMITS[user.plan].customPrograms);
```

**Verify Program Cloning**:
```typescript
const program = await prisma.customTrainingProgram.findUnique({
  where: { id: 'programId' },
  include: {
    workouts: {
      include: {
        exercises: {
          include: {
            exercise: true
          }
        }
      }
    }
  }
});
console.log('Workouts:', program.workouts.length);
console.log('Total exercises:', program.workouts.reduce((sum, w) => sum + w.exercises.length, 0));
```

## Change Log

### Version 1.0.0 (2025-11-05)
- Initial implementation of template-based program creation
- Created UserTemplateSelector component with filters and search
- Implemented POST /api/programs/create-from-template
- Implemented GET /api/programs/templates
- Added tier limit enforcement (FREE: 2, PRO: unlimited)
- Integrated with program creation page
- Added transaction-based cloning
- Implemented popularity counter
- Added comprehensive error handling
- Created documentation

### Key Files Created
1. `src/components/UserTemplateSelector.tsx` (523 lines)
2. `src/app/api/programs/create-from-template/route.ts` (191 lines)
3. `src/app/api/programs/templates/route.ts` (60 lines)
4. `docs/USER_TEMPLATE_PROGRAM_CREATION.md` (this file)

### Key Files Modified
1. `src/app/[locale]/programs/create/page.tsx` - Added creation mode selection

## Related Documentation
- [Admin Template Management](./ADMIN_TEMPLATE_MANAGEMENT.md)
- [Subscription Tiers](./SUBSCRIPTION_TIERS.md)
- [Program Builder](./PROGRAM_BUILDER.md)
