# Clipboard Image Paste Feature Documentation

## Overview
The chat application now supports pasting images directly from the clipboard using Ctrl+V (Windows) or Cmd+V (Mac). This feature allows users to quickly share screenshots, copied images, or any image content with the AI assistant.

## Features Implemented

### 1. **Textarea-Focused Paste**
- When the textarea is focused, users can paste images directly
- Prevents default text paste behavior when an image is detected
- Provides immediate visual feedback

### 2. **Global Paste Handler**
- Works even when the textarea is not focused
- Automatically focuses the textarea after successful paste
- Ensures consistent behavior across the entire chat interface

### 3. **Image Validation**
- **File Type**: Only accepts image files (`image/*`)
- **File Size**: 5MB maximum limit
- **User Feedback**: Clear error messages for invalid files

### 4. **User Experience Enhancements**
- **Confirmation Dialog**: If an image is already selected, asks user to confirm replacement
- **Toast Notifications**: Success and error messages
- **Visual Preview**: Thumbnail preview with remove option
- **Keyboard Shortcuts**: Updated help text includes Cmd+V for paste

## Technical Implementation

### Components Modified

#### 1. `ArabicAwareTextarea` Component
```typescript
interface ArabicAwareTextareaProps {
  // ...existing props
  onPaste?: (e: React.ClipboardEvent<HTMLTextAreaElement>) => void;
}
```

#### 2. Chat Page (`src/app/chat/page.tsx`)
```typescript
// Textarea-specific paste handler
const handlePaste = useCallback((e: React.ClipboardEvent<HTMLTextAreaElement>) => {
  const clipboardData = e.clipboardData;
  
  if (clipboardData && clipboardData.files.length > 0) {
    const file = clipboardData.files[0];
    
    if (file.type.startsWith('image/')) {
      e.preventDefault(); // Prevent default paste
      // Handle image processing...
    }
  }
}, [selectedImage, setSelectedImage, setImagePreview]);

// Global paste handler
useEffect(() => {
  const handleGlobalPaste = (e: ClipboardEvent) => {
    // Only handle if not already handled by textarea
    const target = e.target as Element;
    if (target?.tagName === 'TEXTAREA') return;
    
    // Process clipboard data...
  };

  document.addEventListener('paste', handleGlobalPaste);
  return () => document.removeEventListener('paste', handleGlobalPaste);
}, [selectedImage, setSelectedImage, setImagePreview]);
```

## User Workflow

### Basic Usage
1. **Copy Image**: Copy an image from any source (screenshot, web image, file explorer)
2. **Navigate to Chat**: Go to the chat interface
3. **Paste**: Press `Ctrl+V` (Windows) or `Cmd+V` (Mac)
4. **Preview**: Image appears as preview above the input area
5. **Send**: Click send button or press Enter to send

### Advanced Features
- **Replace Image**: If pasting when an image is already selected, user gets confirmation dialog
- **Remove Image**: Click X button on preview to remove
- **Multiple Sources**: Works with screenshots, copied images from web, file managers, etc.

## Browser Compatibility

### Supported Browsers
- **Chrome**: ✅ Full support
- **Firefox**: ✅ Full support
- **Safari**: ✅ Full support
- **Edge**: ✅ Full support

### Clipboard API Support
- Uses standard `ClipboardEvent` API
- Works with `FileList` from clipboard data
- Compatible with all modern browsers

## Error Handling

### File Size Validation
```typescript
if (file.size > 5 * 1024 * 1024) {
  showToast.error('File too large', 'Please select an image smaller than 5MB');
  return;
}
```

### File Type Validation
```typescript
if (file.type.startsWith('image/')) {
  // Process image
} else {
  // Ignore non-image content
}
```

### User Feedback
- **Success**: "Image pasted - Image has been added to your message"
- **Error**: "File too large - Please select an image smaller than 5MB"
- **Confirmation**: "Replace current image with pasted image?"

## Integration with Existing Features

### Works With
- ✅ **File Upload Button**: Both methods work together
- ✅ **Image Preview**: Same preview system
- ✅ **Send Button**: Same enable/disable logic
- ✅ **Chat State**: Proper cleanup on new chat/logout
- ✅ **Keyboard Shortcuts**: Updated shortcut help

### Backend Integration
- Uses same FormData submission as file upload
- Same image processing pipeline in Gemini API
- Identical error handling and validation

## Testing

### Automated Tests
Run the test script in browser console:
```javascript
// Load test-clipboard-paste.js in browser console
```

### Manual Testing
1. Take a screenshot
2. Go to chat page
3. Press Ctrl+V
4. Verify image preview appears
5. Send message and verify AI response

## Security Considerations

### File Validation
- Size limits prevent oversized uploads
- Type checking ensures only images are processed
- Client-side validation with server-side backup

### Privacy
- Images are processed locally for preview
- No clipboard access without user action
- Standard browser security model applies

## Troubleshooting

### Common Issues
1. **Paste not working**: Check if clipboard contains image data
2. **File too large**: Compress image before copying
3. **Wrong file type**: Ensure clipboard contains image, not text

### Browser Permissions
- No special permissions required
- Uses standard clipboard API
- Works with user-initiated paste actions only

## Future Enhancements

### Potential Improvements
- Multiple image paste support
- Drag and drop integration
- Clipboard history
- Image editing before send
- Paste from URL support

## Dependencies

### Required Libraries
- React (existing)
- Lucide React icons (existing)
- Toast notification system (existing)

### Browser APIs Used
- `ClipboardEvent`
- `FileReader`
- `DataTransfer`
- Standard DOM events

This feature enhances the user experience by providing a quick and intuitive way to share visual content with the AI assistant, making the chat interface more versatile and user-friendly.
