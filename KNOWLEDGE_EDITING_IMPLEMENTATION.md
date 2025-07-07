# Knowledge Item Text Content Editing

## Overview
The admin knowledge base now supports full editing of text content knowledge items with a rich text editor (WYSIWYG). This feature allows administrators to modify and update text-based knowledge items with proper formatting support.

## Features Implemented

### 1. Edit Button for Text Content
- Text content knowledge items now have an "Edit" button in their dropdown menu
- Only text content items (not uploaded files) can be edited
- The edit button is conditionally displayed based on the item type

### 2. Rich Text Editor
- **Component**: `RichTextEditor` (Tiptap-based)
- **Features**: Bold, italic, headings (H1-H3), lists, blockquotes, code, text alignment
- **Location**: Used in both creation and editing modals
- **Styling**: Comprehensive CSS for both editing and viewing

### 3. Secure HTML Rendering
- **Component**: `SafeHtmlRenderer` (DOMPurify-based)
- **Security**: Sanitizes HTML content to prevent XSS attacks
- **Features**: Detects HTML vs plain text and renders appropriately
- **Formatting**: Preserves rich text formatting when viewing

### 4. Edit Modal
- **Title Field**: Editable input for knowledge item title
- **Content Field**: Rich text editor for content modification
- **Validation**: Requires both title and non-empty content
- **Actions**: Update/Cancel buttons with loading states

### 5. API Endpoint
- **Endpoint**: `PUT /api/knowledge/[id]`
- **Authentication**: User must be authenticated and own the knowledge item
- **Validation**: Server-side validation for title and content
- **Type Restriction**: Only TEXT type knowledge items can be edited
- **Status Update**: Temporarily sets status to PROCESSING during embedding regeneration

## How to Use

### For Administrators:

1. **Navigate to Admin Knowledge Page**
   - Go to `/admin/knowledge`
   - View the list of knowledge items

2. **Edit Text Content**
   - Find a text content knowledge item (shows "Text Content" type)
   - Click the three-dot menu (⋮) on the right
   - Select "Edit" from the dropdown

3. **Modify Content**
   - Update the title in the title field
   - Use the rich text editor to modify content:
     - **Bold/Italic**: Use toolbar buttons or keyboard shortcuts
     - **Headings**: Select H1, H2, or H3 from toolbar
     - **Lists**: Create bulleted or numbered lists
     - **Blockquotes**: Add quoted text blocks
     - **Code**: Inline code formatting
     - **Alignment**: Left, center, or right align text

4. **Save Changes**
   - Click "Update Knowledge Item" to save
   - The system will process the changes and regenerate embeddings
   - Success/error messages will be displayed

## Technical Implementation

### Frontend Components
```
src/app/admin/knowledge/page.tsx - Main admin interface with edit functionality
src/components/ui/rich-text-editor.tsx - Tiptap-based WYSIWYG editor
src/components/ui/safe-html-renderer.tsx - Secure HTML renderer
src/app/globals.css - Rich text styling for both editor and viewer
```

### Backend API
```
src/app/api/knowledge/[id]/route.ts - PUT endpoint for updating knowledge items
```

### Dependencies Added
- `@tiptap/react` - Rich text editor framework
- `@tiptap/starter-kit` - Basic editor extensions
- `@tiptap/extension-*` - Additional formatting extensions
- `dompurify` - HTML sanitization library
- `@types/dompurify` - TypeScript types

### State Management
- `editModalOpen` - Controls edit modal visibility
- `editTitle` - Stores title being edited
- `editContent` - Stores content being edited
- `isUpdating` - Loading state during updates
- `selectedItem` - Currently selected knowledge item

### Validation
- Title must not be empty after trimming
- Content must not be empty (checks for meaningful HTML content)
- Only TEXT type knowledge items can be edited
- User must own the knowledge item being edited

## Security Considerations

1. **HTML Sanitization**: DOMPurify removes potentially dangerous HTML
2. **Authentication**: All edit operations require user authentication
3. **Authorization**: Users can only edit their own knowledge items
4. **Input Validation**: Both client and server-side validation
5. **Type Restrictions**: Only TEXT content can be edited (not uploaded files)

## Future Enhancements

1. **Background Processing**: Currently simulates embedding regeneration with timeout
2. **Version History**: Could track changes and allow rollback
3. **Concurrent Edit Protection**: Could prevent multiple users editing simultaneously
4. **Rich Media Support**: Could extend to support images, tables, etc.
5. **Bulk Edit Operations**: Could support editing multiple items at once

## Testing

The functionality has been tested with:
- ✅ Successful builds (`npm run build`)
- ✅ Lint checks (`npm run lint`)
- ✅ Component integration
- ✅ API endpoint validation
- ✅ Security measures (DOMPurify)
- ✅ Error handling and user feedback

## UI/UX Features

- **Responsive Design**: Works on desktop and mobile
- **Dark Mode Support**: Respects user theme preferences
- **Loading States**: Clear feedback during operations
- **Error Handling**: User-friendly error messages
- **Keyboard Shortcuts**: Standard rich text editor shortcuts
- **Accessibility**: Proper ARIA labels and keyboard navigation
