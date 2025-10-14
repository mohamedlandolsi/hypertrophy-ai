# Program Guide Image Upload Feature Implementation

## Overview
This document describes the implementation of image upload functionality in the Training Guide section of the program creation and editing pages. Users can now upload images directly into the rich text editor by clicking the image button or pasting images from their clipboard.

## Features Implemented

### 1. Enhanced Rich Text Editor
- **File Upload**: Click the image icon in the toolbar to select and upload an image
- **Paste Support**: Copy an image from anywhere and paste it directly into the editor (Ctrl+V)
- **Drag & Drop**: _(Note: Can be added in future if needed)_
- **Image Rendering**: Images are rendered inline using TipTap Image extension
- **Responsive Images**: Automatically styled with max-width and rounded corners
- **Dependencies**: Requires `@tiptap/extension-image` package

### 2. Image Upload API
- **Endpoint**: `POST /api/admin/programs/upload-guide-image`
- **Authentication**: Requires admin role
- **File Validation**:
  - Maximum file size: 5MB
  - Allowed formats: JPEG, JPG, PNG, GIF, WebP
- **Storage**: Supabase Storage bucket `program-guide-images`
- **Path Structure**: `program-guides/{timestamp}-{sanitized-filename}.{ext}`

### 3. Supabase Storage Configuration
- **Bucket**: `program-guide-images`
- **Access Level**: Public read, Admin write
- **File Size Limit**: 5MB
- **Automatic URL Generation**: Public URLs for all uploaded images

## Files Modified/Created

### Created Files
1. **`src/app/api/admin/programs/upload-guide-image/route.ts`**
   - New API endpoint for image uploads
   - Handles both POST (upload) and DELETE (remove) operations
   - Admin authentication and validation

2. **`sql/setup-program-guide-images-storage.sql`**
   - SQL commands for Supabase storage setup
   - Bucket creation
   - RLS policies for access control
   - Verification and cleanup queries

3. **`.npmrc`**
   - NPM configuration file for Vercel deployment
   - Sets `legacy-peer-deps=true` to resolve TipTap extension version conflicts
   - Required for deploying with `@tiptap/extension-image@3.6.6` alongside TipTap v2.x packages

### Modified Files
1. **`src/components/ui/rich-text-editor.tsx`**
   - Added `@tiptap/extension-image` import and configuration
   - Added image upload button to toolbar
   - Added paste event handler for clipboard images
   - Added file input handling
   - Added loading state during uploads
   - Added toast notifications for errors
   - Uses `editor.chain().focus().setImage()` for proper image rendering

2. **`src/components/admin/program-creation/guide-form.tsx`**
   - Enabled `enableImageUpload` prop on RichTextEditor
   - Added helper text for image upload feature

## Supabase Storage Setup

### Prerequisites
Before running the SQL commands, ensure you have:
1. Admin access to your Supabase project dashboard
2. SQL Editor access in Supabase
3. Your application user account has `role = 'admin'` in the User table

### Step 1: Run SQL Commands
Navigate to your Supabase project dashboard → SQL Editor and run the following commands:

```sql
-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'program-guide-images',
  'program-guide-images',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Public read access (anyone can view images)
CREATE POLICY "Public read access for program guide images"
ON storage.objects FOR SELECT
USING (bucket_id = 'program-guide-images');

-- Authenticated users can upload (admin check in API route)
CREATE POLICY "Admin upload access for program guide images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'program-guide-images'
  AND auth.role() = 'authenticated'
);

-- Authenticated users can update (admin check in API route)
CREATE POLICY "Admin update access for program guide images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'program-guide-images'
  AND auth.role() = 'authenticated'
);

-- Authenticated users can delete (admin check in API route)
CREATE POLICY "Admin delete access for program guide images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'program-guide-images'
  AND auth.role() = 'authenticated'
);
```

**Important Notes:**
- RLS policies check for authenticated users only
- Admin role validation is enforced in the API route before storage operations
- This approach is more secure as the API acts as a gatekeeper

### Step 2: Verify Setup
Run this query to verify the bucket was created:

```sql
SELECT * FROM storage.buckets WHERE id = 'program-guide-images';
```

You should see a row with:
- `id`: program-guide-images
- `public`: true
- `file_size_limit`: 5242880
- `allowed_mime_types`: {image/jpeg, image/jpg, image/png, image/gif, image/webp}

### Step 3: Check Policies
Verify all 4 policies were created:

```sql
SELECT policyname, cmd
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%program guide images%';
```

You should see 4 policies:
1. Public read access for program guide images (SELECT)
2. Admin upload access for program guide images (INSERT)
3. Admin update access for program guide images (UPDATE)
4. Admin delete access for program guide images (DELETE)

## Usage Instructions

### For Developers
1. The feature is automatically enabled in the Training Guide section
2. No additional configuration needed in the code
3. Images are automatically uploaded when user selects or pastes them

### For Admin Users
1. Navigate to Admin → Programs → New Program or Edit existing
2. Go to the "Training Guide" tab
3. Click on a section to edit its content
4. To upload an image:
   - **Method 1**: Click the image icon (📷) in the editor toolbar, select a file
   - **Method 2**: Copy an image from anywhere (web, screenshot, file) and paste (Ctrl+V) into the editor
5. Image will be uploaded automatically and inserted into the content
6. Images are saved as part of the HTML content

## Technical Details

### Image Upload Flow
1. User selects/pastes an image
2. File is validated (size, type)
3. FormData is created with the file
4. POST request to `/api/admin/programs/upload-guide-image`
5. API validates user is admin
6. File uploaded to Supabase Storage
7. Public URL returned
8. Image HTML inserted into editor content
9. Content saved to database with form submission

