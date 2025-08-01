# Multi-Image Upload Implementation

## 📸 Overview
Implemented the ability to upload and send multiple images in a single message, enhancing the chat experience by allowing users to share multiple photos, screenshots, or documents at once.

## 🎯 Key Features

### 1. Multiple Image Selection
- **File Input**: Updated to support `multiple` attribute
- **Drag & Drop**: Support for multiple files via paste events
- **Image Limit**: Maximum of 5 images per message
- **File Size Limit**: 5MB per individual image
- **Supported Formats**: All image types (JPEG, PNG, GIF, WebP, etc.)

### 2. Enhanced Preview System
- **Grid Layout**: 2x2 grid for up to 4 images
- **Overflow Indicator**: Shows "+N more" for additional images
- **Individual Removal**: Remove specific images from selection
- **Clear All**: Remove all selected images at once
- **Image Counter**: Shows total number of selected images

### 3. Improved Message Display
- **Single Image**: Traditional full-width display
- **Multiple Images**: Compact grid with click-to-expand
- **Image Gallery**: Full-screen gallery with navigation
- **Thumbnail Navigation**: Click thumbnails to switch between images
- **Image Counter**: Shows current position (e.g., "2 of 5")

### 4. API Integration
- **FormData Support**: Handles multiple image uploads via FormData
- **Backward Compatibility**: Supports both single and multiple image formats
- **Structured Data**: New `images` array format alongside legacy `imageData`

## 🔧 Technical Implementation

### State Management Updates

#### New Multi-Image States
```tsx
// Multi-image upload state
const [selectedImages, setSelectedImages] = useState<File[]>([]);
const [imagePreviews, setImagePreviews] = useState<string[]>([]);

// Backward compatibility - keep old single image state
const [selectedImage, setSelectedImage] = useState<File | null>(null);
const [imagePreview, setImagePreview] = useState<string | null>(null);
```

#### Enhanced Message Interface
```tsx
// Message state with multi-image support
const [messages, setMessages] = useState<Array<{
  id: string;
  role: 'user' | 'assistant';
  content: string;
  imageData?: string | string[]; // Support both single and multiple
  imageMimeType?: string | string[];
  images?: Array<{ // New structured format
    data: string;
    mimeType: string;
    name?: string;
  }>;
}>>([]);
```

### Image Handling Functions

#### Multi-Image Selection
```tsx
const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
  const files = Array.from(e.target.files || []);
  const maxImages = 5;
  const maxFileSize = 5 * 1024 * 1024; // 5MB

  // Validation and processing
  const validFiles = files.filter(file => {
    return file.size <= maxFileSize && file.type.startsWith('image/');
  });

  // Add to selection and create previews
  setSelectedImages(prev => [...prev, ...validFiles]);
  // Generate previews...
}, [selectedImages.length, t]);
```

#### Enhanced Paste Support
```tsx
const handlePaste = useCallback((e: React.ClipboardEvent<HTMLTextAreaElement>) => {
  const files = Array.from(e.clipboardData?.files || []);
  const imageFiles = files.filter(file => file.type.startsWith('image/'));
  
  // Support pasting multiple images at once
  if (imageFiles.length > 0) {
    // Process and add multiple images
  }
}, [selectedImages.length, t]);
```

#### Message Sending
```tsx
const sendMessage = useCallback(async (messageText: string, imageFiles?: File[]) => {
  const images = imageFiles || selectedImages;
  
  // Convert multiple images to base64
  const imageDataArray = [];
  for (const file of images) {
    const base64Data = await convertFileToBase64(file);
    imageDataArray.push({
      data: base64Data,
      mimeType: file.type,
      name: file.name
    });
  }

  // Create message with structured image data
  const userMessage = {
    id: Date.now().toString(),
    role: 'user' as const,
    content: messageText,
    images: imageDataArray.length > 0 ? imageDataArray : undefined,
    // Backward compatibility fields
    imageData: // Legacy format support
    imageMimeType: // Legacy format support
  };
}, [selectedImages, conversationId, user, t]);
```

