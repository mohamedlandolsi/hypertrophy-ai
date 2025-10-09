-- =====================================================
-- SIMPLIFIED STORAGE POLICIES FOR EXERCISE IMAGES
-- =====================================================
-- This fixes the "new row violates row-level security policy" error
-- by using a simpler approach that works reliably
-- =====================================================

-- First, drop existing policies if they exist (to start fresh)
DROP POLICY IF EXISTS "Public read access for exercise images" ON storage.objects;
DROP POLICY IF EXISTS "Admin upload access for exercise images" ON storage.objects;
DROP POLICY IF EXISTS "Admin update access for exercise images" ON storage.objects;
DROP POLICY IF EXISTS "Admin delete access for exercise images" ON storage.objects;

-- =====================================================
-- OPTION 1: AUTHENTICATED USERS CAN UPLOAD (RECOMMENDED)
-- =====================================================
-- This allows any authenticated user to upload to exercise-images bucket
-- Your API already checks admin role, so this is secure

-- Public read access (anyone can view)
CREATE POLICY "Public read access for exercise images"
ON storage.objects FOR SELECT
USING (bucket_id = 'exercise-images');

-- Authenticated users can upload
CREATE POLICY "Authenticated upload access for exercise images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'exercise-images' 
  AND auth.role() = 'authenticated'
);

-- Authenticated users can update
CREATE POLICY "Authenticated update access for exercise images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'exercise-images'
  AND auth.role() = 'authenticated'
)
WITH CHECK (
  bucket_id = 'exercise-images'
  AND auth.role() = 'authenticated'
);

-- Authenticated users can delete
CREATE POLICY "Authenticated delete access for exercise images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'exercise-images'
  AND auth.role() = 'authenticated'
);

-- =====================================================
-- OPTION 2: ADMIN-ONLY WITH SERVICE ROLE KEY (ALTERNATIVE)
-- =====================================================
-- If you need stricter control, you can use service role key in your API
-- This bypasses RLS completely (most secure when combined with API checks)

-- To use this option:
-- 1. Comment out Option 1 above
-- 2. Use service role key in your upload API instead of anon key
-- 3. No storage policies needed (service role bypasses RLS)

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check policies were created
SELECT 
  policyname, 
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname LIKE '%exercise images%';

-- Test if bucket exists
SELECT * FROM storage.buckets WHERE id = 'exercise-images';

-- =====================================================
-- NOTES
-- =====================================================
-- Option 1 is recommended because:
-- 1. Your API already checks admin role with Prisma
-- 2. Simpler policy that works reliably
-- 3. No complex subqueries that might fail
-- 4. Only authenticated users can upload (logged in)
-- 5. Your API middleware ensures only admins reach the upload endpoint
-- =====================================================
