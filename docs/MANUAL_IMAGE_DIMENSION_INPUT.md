# Manual Image Dimension Input Feature

## Overview
Added the ability to manually type exact dimensions (width and height) for images in the program guide rich text editor. This complements the existing drag-to-resize functionality with precise numerical control.

## Features

### 1. **Width Input**
- Number input field to specify image width in pixels
- Appears in toolbar when image is selected
- Real-time updates as you type
- Press Enter or blur to apply changes

### 2. **Height Input (Optional)**
- Only visible when aspect ratio is unlocked
- Allows independent height control
- Same behavior as width input

### 3. **Aspect Ratio Lock/Unlock**
- 🔒 Lock: Height auto-calculates to maintain aspect ratio (default)
- 🔓 Unlock: Set width and height independently
- Toggle button in toolbar

### 4. **Apply Button**
- Manually trigger dimension changes
- Useful after typing multiple values
- Also applies automatically on blur or Enter key

## User Interface

### Toolbar Layout (When Image Selected)
```
[Undo][Redo]│[H1][H2][H3]│[Bold][Italic]...│[Image]│Width:[500]px [🔒] Height:[auto]px [Apply]
```

### Controls Breakdown
- **Width Input**: Number field, 20px wide
- **Height Input**: Number field, 20px wide (only when unlocked)
- **Lock/Unlock Button**: 🔒/🔓 emoji toggle
- **Apply Button**: Primary button to confirm changes
- **"px" Label**: Shows unit of measurement

## How It Works

### 1. **Select Image**
- Click any image in the editor
- Toolbar shows dimension controls
- Current width is auto-detected from image

### 2. **Type Width**
- Click in Width input
- Type desired width (e.g., `450`)
- Press Enter or Tab to apply
- Image resizes immediately

### 3. **Lock/Unlock Aspect Ratio**
- Click 🔒 to unlock (becomes 🔓)
- Height input field appears
- Set custom width and height independently

### 4. **Type Height (When Unlocked)**
- Only available when unlocked
- Type desired height (e.g., `300`)
- Press Enter or Tab to apply
- Both dimensions update

### 5. **Apply Changes**
- Auto-applies on blur (click outside input)
- Auto-applies on Enter key
- Manual Apply button for confirmation

## Technical Implementation

### State Management
```typescript
const [imageWidth, setImageWidth] = React.useState('');
const [imageHeight, setImageHeight] = React.useState('');
const [maintainAspectRatio, setMaintainAspectRatio] = React.useState(true);
```

### Dimension Detection
Extracts current dimensions from:
1. Image style attribute (`style="width: 450px;"`)
2. Image width/height attributes
3. Defaults to empty string if not set

```typescript
const style = attrs.style || '';
const widthMatch = style.match(/width:\s*(\d+)px/);
if (widthMatch) {
  setImageWidth(widthMatch[1]);
}
```

### Applying Dimensions
```typescript
const applyDimensions = () => {
  const width = imageWidth ? `${imageWidth}px` : 'auto';
  const height = maintainAspectRatio ? 'auto' : (imageHeight ? `${imageHeight}px` : 'auto');
  
  editor.commands.updateAttributes('image', {
    style: `width: ${width}; height: ${height}; ...`
  });
};
```

### Key Behaviors
- **Empty input** → Uses 'auto' (responsive sizing)
- **Locked aspect ratio** → Height always 'auto'
- **Unlocked aspect ratio** → Both width and height can be set
- **Max-width constraint** → Always respects `max-width: 100%`

## UI Components Used

### Inputs
```tsx
<Input
  type="number"
  value={imageWidth}
  onChange={(e) => setImageWidth(e.target.value)}
  onBlur={applyDimensions}
  onKeyDown={(e) => {
    if (e.key === 'Enter') {
      applyDimensions();
      editor.commands.focus();
    }
  }}
  className="h-8 w-20 text-xs"
/>
```

### Labels
```tsx
<Label htmlFor="img-width" className="text-xs whitespace-nowrap">
  Width:
</Label>
```

### Toggle Button
```tsx
<Button
  variant="ghost"
  className={maintainAspectRatio && activeClass}
  onClick={() => setMaintainAspectRatio(!maintainAspectRatio)}
>
  {maintainAspectRatio ? "🔒" : "🔓"}
</Button>
```

## Files Modified

### 1. `src/components/ui/rich-text-editor.tsx`
**Changes**:
- Added `NodeSelection` import from `@tiptap/pm/state`
- Added `Input` and `Label` component imports
- Added dimension state variables (width, height, aspect ratio)
- Added `useEffect` to detect current image dimensions
- Added `applyDimensions` function
- Added dimension input UI in MenuBar
- Reordered hooks before early return (React rules)

