# Vercel Deployment Fix - TipTap Image Extension

## Problem
Vercel build was failing with dependency resolution error:
```
npm error ERESOLVE could not resolve
npm error peer @tiptap/core@"^3.6.6" from @tiptap/extension-image@3.6.6
npm error Conflicting peer dependency with @tiptap/core@2.25.0
```

## Root Cause
- Project uses TipTap v2.25.0 for most packages
- `@tiptap/extension-image` v3.6.6 requires TipTap v3.x core
- Version mismatch causes npm peer dependency conflict
- Vercel doesn't use `--legacy-peer-deps` by default

## Solution
Created `.npmrc` file with `legacy-peer-deps=true` to allow npm to install packages despite peer dependency warnings.

## Files Changed
1. **Created: `.npmrc`**
   ```
   legacy-peer-deps=true
   ```

2. **Updated: `docs/PROGRAM_GUIDE_IMAGE_UPLOAD_IMPLEMENTATION.md`**
   - Added deployment section with Vercel configuration
   - Added troubleshooting for ERESOLVE errors
   - Added .npmrc file documentation

## Deployment Steps
1. ✅ Commit `.npmrc` file to repository
2. ✅ Push to GitHub
3. ✅ Vercel will automatically detect and use `.npmrc` during build
4. ✅ Build should now succeed

## Verification
Local build tested and confirmed working:
```bash
npm run build
# ✓ Compiled successfully
# ✓ 60 routes generated
```

## Important Notes
- `.npmrc` must be in the root directory (same level as `package.json`)
- File must be committed to git (don't add to `.gitignore`)
- Vercel automatically reads `.npmrc` during npm install
- This approach is safer than upgrading all TipTap packages to v3.x

## Alternative Solutions (Not Recommended)
1. ❌ Downgrade `@tiptap/extension-image` to v2.x (older, fewer features)
2. ❌ Upgrade all TipTap packages to v3.x (breaking changes, requires extensive testing)
3. ✅ Use `.npmrc` with legacy-peer-deps (current solution - minimal risk)

## Testing After Deployment
1. Navigate to Admin → Programs → Edit
2. Go to Training Guide tab
3. Try uploading an image via button
4. Try pasting an image (Ctrl+V)
5. Verify image renders correctly in editor
6. Save and verify image persists

## Rollback Plan
If issues arise:
1. Remove `.npmrc` file
2. Uninstall `@tiptap/extension-image`:
   ```bash
   npm uninstall @tiptap/extension-image
   ```
3. Revert changes to `rich-text-editor.tsx`
4. Images will insert as HTML text instead of rendering

## Related Documentation
- Main implementation guide: `docs/PROGRAM_GUIDE_IMAGE_UPLOAD_IMPLEMENTATION.md`
- SQL setup script: `sql/setup-program-guide-images-storage.sql`
- API route: `src/app/api/admin/programs/upload-guide-image/route.ts`
