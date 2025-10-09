-- Add imageUrl and imageType columns to Exercise table
ALTER TABLE "Exercise" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;
ALTER TABLE "Exercise" ADD COLUMN IF NOT EXISTS "imageType" TEXT;

-- Add comment for documentation
COMMENT ON COLUMN "Exercise"."imageUrl" IS 'URL to exercise demonstration image or GIF';
COMMENT ON COLUMN "Exercise"."imageType" IS 'MIME type of the image (e.g., image/jpeg, image/png, image/gif)';
