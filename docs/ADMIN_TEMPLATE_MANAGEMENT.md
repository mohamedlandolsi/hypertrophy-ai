# Admin Template Management System

## Overview

This document describes the admin template management system refactoring completed on November 5, 2025. The system was refactored from managing "training programs as products" to managing "program templates for users to clone."

**Purpose**: Provide admins with a dedicated interface to create and manage reusable workout program templates that users can instantiate and customize.

**Key Change**: Transitioned from `TrainingProgram` (product-focused) to `ProgramTemplate` (template-focused) management.

---

## Architecture

### Database Schema

The template management system uses three main models:

1. **ProgramTemplate** - Reusable program blueprints
2. **TemplateWorkout** - Workouts within templates
3. **TemplateExercise** - Exercises within template workouts

#### ProgramTemplate Model

```prisma
model ProgramTemplate {
  id                     String               @id @default(cuid())
  name                   String               @unique
  description            String
  difficultyLevel        String               // 'BEGINNER', 'INTERMEDIATE', 'ADVANCED'
  splitId                String
  structureId            String
  workoutStructureType   WorkoutStructureType // REPEATING, AB, ABC
  estimatedDurationWeeks Int
  targetAudience         String
  popularity             Int                  @default(0)
  isActive               Boolean              @default(true)
  thumbnailUrl           String?
  createdAt              DateTime             @default(now())
  updatedAt              DateTime             @updatedAt

  // Relations
  trainingSplit    TrainingSplit          @relation(fields: [splitId], references: [id])
  splitStructure   TrainingSplitStructure @relation(fields: [structureId], references: [id])
  templateWorkouts TemplateWorkout[]
  trainingPrograms TrainingProgram[]      // User programs created from this template
}
```

**Key Fields**:
- `name`: Unique template identifier
- `difficultyLevel`: BEGINNER | INTERMEDIATE | ADVANCED
- `workoutStructureType`: REPEATING | AB | ABC (from WorkoutStructureType enum)
- `estimatedDurationWeeks`: Program duration (1-52 weeks)
- `targetAudience`: Free-form text describing ideal users
- `popularity`: Auto-incremented count of times template has been used
- `isActive`: Whether template is available for users

---

## Components

### 1. Admin Templates Page (`src/app/[locale]/admin/programs/page.tsx`)

**Path**: `/admin/programs` (unchanged for routing continuity)

**Purpose**: Main dashboard for viewing and managing all templates.

**Features**:
- **Header**: "Program Templates" with "Create and manage workout templates" subtitle
- **Stats Cards**:
  - Total Templates: Count of all templates
  - Active Templates: Count of templates with `isActive = true`
  - Times Used: Sum of all `trainingPrograms` count across templates
- **Templates Table**: Displays all templates with inline editing/deletion

**Data Fetching**:
```typescript
const templates = await prisma.programTemplate.findMany({
  include: {
    trainingSplit: { select: { id: true, name: true } },
    splitStructure: { select: { id: true, pattern: true, daysPerWeek: true } },
    _count: {
      select: {
        trainingPrograms: true, // Times used
        templateWorkouts: true,
      },
    },
  },
  orderBy: { createdAt: 'desc' },
});
```

**Auth Requirements**:
- Must be authenticated (Supabase Auth)
- Must have `role = 'admin'` in User table

---

### 2. Templates Table Component (`src/components/admin/templates-table.tsx`)

**Purpose**: Client-side table component for displaying templates with actions.

**Columns**:
1. **Template Name**: Name, description, and target audience
2. **Split Type**: Training split name + workout structure type badge
3. **Difficulty**: Badge (Beginner/Intermediate/Advanced)
4. **Duration**: Estimated weeks
5. **Workouts**: Count of template workouts
6. **Times Used**: Count of user programs created from template
7. **Status**: Active/Inactive toggle + badge
8. **Actions**: Dropdown menu with options