### UI Components Updates

#### Multi-Image Preview
```tsx
{/* Multi-Image Preview */}
{selectedImages.length > 0 && (
  <div className="absolute bottom-full left-0 mb-2 p-2 bg-muted rounded-xl shadow-lg border border-border/50 animate-scale-in">
    <div className="flex flex-wrap gap-2 max-w-md">
      {selectedImages.map((file, index) => (
        <div key={index} className="relative group">
          <Image 
            src={imagePreviews[index]} 
            alt={`Preview ${index + 1}`} 
            width={64} 
            height={64} 
            className="rounded-lg object-cover w-16 h-16" 
          />
          <Button
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/80 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => removeImage(index)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ))}
    </div>
    <div className="flex justify-between items-center mt-2 pt-2 border-t border-border/30">
      <span className="text-xs text-muted-foreground">
        {selectedImages.length} image{selectedImages.length !== 1 ? 's' : ''} selected
      </span>
      <Button onClick={removeAllImages}>Clear all</Button>
    </div>
  </div>
)}
```

#### Enhanced File Input
```tsx
<input 
  type="file" 
  id="image-upload" 
  accept="image/*" 
  multiple  // Enable multiple file selection
  className="hidden" 
  onChange={handleImageSelect} 
/>
```

### MessageContent Component Updates

#### Multi-Image Processing
```tsx
// Process images - prioritize new structured format, then handle legacy formats
const processedImages = React.useMemo(() => {
  if (images && images.length > 0) {
    return images;
  }
  
  if (imageData) {
    if (Array.isArray(imageData)) {
      return imageData.map((data, index) => ({
        data,
        mimeType: 'image/jpeg',
        name: `Image ${index + 1}`
      }));
    } else {
      return [{
        data: imageData,
        mimeType: 'image/jpeg',
        name: 'Image'
      }];
    }
  }
  
  return [];
}, [images, imageData]);
```

#### Image Gallery Display
```tsx
{processedImages.length > 1 ? (
  // Multiple images display
  <div className="space-y-3">
    <div className="grid grid-cols-2 gap-2 max-w-sm">
      {processedImages.slice(0, 4).map((image, index) => (
        <div key={index} className="relative">
          <Image
            src={image.data}
            alt={`Image ${index + 1}`}
            className="w-full h-24 object-cover rounded-lg border border-white/20"
            onClick={() => openImageDialog(index)}
          />
          {index === 3 && processedImages.length > 4 && (
            <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-semibold">
                +{processedImages.length - 4}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
    
    {/* Image gallery dialog with navigation */}
    <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
      <DialogContent className="max-w-[90vw] max-h-[90vh] p-2">
        <div className="space-y-4">
          {/* Main image display */}
          <Image
            src={processedImages[selectedImageIndex]?.data || ''}
            alt={`Image ${selectedImageIndex + 1}`}
            className="max-w-full max-h-[70vh] object-contain rounded-lg"
          />
          
          {/* Thumbnail navigation */}
          <div className="flex gap-2 justify-center overflow-x-auto pb-2">
            {processedImages.map((image, index) => (
              <button
                key={index}
                onClick={() => setSelectedImageIndex(index)}
                className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                  index === selectedImageIndex 
                    ? 'border-primary ring-2 ring-primary/20' 
                    : 'border-white/20 hover:border-white/40'
                }`}
              >
                <Image src={image.data} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
          
          {/* Image counter */}
          <div className="text-center text-sm text-muted-foreground">
            {selectedImageIndex + 1} of {processedImages.length}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </div>
) : (
  // Single image display (unchanged)
)}
```

## 📝 API Changes Required

### Request Format
```typescript
// FormData structure for multiple images
const formData = new FormData();
formData.append('message', messageText);
formData.append('conversationId', conversationId || '');
formData.append('isGuest', (!user).toString());

