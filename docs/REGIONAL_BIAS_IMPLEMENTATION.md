# Regional Bias Feature Implementation

## Overview
Added support for specifying regional/specific muscle bias in exercises where a muscle group has 1.0 (primary) volume contribution. This allows for more precise exercise categorization for training program customization.

## Implementation Date
September 30, 2025

## Changes Made

### 1. Database Schema (`prisma/schema.prisma`)
```prisma
model Exercise {
  // ... existing fields ...
  volumeContributions Json? @default("{}")
  // NEW: Regional bias for muscles with 1.0 volume contribution
  regionalBias Json? @default("{}")
  createdAt DateTime @default(now())
  updatedAt DateTime
}
```

**Field Description:**
- `regionalBias`: JSON object mapping muscle groups to their specific regional emphasis
- Format: `{ "CHEST": "UPPER_CHEST", "QUADRICEPS": "RECTUS_FEMORIS" }`
- Only applicable when corresponding muscle in `volumeContributions` is set to 1.0
- Optional field with default empty object `{}`

### 2. Admin UI Component (`src/components/admin/exercise-management.tsx`)

**New Constants:**
```typescript
const MUSCLE_REGIONAL_BIAS: Record<string, Array<{ value: string; label: string }>> = {
  CHEST: [
    { value: 'UPPER_CHEST', label: 'Upper Chest' },
    { value: 'MIDDLE_CHEST', label: 'Middle Chest' },
    { value: 'LOWER_CHEST', label: 'Lower Chest' },
  ],
  LATS: [
    { value: 'UPPER_LATS', label: 'Upper Lats' },
    { value: 'MIDDLE_LATS', label: 'Middle Lats' },
    { value: 'LOWER_LATS', label: 'Lower Lats' },
  ],
  ELBOW_FLEXORS: [
    { value: 'BICEPS', label: 'Biceps' },
    { value: 'BRACHIALIS', label: 'Brachialis' },
    { value: 'BRACHIORADIALIS', label: 'Brachioradialis' },
  ],
  TRICEPS: [
    { value: 'TRICEPS_LONG_HEAD', label: 'Long Head' },
    { value: 'TRICEPS_MEDIAL_LATERAL', label: 'Medial & Lateral Heads' },
  ],
  GLUTES: [
    { value: 'GLUTEUS_MAXIMUS', label: 'Gluteus Maximus' },
    { value: 'GLUTEUS_MEDIUS', label: 'Gluteus Medius' },
    { value: 'GLUTEUS_MINIMUS', label: 'Gluteus Minimus' },
  ],
  QUADRICEPS: [
    { value: 'RECTUS_FEMORIS', label: 'Rectus Femoris' },
    { value: 'VASTUS_HEADS', label: 'Vastus Heads (Lateralis, Medialis, Intermedius)' },
  ],
  ADDUCTORS: [
    { value: 'ADDUCTOR_LONGUS', label: 'Adductor Longus' },
    { value: 'ADDUCTOR_BREVIS', label: 'Adductor Brevis' },
    { value: 'ADDUCTOR_MAGNUS', label: 'Adductor Magnus' },
    { value: 'GRACILIS', label: 'Gracilis' },
    { value: 'PECTINEUS', label: 'Pectineus' },
  ],
};
```

**UI Enhancement:**
- Regional bias dropdown appears dynamically when a muscle is set to 1.0 volume contribution
- Dropdown is placed directly below the volume contribution selector for that muscle
- Labeled as "Select region/bias (optional)"
- Includes "No specific bias" option
- Auto-clears when volume is changed from 1.0 to any other value

**Helper Functions:**
```typescript
const updateRegionalBias = (muscle: string, region: string) => {
  const newBias = { ...formData.regionalBias };
  if (region === '' || region === 'NONE') {
    delete newBias[muscle];
  } else {
    newBias[muscle] = region;
  }
  setFormData({ ...formData, regionalBias: newBias });
};

const getRegionalBias = (muscle: string) => {
  return formData.regionalBias[muscle] || 'NONE';
};
```

**Note:** The special value `'NONE'` is used instead of an empty string to comply with React Select component requirements that prohibit empty string values.

### 3. API Routes Updated

**POST `/api/admin/exercises/route.ts`:**
- Added `regionalBias` to request body extraction
- Stores `regionalBias` in database on exercise creation

**PUT `/api/admin/exercises/[id]/route.ts`:**
- Added `regionalBias` to request body extraction
- Updates `regionalBias` in database on exercise update

### 4. Migration Applied

**File:** `add-regional-bias-migration.sql`
```sql
ALTER TABLE "Exercise" 
ADD COLUMN IF NOT EXISTS "regionalBias" JSONB DEFAULT '{}'::JSONB;

UPDATE "Exercise" 
SET "regionalBias" = '{}'::JSONB 
WHERE "regionalBias" IS NULL;
```

**Execution:** Successfully applied via `apply-regional-bias-migration.js`
- All 52 existing exercises updated with empty `regionalBias` object
- Column type: `jsonb`
- Default value: `'{}'::jsonb`

## Supported Regional Biases

### Chest
- **Upper Chest** (`UPPER_CHEST`): Incline exercises (e.g., Incline Bench Press)
- **Middle Chest** (`MIDDLE_CHEST`): Flat exercises (e.g., Flat Bench Press)
- **Lower Chest** (`LOWER_CHEST`): Decline exercises (e.g., Decline Press, Dips)

### Lats
- **Upper Lats** (`UPPER_LATS`): Wide-grip pulldowns/pull-ups
- **Middle Lats** (`MIDDLE_LATS`): Standard rows
- **Lower Lats** (`LOWER_LATS`): Narrow-grip pulldowns, straight-arm pulldowns