**Actions Menu**:
- **View Details**: Navigate to `/admin/templates/{id}`
- **View Analytics**: Navigate to `/admin/templates/{id}/analytics`
- **Edit Template**: Navigate to `/admin/templates/{id}/edit`
- **Delete Template**: Opens confirmation dialog (disabled if `_count.trainingPrograms > 0`)

**Delete Protection**:
Templates cannot be deleted if they have been used by any users. The system displays:
- Disabled delete button
- Tooltip: "Cannot delete: X user(s) using this"
- Suggestion to deactivate instead

**UI Features**:
- Empty state with "Create New Template" button
- Loading skeletons during data fetch
- Toast notifications for actions (success/error)
- Responsive design (mobile-first)

---

## Server Actions

### File: `src/app/api/admin/templates/actions.ts`

All template operations are server actions with admin authentication checks.

#### 1. `createProgramTemplate(formData)`

Creates a new program template.

**Parameters**:
```typescript
{
  name: string;
  description: string;
  difficultyLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  splitId: string;
  structureId: string;
  workoutStructureType: 'REPEATING' | 'AB' | 'ABC';
  estimatedDurationWeeks: number;
  targetAudience: string;
  thumbnailUrl?: string;
  isActive?: boolean;
}
```

**Validation**:
- All fields validated with Zod schema
- `splitId` must exist in `TrainingSplit` table
- `structureId` must exist in `TrainingSplitStructure` table
- `estimatedDurationWeeks`: 1-52 weeks

**Returns**:
```typescript
{
  success: boolean;
  data?: ProgramTemplate;
  message?: string;
  error?: string;
}
```

---

#### 2. `updateProgramTemplate(formData)`

Updates an existing template (partial updates supported).

**Parameters**:
```typescript
{
  id: string; // Required
  // All other fields from createProgramTemplate are optional
}
```

**Validation**:
- Template must exist
- If updating `splitId` or `structureId`, validates they exist
- Partial updates: only provided fields are modified

---

#### 3. `deleteProgramTemplate(templateId)`

Deletes a template (with usage protection).

**Parameters**:
- `templateId: string`

**Protection**:
- Checks if template has any `trainingPrograms` referencing it
- Throws error if `trainingPrograms.length > 0`
- Error message: "Cannot delete template with X active user program(s). Consider deactivating instead."

**Cascade Behavior**:
- Deletes all `TemplateWorkout` records (via `onDelete: Cascade`)
- Deletes all `TemplateExercise` records (via cascade through `TemplateWorkout`)

---

#### 4. `toggleTemplateStatus(templateId, currentStatus)`

Toggles `isActive` field between `true` and `false`.

**Parameters**:
- `templateId: string`
- `currentStatus: boolean`

**Returns**:
- Success message: "Program template activated/deactivated successfully"

---

#### 5. `getProgramTemplates(includeInactive?)`

Retrieves all templates with detailed relations.

**Parameters**:
- `includeInactive?: boolean` (default: `false`)

**Returns**:
```typescript
{
  success: boolean;
  data?: ProgramTemplateWithRelations[];
  error?: string;
}
```

**Includes**:
- `trainingSplit`: Split details
- `splitStructure`: Structure details
- `templateWorkouts`: All workouts with exercises
- `_count.trainingPrograms`: Times used
- `_count.templateWorkouts`: Workout count

---

#### 6. `getProgramTemplate(templateId)`

Retrieves a single template with full details.

**Returns**: Same as `getProgramTemplates` but for single template.

**Additional Includes**:
- `trainingPrograms`: Recent 10 user programs created from template (userId, createdAt)

---

#### 7. `getTemplateStats()`

Retrieves system-wide template statistics.

**Returns**:
```typescript
{
  success: boolean;
  data?: {
    totalTemplates: number;
    activeTemplates: number;
    totalTimesUsed: number;
    popularTemplates: ProgramTemplate[]; // Top 5 by popularity
  };
}
```

---

## API Routes

### Analytics Endpoint