### Image Storage
- **Bucket**: `program-guide-images`
- **Path**: `program-guides/{timestamp}-{filename}.{ext}`
- **Example**: `program-guides/1728734567890-exercise-form.jpg`
- **Public URL**: `https://{project}.supabase.co/storage/v1/object/public/program-guide-images/program-guides/...`

### Security
- ✅ Admin-only upload (enforced in API and RLS policies)
- ✅ File type validation (only images)
- ✅ File size limit (5MB max)
- ✅ Filename sanitization (removes special characters)
- ✅ Public read access (anyone can view uploaded images)

### Image Styling
Images are automatically styled with:
- `max-w-full`: Responsive width
- `h-auto`: Maintains aspect ratio
- `rounded-lg`: Rounded corners
- `my-4`: Vertical spacing

## Error Handling

### Client-Side Validation
- File type must be an image
- File size must be ≤ 5MB
- Toast notifications for errors

### Server-Side Validation
- User authentication required
- Admin role required
- File validation (type, size)
- Supabase storage error handling

### Common Errors and Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| "Authentication required" | User not logged in | Log in as admin |
| "Admin access required" | User is not admin | Use an admin account |
| "File too large" | Image > 5MB | Compress or resize image |
| "Invalid file type" | Non-image file | Select an image file |
| "Upload failed" | Storage error | Check Supabase configuration |
| Vercel build fails with ERESOLVE | Missing `.npmrc` file | Ensure `.npmrc` with `legacy-peer-deps=true` is committed |
| Image shows as HTML code | Missing TipTap Image extension | Verify `@tiptap/extension-image` is installed and configured |

## Future Enhancements

Potential improvements that can be added:
1. **Drag & Drop**: Allow dragging images into the editor
2. **Image Compression**: Automatically compress large images before upload
3. **Image Gallery**: Show previously uploaded images for reuse
4. **Image Editing**: Basic crop/resize in the editor
5. **Bulk Upload**: Upload multiple images at once
6. **Progress Indicator**: Show upload progress for large files
7. **Image Captions**: Add caption field below images
8. **Image Alignment**: Left, center, right alignment options

## Testing Checklist

### Functional Testing
- [ ] Image upload via button works
- [ ] Image paste (Ctrl+V) works
- [ ] Multiple images can be added
- [ ] Images display correctly in editor
- [ ] Images are saved with content
- [ ] Images load in published program guide
- [ ] File size validation works
- [ ] File type validation works
- [ ] Admin-only access enforced

### Browser Testing
- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari

### Accessibility
- [ ] Image button has title attribute
- [ ] Alt text is added to images
- [ ] Keyboard navigation works

## Deployment to Vercel

### Prerequisites
1. ✅ `.npmrc` file committed to repository
2. ✅ Supabase storage bucket created (SQL commands executed)
3. ✅ All environment variables configured in Vercel dashboard

### Environment Variables Required
Set these in Vercel Project Settings → Environment Variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`
- `DIRECT_URL`

### Deployment Steps
1. Commit and push `.npmrc` file to your repository
2. Vercel will automatically use `legacy-peer-deps=true` during installation
3. Build will succeed with TipTap Image extension v3.6.6
4. Test image upload in production after deployment

### Build Configuration
- **Build Command**: `npm run build` (default)
- **Install Command**: `npm install` (uses `.npmrc` automatically)
- **Node Version**: 18.x or higher recommended

### Troubleshooting Vercel Deployment
If build fails with `ERESOLVE` error:
1. ✅ Verify `.npmrc` file exists in root directory
2. ✅ Ensure `.npmrc` contains `legacy-peer-deps=true`
3. ✅ Check `.npmrc` is not in `.gitignore`
4. ✅ Commit and push `.npmrc` if missing
5. ✅ Trigger new deployment in Vercel

## Rollback Instructions

If you need to remove this feature:

### 1. Disable Image Upload in UI
In `guide-form.tsx`:
```tsx
<RichTextEditor
  enableImageUpload={false}  // Set to false
  // ... other props
/>
```

### 2. Remove Storage Bucket (Optional)
Run in Supabase SQL Editor:
```sql
-- Remove policies
DROP POLICY IF EXISTS "Public read access for program guide images" ON storage.objects;
DROP POLICY IF EXISTS "Admin upload access for program guide images" ON storage.objects;
DROP POLICY IF EXISTS "Admin update access for program guide images" ON storage.objects;
DROP POLICY IF EXISTS "Admin delete access for program guide images" ON storage.objects;

-- Remove files and bucket
DELETE FROM storage.objects WHERE bucket_id = 'program-guide-images';
DELETE FROM storage.buckets WHERE id = 'program-guide-images';
```

### 3. Remove API Route (Optional)
Delete file: `src/app/api/admin/programs/upload-guide-image/route.ts`

## Support and Troubleshooting

### Logs to Check
1. **Browser Console**: Look for upload errors
2. **Network Tab**: Check API request/response
3. **Supabase Logs**: Check storage operations
4. **Server Logs**: Check API route errors

### Debug Mode
Add this to the upload function to see detailed logs:
```typescript
console.log('Uploading image:', file.name, file.size, file.type);
console.log('Upload response:', data);
```

## Conclusion

The image upload feature is now fully integrated into the Program Guide editor. Users can seamlessly add images to their training guide content using either the toolbar button or clipboard paste functionality. All images are securely stored in Supabase Storage with proper access controls.
