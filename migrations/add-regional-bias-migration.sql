-- Add regionalBias column to Exercise table
-- This stores which specific region/muscle is biased when a muscle has 1.0 volume contribution

ALTER TABLE "Exercise" 
ADD COLUMN IF NOT EXISTS "regionalBias" JSONB DEFAULT '{}'::JSONB;

-- Update existing exercises to have empty regionalBias object
UPDATE "Exercise" 
SET "regionalBias" = '{}'::JSONB 
WHERE "regionalBias" IS NULL;

-- Verify the column was added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'Exercise' 
AND column_name = 'regionalBias';