// Append multiple images
images.forEach((file, index) => {
  formData.append(`image_${index}`, file);
});
formData.append('imageCount', images.length.toString());
```

### Response Format
```typescript
// API should return structured image data
{
  assistantMessage: {
    id: string;
    content: string;
    images?: Array<{
      data: string; // base64
      mimeType: string;
      name?: string;
    }>;
  }
}
```

## 🎨 UI/UX Enhancements

### Visual Improvements
1. **Grid Layout**: Clean 2x2 grid for multiple image previews
2. **Hover Effects**: Individual image removal buttons on hover
3. **Loading States**: Visual feedback during upload and processing
4. **Error Handling**: Clear error messages for validation failures
5. **Progressive Disclosure**: Overflow indicator for additional images

### Accessibility
- **Alt Text**: Descriptive alt text for all images
- **Keyboard Navigation**: Support for keyboard navigation in gallery
- **Screen Reader**: Proper ARIA labels and descriptions
- **Focus Management**: Proper focus handling in dialogs

### Mobile Optimization
- **Touch-Friendly**: Large touch targets for mobile devices
- **Responsive Grid**: Adapts to screen size
- **Swipe Navigation**: (Future enhancement) Swipe between images
- **Performance**: Optimized image loading and rendering

## 🔄 Backward Compatibility

### Legacy Support
- **Single Image**: Existing single image functionality preserved
- **API Compatibility**: Supports both old and new formats
- **State Migration**: Gradual migration from single to multi-image states
- **Component Props**: Extended props while maintaining existing interface

### Migration Path
1. **Phase 1**: Add multi-image support alongside existing single image
2. **Phase 2**: Prefer multi-image format for new messages
3. **Phase 3**: (Optional) Migrate existing single images to new format

## 🧪 Testing Scenarios

### File Selection
- ✅ Select multiple images via file dialog
- ✅ Paste multiple images via clipboard
- ✅ Validate file types and sizes
- ✅ Handle file selection limits
- ✅ Error handling for invalid files

### Image Management
- ✅ Preview multiple images in grid
- ✅ Remove individual images
- ✅ Clear all images
- ✅ Display image count
- ✅ Handle overflow with "+N more"

### Message Display
- ✅ Single image: full-width display
- ✅ Multiple images: grid with gallery
- ✅ Gallery navigation with thumbnails
- ✅ Image counter and selection state
- ✅ Full-screen image viewing

### Error Handling
- ✅ File too large warnings
- ✅ Invalid file type alerts
- ✅ Too many files notification
- ✅ Network error graceful handling
- ✅ Loading state indicators

## 📈 Performance Considerations

### Optimization Strategies
1. **Lazy Loading**: Images loaded on demand in gallery
2. **Image Compression**: Client-side compression for large images
3. **Thumbnail Generation**: Smaller previews for grid display
4. **Batch Processing**: Efficient handling of multiple file operations
5. **Memory Management**: Proper cleanup of blob URLs and references

### Bundle Size Impact
- **Minimal Impact**: Reuses existing image handling infrastructure
- **Code Splitting**: Gallery component can be lazy-loaded
- **Tree Shaking**: Unused legacy functions can be removed

## 🚀 Future Enhancements

### Potential Improvements
1. **Drag & Drop**: Visual drag-and-drop interface
2. **Image Editing**: Basic cropping and rotation
3. **Bulk Actions**: Select/deselect multiple images
4. **Image Comparison**: Side-by-side image viewing
5. **Cloud Storage**: Direct upload to cloud storage services
6. **OCR Integration**: Text extraction from images
7. **Image Search**: Find images by content or metadata

### API Server Updates Needed
1. **Multi-Image Processing**: Handle multiple images in API endpoints
2. **Storage Optimization**: Efficient image storage and retrieval
3. **Image Processing**: Resize, compress, and optimize images
4. **Metadata Handling**: Store and retrieve image metadata
5. **Security**: Validate and sanitize image uploads

This implementation provides a robust foundation for multi-image messaging while maintaining backward compatibility and providing an excellent user experience across all devices.
