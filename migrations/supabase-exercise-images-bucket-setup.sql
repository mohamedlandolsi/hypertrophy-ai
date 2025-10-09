-- =====================================================
-- Supabase Storage Bucket Setup for Exercise Images
-- =====================================================
-- This file contains SQL commands to create a storage bucket
-- for exercise images/GIFs with appropriate RLS policies
--
-- INSTRUCTIONS:
-- 1. Go to your Supabase Dashboard
-- 2. Navigate to SQL Editor
-- 3. Paste and run these commands
-- 4. Verify the bucket appears in Storage section
-- =====================================================

-- Create the 'exercise-images' storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'exercise-images',
  'exercise-images',
  true,  -- Public bucket (images will be publicly accessible via URL)
  10485760,  -- 10MB file size limit (10 * 1024 * 1024 bytes)
  ARRAY[
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================

-- Policy 1: Allow PUBLIC READ access to all exercise images
-- This allows anyone (authenticated or not) to view exercise images
CREATE POLICY "Public read access for exercise images"
ON storage.objects FOR SELECT
USING (bucket_id = 'exercise-images');

-- Policy 2: Allow ADMIN UPLOAD (INSERT) access
-- Only admin users can upload new exercise images
CREATE POLICY "Admin upload access for exercise images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'exercise-images' 
  AND auth.uid()::text IN (
    SELECT id FROM "User" WHERE role = 'admin'
  )
);

-- Policy 3: Allow ADMIN UPDATE access
-- Only admin users can update existing exercise images
CREATE POLICY "Admin update access for exercise images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'exercise-images'
  AND auth.uid()::text IN (
    SELECT id FROM "User" WHERE role = 'admin'
  )
)
WITH CHECK (
  bucket_id = 'exercise-images'
  AND auth.uid()::text IN (
    SELECT id FROM "User" WHERE role = 'admin'
  )
);

-- Policy 4: Allow ADMIN DELETE access
-- Only admin users can delete exercise images
CREATE POLICY "Admin delete access for exercise images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'exercise-images'
  AND auth.uid()::text IN (
    SELECT id FROM "User" WHERE role = 'admin'
  )
);

-- =====================================================
-- Verification Queries (optional - run to verify setup)
-- =====================================================

-- Check if bucket was created successfully
-- SELECT * FROM storage.buckets WHERE id = 'exercise-images';

-- Check RLS policies on storage.objects for the bucket
-- SELECT * FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE '%exercise images%';

-- =====================================================
-- NOTES:
-- =====================================================
-- 1. Bucket is PUBLIC (anyone can view images via URL)
-- 2. Only ADMINS can upload/update/delete images
-- 3. File size limit: 10MB
-- 4. Allowed types: JPEG, JPG, PNG, GIF, WebP
-- 5. Images are stored under path: exercises/{filename}
--
-- If you need to delete the bucket (WARNING: deletes all files):
-- DELETE FROM storage.buckets WHERE id = 'exercise-images';
-- =====================================================
