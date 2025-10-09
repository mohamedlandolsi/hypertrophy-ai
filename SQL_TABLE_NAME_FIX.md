# ⚠️ IMPORTANT FIX - Table Name & Type Cast Corrections

## Issues Found & Fixed

### Issue 1: Table Name
**Error:** `ERROR: 42P01: relation "public.users" does not exist`
**Root Cause:** The Prisma model is `User` (capitalized), which creates a PostgreSQL table named `"User"` (case-sensitive), not `public.users`.
**Solution:** Updated to use `"User"` instead of `public.users`.

### Issue 2: Type Mismatch
**Error:** `ERROR: 42883: operator does not exist: uuid = text`
**Root Cause:** `auth.uid()` returns UUID type, but `User.id` is TEXT (cuid). Cannot compare UUID to TEXT directly.
**Solution:** Added type cast `auth.uid()::text` to convert UUID to TEXT.

---

## ✅ CORRECTED SQL (Use This)

All SQL files have been updated with the correct table name AND type casts. Use these commands:

### **RLS Policies with Correct Table Name and Type Cast:**

```sql
-- Admin upload access
CREATE POLICY "Admin upload access for exercise images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'exercise-images' 
  AND auth.uid()::text IN (
    SELECT id FROM "User" WHERE role = 'admin'
  )
);

-- Admin update access
CREATE POLICY "Admin update access for exercise images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'exercise-images'
  AND auth.uid()::text IN (SELECT id FROM "User" WHERE role = 'admin')
)
WITH CHECK (
  bucket_id = 'exercise-images'
  AND auth.uid()::text IN (SELECT id FROM "User" WHERE role = 'admin')
);

-- Admin delete access
CREATE POLICY "Admin delete access for exercise images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'exercise-images'
  AND auth.uid()::text IN (SELECT id FROM "User" WHERE role = 'admin')
);
```

---

## 📝 Key Changes

1. **Table Name:** `public.users` → `"User"` (capitalized with quotes)
2. **Type Cast:** `auth.uid()` → `auth.uid()::text` (cast UUID to TEXT)

---

## 📝 Updated Files

All SQL commands in these files have been corrected:
- ✅ `supabase-exercise-images-bucket-setup.sql`
- ✅ `EXERCISE_IMAGE_UPLOAD_FINAL_SUMMARY.md`

**Action:** Re-run the SQL commands from the updated files. They should now work without errors!

---

**Date Fixed:** October 7, 2025
