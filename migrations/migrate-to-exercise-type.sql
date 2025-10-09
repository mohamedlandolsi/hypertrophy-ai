-- ============================================================================
-- Migration: Replace muscleGroup with exerciseType + volumeContributions
-- Date: 2025-09-30
-- Description: Transition from single muscle group to exercise type classification
--              Muscles are now defined via volumeContributions JSON
-- ============================================================================

-- STEP 1: Add exerciseType column with default COMPOUND
-- This allows existing exercises to keep functioning
ALTER TABLE "Exercise" 
ADD COLUMN IF NOT EXISTS "exerciseType" "ExerciseType" DEFAULT 'COMPOUND';

-- STEP 2: Update NULL volumeContributions to empty JSON objects
-- This ensures all exercises have a valid volumeContributions value
UPDATE "Exercise" 
SET "volumeContributions" = '{}'::jsonb 
WHERE "volumeContributions" IS NULL;

-- STEP 3: Drop the muscleGroup column (contains 52 exercises with data)
-- Data will be lost but exercises remain with exerciseType classification
ALTER TABLE "Exercise" 
DROP COLUMN IF EXISTS "muscleGroup";

-- STEP 4: Clean up old indexes that referenced muscleGroup
DROP INDEX IF EXISTS "Exercise_muscleGroup_category_idx";
DROP INDEX IF EXISTS "Exercise_muscleGroup_idx";

-- STEP 5: Create new indexes for exerciseType
CREATE INDEX IF NOT EXISTS "Exercise_exerciseType_idx" 
ON "Exercise"("exerciseType");

CREATE INDEX IF NOT EXISTS "Exercise_exerciseType_category_idx" 
ON "Exercise"("exerciseType", "category");

-- STEP 6: Add comments for documentation
COMMENT ON COLUMN "Exercise"."exerciseType" IS 
'Type of exercise: COMPOUND (multi-joint, multiple muscles), ISOLATION (single-joint, specific muscle), or UNILATERAL (one-sided)';

COMMENT ON COLUMN "Exercise"."volumeContributions" IS 
'JSON object mapping muscle groups to volume contribution. Format: {"CHEST": 1.0, "FRONT_DELTS": 0.5, "TRICEPS": 0.5} where 1.0 = direct/primary training, 0.5 = indirect/secondary training';

-- ============================================================================
-- POST-MIGRATION NOTES:
-- ============================================================================
-- 1. All 52 existing exercises now have exerciseType = 'COMPOUND' (default)
-- 2. All exercises have volumeContributions = {} (empty object)
-- 3. Admins need to:
--    a) Set correct exerciseType (COMPOUND, ISOLATION, or UNILATERAL)
--    b) Define volumeContributions for each exercise
-- 4. muscleGroup column has been permanently removed
-- ============================================================================