### Elbow Flexors (Biceps Group)
- **Biceps** (`BICEPS`): Standard curls with supination
- **Brachialis** (`BRACHIALIS`): Hammer curls, reverse curls
- **Brachioradialis** (`BRACHIORADIALIS`): Reverse curls, hammer curls

### Triceps
- **Long Head** (`TRICEPS_LONG_HEAD`): Overhead extensions
- **Medial & Lateral Heads** (`TRICEPS_MEDIAL_LATERAL`): Pushdowns, close-grip pressing

### Glutes
- **Gluteus Maximus** (`GLUTEUS_MAXIMUS`): Hip extension exercises (deadlifts, hip thrusts)
- **Gluteus Medius** (`GLUTEUS_MEDIUS`): Hip abduction exercises (lateral raises, abduction)
- **Gluteus Minimus** (`GLUTEUS_MINIMUS`): Hip abduction with rotation

### Quadriceps
- **Rectus Femoris** (`RECTUS_FEMORIS`): Exercises with hip flexion (leg extensions, sissy squats)
- **Vastus Heads** (`VASTUS_HEADS`): Squats, leg press (targets vastus lateralis, medialis, intermedius)

### Adductors
- **Adductor Longus** (`ADDUCTOR_LONGUS`): Primary hip adduction
- **Adductor Brevis** (`ADDUCTOR_BREVIS`): Hip adduction with slight flexion
- **Adductor Magnus** (`ADDUCTOR_MAGNUS`): Hip extension and adduction (posterior fibers)
- **Gracilis** (`GRACILIS`): Hip adduction with knee flexion
- **Pectineus** (`PECTINEUS`): Hip flexion and adduction

## Usage Examples

### Example 1: Incline Bench Press
```json
{
  "name": "Incline Barbell Bench Press",
  "exerciseType": "COMPOUND",
  "volumeContributions": {
    "CHEST": 1.0,
    "FRONT_DELTS": 0.5,
    "TRICEPS": 0.5
  },
  "regionalBias": {
    "CHEST": "UPPER_CHEST"
  }
}
```

### Example 2: Hammer Curl
```json
{
  "name": "Hammer Curl",
  "exerciseType": "ISOLATION",
  "volumeContributions": {
    "ELBOW_FLEXORS": 1.0
  },
  "regionalBias": {
    "ELBOW_FLEXORS": "BRACHIALIS"
  }
}
```

### Example 3: Wide-Grip Lat Pulldown
```json
{
  "name": "Wide-Grip Lat Pulldown",
  "exerciseType": "COMPOUND",
  "volumeContributions": {
    "LATS": 1.0,
    "TRAPEZIUS_RHOMBOIDS": 0.5,
    "ELBOW_FLEXORS": 0.5
  },
  "regionalBias": {
    "LATS": "UPPER_LATS"
  }
}
```

### Example 4: Hip Thrust
```json
{
  "name": "Barbell Hip Thrust",
  "exerciseType": "COMPOUND",
  "volumeContributions": {
    "GLUTES": 1.0,
    "HAMSTRINGS": 0.5
  },
  "regionalBias": {
    "GLUTES": "GLUTEUS_MAXIMUS"
  }
}
```

### Example 5: Overhead Triceps Extension
```json
{
  "name": "Overhead Dumbbell Triceps Extension",
  "exerciseType": "ISOLATION",
  "volumeContributions": {
    "TRICEPS": 1.0
  },
  "regionalBias": {
    "TRICEPS": "TRICEPS_LONG_HEAD"
  }
}
```

## Technical Notes

1. **Conditional Display**: Regional bias selector only appears when volume contribution is exactly 1.0
2. **Auto-Cleanup**: Changing volume from 1.0 to any other value automatically removes the regional bias
3. **Optional Field**: Regional bias is always optional - exercises can have 1.0 volume without specifying region
4. **Database Type**: Uses PostgreSQL's JSONB type for efficient querying
5. **Type Safety**: TypeScript types properly handle the optional regionalBias field

## Future Enhancements

Potential areas for expansion:
1. Add regional bias for additional muscle groups (shoulders, hamstrings, calves)
2. Use regional bias in AI program generation to ensure balanced regional development
3. Create analytics showing regional muscle distribution in user programs
4. Add filter in program customizer to target specific muscle regions
5. Generate reports showing which regions are under/over-trained

## Files Modified

- `prisma/schema.prisma` - Added regionalBias field
- `src/components/admin/exercise-management.tsx` - Added UI for regional bias selection
- `src/app/api/admin/exercises/route.ts` - Added regionalBias to POST endpoint
- `src/app/api/admin/exercises/[id]/route.ts` - Added regionalBias to PUT endpoint
- `add-regional-bias-migration.sql` - Migration SQL script
- `apply-regional-bias-migration.js` - Migration execution script

## Verification

✅ Database migration successful (52 exercises updated)
✅ Build passes with no errors
✅ TypeScript types properly defined
✅ API endpoints accept and store regionalBias
✅ UI conditionally displays regional bias selectors
✅ All muscle groups with regional options mapped

## Admin Instructions

When configuring exercises:

1. Set volume contributions as usual (0, 0.25, 0.5, 0.75, 1.0)
2. When a muscle is set to 1.0, a regional bias dropdown will appear below it
3. Select the specific region/muscle if the exercise biases it (optional)
4. Leave as "No specific bias" if the exercise targets the muscle group evenly
5. The regional bias will automatically clear if you change the volume from 1.0

Example workflow:
- Flat Bench Press: CHEST = 1.0, regional bias = "Middle Chest" (or leave empty)
- Incline Bench Press: CHEST = 1.0, regional bias = "Upper Chest"
- Decline Bench Press: CHEST = 1.0, regional bias = "Lower Chest"