**Path**: `GET /api/admin/templates/[id]/analytics`

**File**: `src/app/api/admin/templates/[id]/analytics/route.ts`

**Purpose**: Detailed usage analytics for a specific template.

**Auth**: Admin only (same as server actions)

**Response**:
```typescript
{
  template: {
    id: string;
    name: string;
    description: string;
    difficultyLevel: string;
    isActive: boolean;
    popularity: number;
    createdAt: Date;
    updatedAt: Date;
  };
  split: TrainingSplit | null;
  structure: TrainingSplitStructure | null;
  usage: {
    totalUsage: number; // Total programs created
    uniqueUsers: number; // Unique userIds
    usageByMonth: Array<{ month: string; count: number }>; // Time series
  };
  workouts: {
    totalWorkouts: number;
    avgExercisesPerWorkout: number;
    workoutBreakdown: Array<{
      workoutId: string;
      workoutName: string;
      exerciseCount: number;
    }>;
  };
  recentActivity: {
    recentUsage: Array<{
      programId: string;
      userId: string | null;
      createdAt: Date;
    }>; // Last 10 uses
    lastUsed: Date | null;
  };
  metrics: {
    conversionRate: string; // Placeholder
    avgWorkoutsPerTemplate: number;
    retentionRate: string; // Placeholder
  };
}
```

**Usage Example**:
```typescript
// In an analytics page component
const response = await fetch(`/api/admin/templates/${templateId}/analytics`);
const analytics = await response.json();
console.log(`Template used ${analytics.usage.totalUsage} times by ${analytics.usage.uniqueUsers} unique users`);
```

---

## Key Differences from Old System

| Aspect | Old System (Programs) | New System (Templates) |
|--------|----------------------|------------------------|
| **Purpose** | Sell programs as products | Provide reusable templates |
| **Pricing** | Price field (TND/USD) | No pricing |
| **LemonSqueezy** | Full integration | Removed |
| **Purchases** | UserPurchase tracking | Usage tracking (trainingPrograms count) |
| **Guides** | ProgramGuide relation | No guides (templates are blueprints) |
| **Target Users** | Buyers | All users (clone & customize) |
| **Stats Cards** | Total Purchases | Times Used |
| **Table Columns** | Price, Purchases, Guide | Difficulty, Times Used, Target Audience |
| **Actions** | Purchase-focused | Template management focused |

---

## Usage Patterns

### Creating a Template (Admin Flow)

1. Navigate to `/admin/programs`
2. Click "Create New Template"
3. Fill form:
   - Name: "Beginner Upper/Lower Split"
   - Description: "4-day upper/lower split for beginners"
   - Difficulty: BEGINNER
   - Split: Select from dropdown (e.g., "Upper/Lower")
   - Structure: Select from dropdown
   - Structure Type: REPEATING
   - Duration: 12 weeks
   - Target Audience: "Beginners with 3-6 months experience"
   - Thumbnail: Upload image URL
4. Submit → Template created with `popularity = 0`, `isActive = true`

### User Cloning a Template

When a user creates a program from a template:

```typescript
// In user program creation API route
const userProgram = await prisma.trainingProgram.create({
  data: {
    templateId: selectedTemplateId, // References ProgramTemplate
    userId: currentUserId,
    name: { en: "My Custom Program", ar: "...", fr: "..." },
    // ... other fields
  },
});

// Optionally increment popularity
await prisma.programTemplate.update({
  where: { id: selectedTemplateId },
  data: { popularity: { increment: 1 } },
});
```

### Viewing Analytics

Admins can track template performance:

1. Navigate to `/admin/programs`
2. Click Actions → "View Analytics" on any template
3. See:
   - Total usage count
   - Unique users count
   - Usage trends over time (monthly chart)
   - Average workout/exercise metrics
   - Recent activity log

---

## Migration Notes

### Backward Compatibility

