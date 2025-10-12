-- ============================================================================
-- Supabase Storage Configuration for Program Guide Images
-- ============================================================================
-- Run these commands in your Supabase SQL Editor to set up image storage
-- for program guide content.
-- ============================================================================

-- Step 1: Create the storage bucket for program guide images
-- ============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'program-guide-images',
  'program-guide-images',
  true, -- Public bucket for easy access
  5242880, -- 5MB file size limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Step 2: Create storage policies for program guide images
-- ============================================================================

-- Policy 1: Allow authenticated users to view/download images (public read)
-- This allows anyone to view the images once uploaded
CREATE POLICY "Public read access for program guide images"
ON storage.objects FOR SELECT
USING (bucket_id = 'program-guide-images');

-- Policy 2: Allow authenticated users to upload images
-- Note: Admin check is enforced in the API route before reaching storage
CREATE POLICY "Admin upload access for program guide images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'program-guide-images'
  AND auth.role() = 'authenticated'
);

-- Policy 3: Allow authenticated users to update images
-- Note: Admin check is enforced in the API route before reaching storage
CREATE POLICY "Admin update access for program guide images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'program-guide-images'
  AND auth.role() = 'authenticated'
);

-- Policy 4: Allow authenticated users to delete images
-- Note: Admin check is enforced in the API route before reaching storage
CREATE POLICY "Admin delete access for program guide images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'program-guide-images'
  AND auth.role() = 'authenticated'
);

-- ============================================================================
-- Verification Queries
-- ============================================================================
-- Run these queries to verify the setup

-- Check if bucket was created successfully
SELECT * FROM storage.buckets WHERE id = 'program-guide-images';

-- Check all policies for the bucket
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%program guide images%';

-- ============================================================================
-- Usage Examples
-- ============================================================================

-- Example: List all files in the bucket (run after uploading some images)
-- SELECT * FROM storage.objects WHERE bucket_id = 'program-guide-images' LIMIT 10;

-- Example: Get total storage used by program guide images
-- SELECT 
--   bucket_id,
--   COUNT(*) as file_count,
--   SUM(metadata->>'size')::bigint as total_size_bytes,
--   pg_size_pretty(SUM(metadata->>'size')::bigint) as total_size
-- FROM storage.objects
-- WHERE bucket_id = 'program-guide-images'
-- GROUP BY bucket_id;

-- ============================================================================
-- Cleanup (DANGER: Only run if you want to remove everything)
-- ============================================================================

-- WARNING: These commands will delete the bucket and all images!
-- Uncomment only if you need to reset everything

-- DROP POLICY IF EXISTS "Public read access for program guide images" ON storage.objects;
-- DROP POLICY IF EXISTS "Admin upload access for program guide images" ON storage.objects;
-- DROP POLICY IF EXISTS "Admin update access for program guide images" ON storage.objects;
-- DROP POLICY IF EXISTS "Admin delete access for program guide images" ON storage.objects;
-- DELETE FROM storage.objects WHERE bucket_id = 'program-guide-images';
-- DELETE FROM storage.buckets WHERE id = 'program-guide-images';

-- ============================================================================
-- Notes
-- ============================================================================
-- 1. Images are stored in the path: program-guides/{timestamp}-{filename}.{ext}
-- 2. Public URLs are automatically generated for each uploaded image
-- 3. File size limit is set to 5MB per image
-- 4. Only JPEG, PNG, GIF, and WebP formats are allowed
-- 5. Only users with 'admin' role can upload/modify/delete images
-- 6. All authenticated users can view/download images
-- ============================================================================
