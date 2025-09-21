-- CreateEnum for UserRole
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN', 'COACH');

-- Add temporary column with UserRole type
ALTER TABLE "User" ADD COLUMN "role_new" "UserRole";

-- Migrate existing data (convert string to enum)
UPDATE "User" SET "role_new" = 'USER' WHERE "role" = 'user';
UPDATE "User" SET "role_new" = 'ADMIN' WHERE "role" = 'admin';

-- Set default value for any null values
UPDATE "User" SET "role_new" = 'USER' WHERE "role_new" IS NULL;

-- Make the new column not null
ALTER TABLE "User" ALTER COLUMN "role_new" SET NOT NULL;

-- Drop the old column
ALTER TABLE "User" DROP COLUMN "role";

-- Rename the new column to the original name
ALTER TABLE "User" RENAME COLUMN "role_new" TO "role";

-- Set default value for the column
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'USER';