- **Route Unchanged**: `/admin/programs` still works (page renamed but path same)
- **Old TrainingProgram**: Remains intact for existing products
- **New Templates**: Use separate `ProgramTemplate` model

### Coexistence Strategy

Both systems coexist:
- **TrainingProgram**: Old product-based programs (kept for legacy support)
- **ProgramTemplate**: New template-based programs (admin managed)

Users can:
- Still purchase old programs (via `lemonSqueezyId`)
- Clone new templates (via `templateId` reference)

---

## Security Considerations

### Admin Authentication

All template operations require:
1. Valid Supabase session (`await supabase.auth.getUser()`)
2. User role check: `user.role === 'admin'` in database

Example:
```typescript
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();
if (!user) throw new Error('Authentication required');

const dbUser = await prisma.user.findUnique({
  where: { id: user.id },
  select: { role: true }
});
if (!dbUser || dbUser.role !== 'admin') {
  throw new Error('Admin access required');
}
```

### Input Validation

- All inputs validated with Zod schemas
- Foreign key checks (splitId, structureId must exist)
- String lengths validated
- Enums strictly enforced (`WorkoutStructureType`)

### Deletion Protection

- Templates with usage cannot be deleted
- System checks `_count.trainingPrograms > 0`
- Cascade deletes handled by database constraints

---

## Testing Checklist

### Manual Testing

- [ ] Admin can view templates page (`/admin/programs`)
- [ ] Stats cards display correct counts
- [ ] Templates table loads with data
- [ ] Create new template form validation works
- [ ] Editing template updates fields correctly
- [ ] Toggle status changes `isActive` field
- [ ] Delete protection prevents deletion of used templates
- [ ] Analytics page shows usage data
- [ ] Empty state displays when no templates exist
- [ ] Mobile responsive (table scrolls horizontally)

### Database Testing

- [ ] `ProgramTemplate` created with correct defaults
- [ ] `popularity` increments when user creates program
- [ ] Cascade delete removes `TemplateWorkout` and `TemplateExercise`
- [ ] Foreign key constraints prevent orphaned records
- [ ] `isActive` filter works in queries

### API Testing

```bash
# Get all templates
GET /api/admin/templates
Authorization: Bearer <admin-token>

# Get template analytics
GET /api/admin/templates/{templateId}/analytics
Authorization: Bearer <admin-token>

# Create template (via server action)
# Call createProgramTemplate() from admin UI

# Delete template (via server action)
# Call deleteProgramTemplate() from admin UI
```

---

## Future Enhancements

### Planned Features

1. **Template Preview**: Visual preview of workouts before cloning
2. **Template Versioning**: Track changes over time
3. **Template Categories**: Group templates by goal (strength, hypertrophy, endurance)
4. **Template Ratings**: Users can rate templates
5. **Template Cloning**: Admin can duplicate templates for variations
6. **Workout Builder**: Drag-and-drop workout creation interface
7. **Exercise Library Integration**: Browse and add exercises from library
8. **Template Recommendations**: AI suggests templates based on user profile

### Analytics Enhancements

1. **User Retention**: Track how long users stick with template-based programs
2. **Completion Rate**: Percentage of users who finish template programs
3. **Customization Patterns**: Common modifications users make
4. **Success Metrics**: Correlation with user-reported progress

---

## Related Documentation

- `PROGRAM_TEMPLATE_SEPARATION.md`: Prisma schema refactoring details
- `prisma/schema.prisma`: Database schema source of truth
- `scripts/README.md`: Utility scripts for testing templates

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-11-05 | Initial refactoring from programs to templates | System |
| 2025-11-05 | Added analytics endpoint | System |
| 2025-11-05 | Implemented delete protection | System |

---

## Support

For issues or questions about template management:
1. Check this documentation
2. Review `PROGRAM_TEMPLATE_SEPARATION.md` for schema details
3. Inspect Prisma schema (`prisma/schema.prisma`)
4. Test with debug scripts (`scripts/debug-*.js`)
