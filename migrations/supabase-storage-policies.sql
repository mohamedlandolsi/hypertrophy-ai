-- Supabase Storage RLS Policies for Knowledge Files
-- IMPORTANT: You need to run these commands as a superuser or with service role privileges
-- 
-- OPTION 1: Use the Supabase Dashboard Storage settings (RECOMMENDED)
-- OPTION 2: Run these commands with your service role key
-- 
-- If you get "must be owner of table objects" error, use the Dashboard method below.

-- METHOD 1: Dashboard Configuration (RECOMMENDED)
-- Go to Supabase Dashboard > Storage > Settings > Policies
-- Create policies manually using the Dashboard interface

-- METHOD 2: SQL Commands (requires service role privileges)
-- DASHBOARD METHOD (RECOMMENDED - No special privileges required)
-- ==================================================================

-- Step 1: Configure your existing "knowledge-files" bucket
-- 1. Go to Supabase Dashboard > Storage > "knowledge-files" bucket
-- 2. Click on Settings/Configuration
-- 3. Set File size limit: 10485760 (10MB)
-- 4. Set Allowed MIME types: 
--    application/pdf
--    application/msword
--    application/vnd.openxmlformats-officedocument.wordprocessingml.document
--    text/plain
--    text/markdown
--    application/vnd.ms-excel
--    application/vnd.openxmlformats-officedocument.spreadsheetml.sheet

-- Step 2: Create Storage Policies via Dashboard
-- 1. Go to Supabase Dashboard > Storage > "knowledge-files" bucket > Policies
-- 2. Click "New Policy" and create the following policies:

-- POLICY 1: Upload Policy
-- Name: "Users can upload own knowledge files"
-- Operation: INSERT
-- Target roles: authenticated
-- USING expression: (empty)
-- WITH CHECK expression:
-- bucket_id = 'knowledge-files' AND (storage.foldername(name))[1] = 'knowledge' AND (storage.foldername(name))[2] = auth.uid()::text

-- POLICY 2: Select Policy  
-- Name: "Users can read own knowledge files"
-- Operation: SELECT
-- Target roles: authenticated
-- USING expression:
-- bucket_id = 'knowledge-files' AND (storage.foldername(name))[1] = 'knowledge' AND (storage.foldername(name))[2] = auth.uid()::text
-- WITH CHECK expression: (empty)

-- POLICY 3: Delete Policy
-- Name: "Users can delete own knowledge files" 
-- Operation: DELETE
-- Target roles: authenticated
-- USING expression:
-- bucket_id = 'knowledge-files' AND (storage.foldername(name))[1] = 'knowledge' AND (storage.foldername(name))[2] = auth.uid()::text
-- WITH CHECK expression: (empty)

-- POLICY 4: Update Policy
-- Name: "Users can update own knowledge files"
-- Operation: UPDATE  
-- Target roles: authenticated
-- USING expression:
-- bucket_id = 'knowledge-files' AND (storage.foldername(name))[1] = 'knowledge' AND (storage.foldername(name))[2] = auth.uid()::text
-- WITH CHECK expression:
-- bucket_id = 'knowledge-files' AND (storage.foldername(name))[1] = 'knowledge' AND (storage.foldername(name))[2] = auth.uid()::text

-- ==================================================================
-- SQL METHOD (requires service role - use if Dashboard doesn't work)
-- ==================================================================

-- 1. First, ensure the storage bucket exists (if not already created via UI)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'knowledge-files',
  'knowledge-files',
  false,
  10485760, -- 10MB limit
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/markdown',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Enable RLS on storage.objects (should already be enabled, but just to be sure)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Allow users to upload files to their own folder
CREATE POLICY "Users can upload own knowledge files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'knowledge-files' 
  AND auth.uid()::text IS NOT NULL
  AND (storage.foldername(name))[1] = 'knowledge'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- 4. Policy: Allow users to read their own files
CREATE POLICY "Users can read own knowledge files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'knowledge-files' 
  AND auth.uid()::text IS NOT NULL
  AND (storage.foldername(name))[1] = 'knowledge'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- 5. Policy: Allow users to delete their own files
CREATE POLICY "Users can delete own knowledge files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'knowledge-files' 
  AND auth.uid()::text IS NOT NULL
  AND (storage.foldername(name))[1] = 'knowledge'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- 6. Policy: Allow users to update their own files (for metadata updates)
CREATE POLICY "Users can update own knowledge files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'knowledge-files' 
  AND auth.uid()::text IS NOT NULL
  AND (storage.foldername(name))[1] = 'knowledge'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- 7. Optional: Allow admins to access all knowledge files
-- Uncomment the following policies if you want admins to have full access
/*
CREATE POLICY "Admins can read all knowledge files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'knowledge-files' 
  AND auth.uid()::text IS NOT NULL
  AND (storage.foldername(name))[1] = 'knowledge'
  AND EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'ADMIN'
  )
);

CREATE POLICY "Admins can delete all knowledge files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'knowledge-files' 
  AND auth.uid()::text IS NOT NULL
  AND (storage.foldername(name))[1] = 'knowledge'
  AND EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'ADMIN'
  )
);
*/

-- 8. Verify the policies were created
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'objects'
ORDER BY policyname;