**New Imports**:
```typescript
import { NodeSelection } from '@tiptap/pm/state';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
```

## User Experience

### Workflow 1: Set Exact Width (Maintain Aspect Ratio)
1. Select image → Dimension controls appear
2. Type `600` in Width field
3. Press Enter
4. ✅ Image resizes to 600px width, height auto-calculated

### Workflow 2: Set Custom Width and Height
1. Select image
2. Click 🔒 → Changes to 🔓
3. Type `500` in Width field
4. Type `300` in Height field
5. Press Enter or click Apply
6. ✅ Image becomes exactly 500×300px

### Workflow 3: Reset to Auto
1. Select image
2. Clear Width input (delete all text)
3. Press Enter
4. ✅ Image returns to responsive 'auto' sizing

## Advantages

### vs. Drag Resize
- ✅ Pixel-perfect precision
- ✅ Exact numerical control
- ✅ Easy to match specific breakpoints
- ✅ Copy/paste values between images
- ✅ Keyboard-friendly workflow

### vs. Previous Button Resize (S, M, L, Full)
- ✅ Unlimited size options
- ✅ Custom dimensions for any use case
- ✅ Professional workflow
- ✅ Better for responsive design

## Testing Checklist

### Basic Functionality
- [ ] Select image → inputs appear with current width
- [ ] Type width (e.g., 450) → Press Enter → Image resizes
- [ ] Blur input (click outside) → Image resizes
- [ ] Click Apply button → Image resizes
- [ ] Clear width → Press Enter → Image becomes responsive (auto)

### Aspect Ratio Lock
- [ ] Default state is locked (🔒)
- [ ] Height input is hidden when locked
- [ ] Height shows "auto" in display
- [ ] Click lock → Unlocks (🔓)
- [ ] Height input appears when unlocked
- [ ] Can set custom height when unlocked

### Edge Cases
- [ ] Very small values (e.g., 50px)
- [ ] Very large values (e.g., 2000px, respects max-width 100%)
- [ ] Non-numeric input (should be prevented by type="number")
- [ ] Negative values (should be prevented)
- [ ] Empty input (defaults to 'auto')
- [ ] Switch between images (inputs update correctly)

### Keyboard Navigation
- [ ] Tab through inputs
- [ ] Enter applies changes
- [ ] Escape cancels (focus returns to editor)
- [ ] Arrow keys adjust values (browser default)

### Integration with Drag Resize
- [ ] Drag corner → Inputs update with new dimensions
- [ ] Type dimension → Can still drag after
- [ ] Both methods work together seamlessly

## Responsive Behavior

### Desktop
- All controls visible in single row
- Comfortable spacing between elements
- Easy to read labels

### Mobile
- Toolbar may wrap to multiple rows
- Controls remain accessible
- Touch-friendly input fields

## Common Use Cases

### 1. Match Design Mockup
"I need this image exactly 680px wide to match our design"
- Select image
- Type `680` in Width
- Press Enter
- ✅ Perfect match

### 2. Responsive Header Image
"I want full-width responsive images"
- Select image
- Clear Width input (leave empty)
- Press Enter
- ✅ Image fills container responsively

### 3. Thumbnail Grid
"All thumbnails should be 200×200px"
- Select image
- Click 🔒 to unlock (🔓)
- Type `200` in Width
- Type `200` in Height
- Press Enter
- ✅ Square thumbnail

### 4. Banner with Fixed Aspect Ratio
"Banner should be 1200px wide, height auto-calculated"
- Select image (🔒 locked by default)
- Type `1200` in Width
- Press Enter
- ✅ Width set, height auto-maintains aspect ratio

## Future Enhancements

Potential improvements:
1. **Unit Selector**: Toggle between px, %, rem, em
2. **Preset Buttons**: Common sizes (300, 500, 700, 1000)
3. **Aspect Ratio Presets**: 16:9, 4:3, 1:1, etc.
4. **Dimension Display**: Show current size in px (e.g., "450 × 300 px")
5. **Max Width Warning**: Alert if size exceeds container
6. **Undo/Redo**: Dimension-specific history
7. **Batch Resize**: Apply same dimensions to multiple images
8. **Smart Suggestions**: Based on content width, common breakpoints

## Related Documentation

- Drag resize: `docs/DRAG_TO_RESIZE_IMAGE_FEATURE.md`
- Image display fix: `docs/IMAGE_DISPLAY_AND_RESIZE_FIX.md`
- Image upload: `docs/PROGRAM_GUIDE_IMAGE_UPLOAD_IMPLEMENTATION.md`

## Conclusion

The manual dimension input feature provides professional-grade image control, perfect for users who need pixel-perfect layouts or want to quickly set specific sizes. Combined with drag-to-resize, users now have complete flexibility: drag for quick adjustments, type for exact dimensions.
