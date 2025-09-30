-- Migration: Replace muscleGroup with exerciseType and volumeContributions
-- This script handles the transition from single muscle group to exercise type + volume contributions

-- Step 1: Add new fields with defaults
ALTER TABLE "Exercise" 
  ADD COLUMN IF NOT EXISTS "exerciseType" TEXT DEFAULT 'COMPOUND',
  ALTER COLUMN "volumeContributions" SET DEFAULT '{}';

-- Step 2: Update NULL volumeContributions to empty objects
UPDATE "Exercise" 
SET "volumeContributions" = '{}' 
WHERE "volumeContributions" IS NULL;

-- Step 3: Create the ExerciseType enum if it doesn't exist
-- Note: ExerciseType enum already exists in schema with COMPOUND, ISOLATION, UNILATERAL

-- Step 4: Update exerciseType column to use the enum
ALTER TABLE "Exercise" 
  ALTER COLUMN "exerciseType" TYPE "ExerciseType" USING "exerciseType"::"ExerciseType";

-- Step 5: Drop the muscleGroup column
ALTER TABLE "Exercise" 
  DROP COLUMN IF EXISTS "muscleGroup";

-- Step 6: Drop the old enum values (BACK, SHOULDERS, BICEPS, FOREARMS)
-- This requires recreating the enum without those values
-- First, create a new enum with only the values we want
DO $$ 
BEGIN
  -- Create temporary enum
  CREATE TYPE "ExerciseMuscleGroup_new" AS ENUM (
    'CHEST',
    'LATS',
    'TRAPEZIUS',
    'RHOMBOIDS',
    'FRONT_DELTS',
    'SIDE_DELTS',
    'REAR_DELTS',
    'ELBOW_FLEXORS',
    'TRICEPS',
    'WRIST_FLEXORS',
    'WRIST_EXTENSORS',
    'ABS',
    'GLUTES',
    'QUADRICEPS',
    'HAMSTRINGS',
    'ADDUCTORS',
    'CALVES'
  );

  -- Since no columns use ExerciseMuscleGroup anymore, we can drop and recreate
  DROP TYPE IF EXISTS "ExerciseMuscleGroup" CASCADE;
  
  -- Rename the new enum to the original name
  ALTER TYPE "ExerciseMuscleGroup_new" RENAME TO "ExerciseMuscleGroup";
  
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'ExerciseMuscleGroup enum update failed or already updated: %', SQLERRM;
END $$;

-- Step 7: Update indexes
DROP INDEX IF EXISTS "Exercise_muscleGroup_category_idx";
DROP INDEX IF EXISTS "Exercise_muscleGroup_idx";

CREATE INDEX IF NOT EXISTS "Exercise_exerciseType_category_idx" ON "Exercise"("exerciseType", "category");
CREATE INDEX IF NOT EXISTS "Exercise_exerciseType_idx" ON "Exercise"("exerciseType");

COMMENT ON COLUMN "Exercise"."exerciseType" IS 'Type of exercise: COMPOUND (multi-joint), ISOLATION (single-joint), or UNILATERAL (one-sided)';
COMMENT ON COLUMN "Exercise"."volumeContributions" IS 'JSON object mapping muscle groups to volume contribution (1.0 = direct/primary, 0.5 = indirect/secondary)';
