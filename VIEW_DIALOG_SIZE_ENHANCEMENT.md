# View Knowledge Item Dialog Size Enhancement

## Overview
Increased the size of the view knowledge item dialog to provide a better viewing experience for administrators when reviewing knowledge base content.

## Changes Made

### Dialog Size Improvements
**Before:**
```tsx
<DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
```

**After:**
```tsx
<DialogContent className="max-w-6xl max-h-[90vh] overflow-auto">
```

### Specific Enhancements:

1. **Width Increase**: 
   - Changed from `max-w-4xl` (896px) to `max-w-6xl` (1152px)
   - Provides **256px more width** for content display
   - Better for viewing wide content like tables, PDFs, and long text lines

2. **Height Increase**: 
   - Changed from `max-h-[80vh]` to `max-h-[90vh]`
   - Provides **10% more vertical space** relative to viewport height
   - Better for viewing longer documents and detailed content

## Benefits

### 1. **Improved Content Visibility**
- More space to display PDF documents and their embedded viewers
- Better readability for long text content and rich HTML formatting
- Wider area for viewing extracted content from various file types

### 2. **Enhanced User Experience**
- Less scrolling required for most content types
- Better proportions for viewing knowledge items
- More professional appearance with generous space usage

### 3. **Better PDF Viewing**
- Larger iframe for embedded PDF display
- More space for PDF controls and navigation
- Improved readability of PDF content without constant zooming

### 4. **Responsive Design Maintained**
- Still responsive on smaller screens
- `max-w-6xl` ensures it doesn't exceed reasonable bounds
- `max-h-[90vh]` maintains viewport awareness
- `overflow-auto` ensures scrollability when needed

## Technical Details

### Tailwind CSS Classes Used:
- `max-w-6xl`: Maximum width of 72rem (1152px)
- `max-h-[90vh]`: Maximum height of 90% of viewport height
- `overflow-auto`: Scrollbars appear when content exceeds container

### Browser Compatibility:
- Works across all modern browsers
- Responsive design adapts to different screen sizes
- Mobile-friendly with appropriate scaling

### Performance Impact:
- No performance impact - purely CSS layout change
- No additional JavaScript or functionality added
- Same optimized rendering as before

## Testing
- ✅ Build successful (`npm run build`)
- ✅ Lint passing (`npm run lint`)
- ✅ TypeScript compilation without errors
- ✅ Dialog opens and closes properly
- ✅ Content displays correctly with new dimensions

## Use Cases Improved

1. **PDF Documents**: Better viewing experience with larger embedded viewer
2. **Long Text Content**: Less scrolling required for comprehensive content
3. **Rich HTML Content**: More space for formatted text with lists, blockquotes, etc.
4. **File Content**: Better display of extracted content from Word docs, spreadsheets, etc.
5. **Error Messages**: More space for detailed error information and solutions

The view knowledge item dialog now provides a significantly better viewing experience while maintaining the clean, professional design of the admin interface.
