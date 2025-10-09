-- Storage Policies for knowledge-files bucket
-- Run these commands in Supabase SQL Editor

-- 1. First, drop any existing policies with the same names (in case you're re-running)
DROP POLICY IF EXISTS "Users can upload own knowledge files" ON storage.objects;
DROP POLICY IF EXISTS "Users can read own knowledge files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own knowledge files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own knowledge files" ON storage.objects;

-- 2. Create the storage policies
CREATE POLICY "Users can upload own knowledge files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'knowledge-files' 
  AND auth.uid()::text IS NOT NULL
  AND (storage.foldername(name))[1] = 'knowledge'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

CREATE POLICY "Users can read own knowledge files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'knowledge-files' 
  AND auth.uid()::text IS NOT NULL
  AND (storage.foldername(name))[1] = 'knowledge'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

CREATE POLICY "Users can delete own knowledge files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'knowledge-files' 
  AND auth.uid()::text IS NOT NULL
  AND (storage.foldername(name))[1] = 'knowledge'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

CREATE POLICY "Users can update own knowledge files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'knowledge-files' 
  AND auth.uid()::text IS NOT NULL
  AND (storage.foldername(name))[1] = 'knowledge'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- 3. Optional: Admin policies (uncomment if you want admins to access all files)
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

-- 4. Verify the policies were created
SELECT 
  policyname, 
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%knowledge%'
ORDER BY policyname;
