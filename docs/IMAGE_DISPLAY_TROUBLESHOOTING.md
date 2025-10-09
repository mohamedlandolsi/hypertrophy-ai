# 🔍 Exercise Images Not Showing - Troubleshooting Guide

## ✅ What We've Confirmed:

1. ✅ Database schema has `imageUrl` and `imageType` fields
2. ✅ Supabase storage bucket "exercise-images" exists and is public
3. ✅ One image file already uploaded to storage (1759830735793-gbww5w.jpeg, 203KB)
4. ❌ **ISSUE**: No exercises in database have imageUrl values set

## 🎯 Root Cause:

**The image upload succeeds, but the imageUrl is not being saved to the database.**

This happens when:
- The upload API returns the imageUrl
- But the exercise create/update doesn't include it in the payload
- OR the frontend doesn't wait for upload to complete before submitting

---

## 🔧 How to Test and Fix:

### **Step 1: Test Image Upload Flow**

1. Open Exercise Management page (as admin)
2. Click "Add Exercise" or edit an existing exercise
3. Fill in the required fields (name, type, etc.)
4. Select an image file
5. **IMPORTANT**: Wait for the image preview to appear
6. Click "Save"

### **Step 2: Check Browser Console**

Open DevTools (F12) and watch for:

```
✅ Good signs:
- "Uploading image..." message
- Network request to /api/admin/exercises/upload-image (200 OK)
- Response contains imageUrl and imageType
- Network request to /api/admin/exercises or /api/admin/exercises/[id]
- Response shows exercise with imageUrl

❌ Bad signs:
- Upload API returns error (401, 403, 500)
- Exercise API request has imageUrl: undefined or imageUrl: null
- Any JavaScript errors
```

### **Step 3: Check Network Tab**

1. Open DevTools → Network tab
2. Try uploading an image
3. Look for these requests:

#### A. POST /api/admin/exercises/upload-image
**Expected Response:**
```json
{
  "success": true,
  "imageUrl": "https://kbxqoaeytmuabopwlngy.supabase.co/storage/v1/object/public/exercise-images/exercises/1759830735793-gbww5w.jpeg",
  "imageType": "image/jpeg",
  "message": "Image uploaded successfully."
}
```

#### B. POST /api/admin/exercises (or PUT for edit)
**Expected Payload:**
```json
{
  "name": "Exercise Name",
  "exerciseType": "COMPOUND",
  ...
  "imageUrl": "https://kbxqoaeytmuabopwlngy.supabase.co/storage/v1/object/public/exercise-images/exercises/1759830735793-gbww5w.jpeg",
  "imageType": "image/jpeg"
}
```

---

## 🐛 Common Issues and Solutions:

### **Issue 1: Upload happens but imageUrl not included in save**

**Symptom:** Upload succeeds, but exercise is saved without imageUrl

**Solution:** The form is submitting before the upload completes.

**Fix Applied:** Code already waits for upload with:
```javascript
if (imageFile) {
  const uploadResult = await handleImageUpload(); // Waits for upload
  // imageUrl is set in formData by handleImageUpload
}
```

But check if there's an error being swallowed!

### **Issue 2: Upload fails silently**

**Symptom:** No error shown, but imageUrl is null

**Check:**
```javascript
// In exercise-management.tsx, handleImageUpload function
// Should see this in console if it fails:
console.error('Failed to upload image:', error);
```

### **Issue 3: RLS Policy blocks upload**

**Symptom:** 403 or "row-level security policy" error

**Solution:** Run the simplified RLS policies:
```sql
-- From supabase-storage-policies-fix.sql
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete images" ON storage.objects;

CREATE POLICY "Authenticated users can upload images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'exercise-images');

CREATE POLICY "Public read access for images"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'exercise-images');

CREATE POLICY "Admins can delete images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'exercise-images');
```

---

## 🧪 Manual Test - Upload an Image:

1. **Go to Admin > Exercise Management**
2. **Click "Add Exercise"**
3. **Fill in:**
   - Name: "Test Exercise With Image"
   - Type: "COMPOUND"
   - Equipment: "Barbell"
4. **Select an image file** (JPG, PNG, or GIF under 10MB)
5. **Wait for preview to appear**
6. **Click "Save"**
7. **Run diagnostic script:**
   ```powershell
   node check-exercise-image-urls.js
   ```

8. **Expected output:**
   ```
   ✅ Found 1 exercise(s) with images:
   
   1. Test Exercise With Image
      Image URL: https://kbxqoaeytmuabopwlngy.supabase.co/storage/v1/object/public/exercise-images/exercises/...
      Image Type: image/jpeg
   ```

---

## 🔬 Debug Script to Add Image Manually:

If upload works but database isn't updated, test by manually adding imageUrl:

```javascript
// test-manual-image-update.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // The existing uploaded image
  const testImageUrl = 'https://kbxqoaeytmuabopwlngy.supabase.co/storage/v1/object/public/exercise-images/exercises/1759830735793-gbww5w.jpeg';
  
  // Update first exercise with this image
  const firstExercise = await prisma.exercise.findFirst();
  
  if (firstExercise) {
    const updated = await prisma.exercise.update({
      where: { id: firstExercise.id },
      data: {
        imageUrl: testImageUrl,
        imageType: 'image/jpeg'
      }
    });
    
    console.log('✅ Updated exercise:', updated.name);
    console.log('   Image URL:', updated.imageUrl);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
```

Run this and then check if the image shows in the UI!

---

## 🎯 Next Steps:

1. **Try uploading a new image** following Step 1 above
2. **Watch the browser console and network tab** during upload
3. **Run** `node check-exercise-image-urls.js` **after upload**
4. **If still not working**, share:
   - Console errors
   - Network tab responses
   - Any error messages shown in UI

---

## 📊 Current Status:

```
✅ Schema: imageUrl, imageType fields exist
✅ Storage: Bucket exists and is public
✅ API: Upload endpoint working (file uploaded successfully)
✅ UI: Image preview works, upload button works
❌ Database: No exercises have imageUrl values set
❌ Display: Images not showing because imageUrl is null
```

**The issue is in the connection between upload and database save!**

---

## 💡 Quick Fix Option:

If you want to test the display functionality immediately, manually set an imageUrl:

**SQL Command:**
```sql
UPDATE "Exercise"
SET 
  "imageUrl" = 'https://kbxqoaeytmuabopwlngy.supabase.co/storage/v1/object/public/exercise-images/exercises/1759830735793-gbww5w.jpeg',
  "imageType" = 'image/jpeg'
WHERE name = 'Chest Press'; -- or any exercise name
```

Then refresh the page - you should see the image!

This will prove the display logic works, and confirms the issue is just in the upload-to-database flow.
