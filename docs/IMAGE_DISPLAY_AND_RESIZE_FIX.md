# Image Display and Resize Feature Implementation

## Overview
Fixed image display issues and added image resizing capabilities to the program guide rich text editor.

## Problems Fixed

### 1. Alt Text Displaying Above Images
**Issue**: Images were showing their alt text (e.g., "Horizontal Abduction") as visible text above the image in both the editor and the program guide page.

**Root Cause**: Images were being inserted with descriptive alt text (`alt="Uploaded image"` or `alt="Pasted image"`), which was being displayed by the browser.

**Solution**: Changed alt text to empty string (`alt=""`) when inserting images via both upload button and paste functionality.

### 2. Image Not Resizable
**Issue**: Users couldn't resize or control the width of uploaded images in the editor.

**Solution**: Added dynamic resize buttons (S, M, L, Full) that appear in the toolbar when an image is selected.

## Changes Made

### 1. Rich Text Editor (`src/components/ui/rich-text-editor.tsx`)

#### Image Configuration
```typescript
Image.configure({
  inline: false,  // Changed from true - images now block-level
  allowBase64: true,
  HTMLAttributes: {
    class: 'rounded-lg my-4 cursor-pointer hover:shadow-lg transition-shadow',
    style: 'max-width: 100%; height: auto; display: block; margin-left: auto; margin-right: auto;',
  },
})
```

#### Empty Alt Text
```typescript
// Upload via button
editor.chain().focus().setImage({ src: url, alt: '' }).run();

// Upload via paste
editor.chain().focus().setImage({ src: url, alt: '' }).run();
```

#### Editor Prose Styling
Added custom Tailwind classes to ensure images display correctly:
```typescript
class: 'focus:outline-none min-h-[200px] prose prose-sm max-w-none dark:prose-invert p-4 [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg [&_img]:my-4 [&_img]:mx-auto [&_img]:block [&_img]:cursor-pointer'
```

#### Image Resize Controls
Added dynamic toolbar buttons that appear when an image is selected:
- **S** (Small): 300px width
- **M** (Medium): 500px width
- **L** (Large): 700px width
- **⬜** (Full): 100% width

```typescript
const isImageSelected = editor.isActive('image');

const setImageWidth = (width: string) => {
  if (isImageSelected) {
    editor.commands.updateAttributes('image', { 
      style: `width: ${width}; height: auto; display: block; margin-left: auto; margin-right: auto; max-width: 100%; border-radius: 0.5rem;` 
    });
  }
};
```

### 2. Program Guide Display (`src/components/programs/program-info.tsx`)

Added image styling to the HTML content display:
```typescript
className="... [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg [&_img]:my-4 [&_img]:mx-auto [&_img]:block"
```

This ensures images in saved program guides display correctly with:
- Responsive sizing (max-width: 100%)
- Centered alignment
- Rounded corners
- Proper vertical spacing

## User Experience

### In the Editor
1. **Upload/Paste Image**: Image appears centered, responsive, with no alt text
2. **Select Image**: Click on the image to select it
3. **Resize Controls Appear**: S, M, L, and Full width buttons appear in toolbar
4. **Click Size Button**: Image instantly resizes to selected width
5. **Alignment**: Images are always centered (aligned via margin: auto)

### In the Program Guide Page
- Images display without any text overlay
- Responsive sizing (never overflow container)
- Centered alignment
- Consistent rounded corners
- Proper spacing from surrounding content

## Technical Details

### Image Attributes
When an image is inserted:
```html
<img 
  src="https://..." 
  alt="" 
  class="rounded-lg my-4 cursor-pointer hover:shadow-lg transition-shadow"
  style="max-width: 100%; height: auto; display: block; margin-left: auto; margin-right: auto;"
/>
```

When resized (e.g., to Medium):
```html
<img 
  src="https://..." 
  alt="" 
  style="width: 500px; height: auto; display: block; margin-left: auto; margin-right: auto; max-width: 100%; border-radius: 0.5rem;"
/>
```

### Responsive Behavior
- `max-width: 100%` ensures images never overflow on mobile
- `height: auto` maintains aspect ratio
- `margin: auto` centers images horizontally
- All size options respect max-width constraint

### CSS Classes Applied
- `rounded-lg`: Rounded corners (0.5rem)
- `my-4`: Vertical margin (1rem top/bottom)
- `mx-auto`: Horizontal centering
- `block`: Block-level display
- `cursor-pointer`: Indicates images are selectable
- `hover:shadow-lg`: Visual feedback on hover
- `transition-shadow`: Smooth shadow transition

## Testing Checklist

### Editor Functionality
- [ ] Upload image via button - no alt text visible
- [ ] Paste image (Ctrl+V) - no alt text visible
- [ ] Select image - resize buttons (S, M, L, Full) appear
- [ ] Click S button - image resizes to 300px
- [ ] Click M button - image resizes to 500px
- [ ] Click L button - image resizes to 700px
- [ ] Click Full button - image fills available width
- [ ] Images are centered in editor
- [ ] Multiple images can be added and resized independently

### Program Guide Display
- [ ] Images display without alt text overlay
- [ ] Images are responsive on mobile
- [ ] Images are centered
- [ ] Images have rounded corners
- [ ] Images maintain aspect ratio
- [ ] Proper spacing between images and text

### Browser Compatibility
- [ ] Chrome/Edge - all features work
- [ ] Firefox - all features work
- [ ] Safari - all features work

## Files Modified

1. **`src/components/ui/rich-text-editor.tsx`**
   - Changed Image extension configuration
   - Removed alt text from image insertion
   - Added image resize controls to MenuBar
   - Added Maximize2 icon import
   - Updated editor prose styling

2. **`src/components/programs/program-info.tsx`**
   - Added image styling classes to HTML content display

## Rollback Instructions

If issues arise, revert these changes:

### 1. Restore Alt Text (Optional)
In `rich-text-editor.tsx`, change:
```typescript
alt: ''  // Back to
alt: 'Uploaded image'
```

### 2. Remove Resize Controls
Remove the resize button section (lines with `isImageSelected` logic and S/M/L/Full buttons)

### 3. Simplify Image Configuration
```typescript
Image.configure({
  inline: true,
  allowBase64: true,
  HTMLAttributes: {
    class: 'max-w-full h-auto rounded-lg my-4',
  },
})
```

## Future Enhancements

Potential improvements:
1. **Drag to Resize**: Add drag handles on image corners
2. **Alignment Controls**: Left, center, right alignment buttons
3. **Image Captions**: Add caption field below images
4. **Image Gallery**: Reuse previously uploaded images
5. **Crop Tool**: Basic image cropping in editor
6. **Rotation**: Rotate images 90° increments
7. **Custom Width Input**: Enter exact pixel width
8. **Aspect Ratio Lock**: Option to maintain/change aspect ratio

## Related Documentation

- Main implementation: `docs/PROGRAM_GUIDE_IMAGE_UPLOAD_IMPLEMENTATION.md`
- Deployment fix: `docs/VERCEL_DEPLOYMENT_FIX_NPMRC.md`
- SQL setup: `sql/setup-program-guide-images-storage.sql`
- API route: `src/app/api/admin/programs/upload-guide-image/route.ts`
