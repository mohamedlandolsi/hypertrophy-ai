'use client';

import React, { useCallback, useRef } from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import { NodeSelection } from '@tiptap/pm/state';
import StarterKit from '@tiptap/starter-kit';
import TextStyle from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import TextAlign from '@tiptap/extension-text-align';
import ResizableImageExtension from 'tiptap-extension-resize-image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import '@/styles/tiptap-resize.css';
import { 
  Bold, 
  Italic, 
  Strikethrough, 
  List, 
  ListOrdered, 
  Quote, 
  Heading1, 
  Heading2, 
  Heading3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo,
  Redo,
  Code,
  ImageIcon,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
  enableImageUpload?: boolean;
}

const MenuBar = ({ editor, onImageUpload, uploadingImage }: { 
  editor: Editor | null;
  onImageUpload: () => void;
  uploadingImage: boolean;
}) => {
  // State for dimension inputs (must be at top level)
  const [imageWidth, setImageWidth] = React.useState('');
  const [imageHeight, setImageHeight] = React.useState('');
  const [maintainAspectRatio, setMaintainAspectRatio] = React.useState(true);
  const [isImageSelected, setIsImageSelected] = React.useState(false);
  const [forceUpdate, setForceUpdate] = React.useState(0);

  // Listen to editor selection updates
  React.useEffect(() => {
    if (!editor) return;

    const updateSelection = () => {
      setForceUpdate(prev => prev + 1);
    };

    editor.on('selectionUpdate', updateSelection);
    editor.on('transaction', updateSelection);

    return () => {
      editor.off('selectionUpdate', updateSelection);
      editor.off('transaction', updateSelection);
    };
  }, [editor]);

  // Get current image dimensions when selected
  React.useEffect(() => {
    if (!editor) return;
    
    // Check if current selection is an image node
    const { selection } = editor.state;
    const { $from } = selection;
    let imageNode = null;
    
    console.log('Selection update:', {
      selectionType: selection.constructor.name,
      nodeName: selection instanceof NodeSelection ? selection.node.type.name : 'not NodeSelection',
      $fromNodeName: $from.node()?.type.name,
    });
    
    // Check if selection is a NodeSelection containing an image (ResizableImageExtension uses 'imageResize' node type)
    if (selection instanceof NodeSelection && (selection.node.type.name === 'image' || selection.node.type.name === 'imageResize')) {
      imageNode = selection.node;
      setIsImageSelected(true);
      console.log('✅ Image selected (NodeSelection)', imageNode.attrs);
    } else {
      // Check if cursor is inside an image
      const node = $from.node();
      if (node && (node.type.name === 'image' || node.type.name === 'imageResize')) {
        imageNode = node;
        setIsImageSelected(true);
        console.log('✅ Image selected (cursor inside)', imageNode.attrs);
      } else {
        console.log('❌ No image selected');
        setIsImageSelected(false);
        setImageWidth('');
        setImageHeight('');
        return;
      }
    }
    
    // Extract dimensions from the image node
    if (imageNode) {
      const attrs = imageNode.attrs;
      console.log('Reading image attrs:', attrs);
      
      // Try multiple sources for width
      let width = null;
      
      // First check containerStyle (ResizableImageExtension stores dimensions here)
      if (attrs.containerStyle) {
        const containerWidthMatch = attrs.containerStyle.match(/width:\s*(\d+)px/);
        if (containerWidthMatch) width = containerWidthMatch[1];
      }
      
      // Fallback to other attributes
      if (!width && attrs.width) {
        width = attrs.width;
      } else if (!width && attrs['data-width']) {
        width = attrs['data-width'];
      } else if (!width && attrs.style) {
        const widthMatch = attrs.style.match(/width:\s*(\d+)px/);
        if (widthMatch) width = widthMatch[1];
      }
      
      // Try multiple sources for height
      let height = null;
      
      // First check containerStyle
      if (attrs.containerStyle) {
        const containerHeightMatch = attrs.containerStyle.match(/height:\s*(\d+)px/);
        if (containerHeightMatch) height = containerHeightMatch[1];
      }
      
      // Fallback to other attributes
      if (!height && attrs.height) {
        height = attrs.height;
      } else if (!height && attrs['data-height']) {
        height = attrs['data-height'];
      } else if (!height && attrs.style) {
        const heightMatch = attrs.style.match(/height:\s*(\d+)px/);
        if (heightMatch) height = heightMatch[1];
      }
      
      setImageWidth(width ? width.toString() : '');
      setImageHeight(height ? height.toString() : '');
      
      console.log('Set dimensions:', { width, height });
    }
  }, [editor, editor?.state.selection, forceUpdate]);

  // Apply dimensions
  const applyDimensions = () => {
    if (!editor || !isImageSelected) return;
    
    console.log('Applying dimensions:', { imageWidth, imageHeight, maintainAspectRatio });
    
    // Get current selection
    const { selection } = editor.state;
    if (!(selection instanceof NodeSelection)) {
      console.log('Not a NodeSelection, cannot update');
      return;
    }
    
    const node = selection.node;
    console.log('Current node attrs:', node.attrs);
    
    // Build new attributes
    const width = imageWidth ? parseInt(imageWidth) : null;
    const height = maintainAspectRatio ? null : (imageHeight ? parseInt(imageHeight) : null);
    
    const attrs: Record<string, number | string | null> = {
      ...node.attrs,
    };
    
    if (width) {
      attrs.width = width;
      attrs['data-width'] = width;
      // Update containerStyle with new width
      const heightStyle = height ? `height: ${height}px;` : '';
      attrs.containerStyle = `position: relative; width: ${width}px; margin: 0px auto;${heightStyle ? ' ' + heightStyle : ''}`;
    }
    
    if (height && !maintainAspectRatio) {
      attrs.height = height;
      attrs['data-height'] = height;
      // Update containerStyle with height
      const widthValue = width || (node.attrs.width ? parseInt(node.attrs.width) : 315);
      attrs.containerStyle = `position: relative; width: ${widthValue}px; margin: 0px auto; height: ${height}px;`;
    } else if (maintainAspectRatio && width) {
      // Remove height to maintain aspect ratio
      attrs.height = null;
      attrs['data-height'] = null;
      // Ensure containerStyle doesn't have height
      attrs.containerStyle = `position: relative; width: ${width}px; margin: 0px auto;`;
    }
    
    console.log('Updating to attrs:', attrs);
    
    // Update the node
    const result = editor.commands.updateAttributes('imageResize', attrs);
    console.log('Update result:', result);
    
    // Force editor update
    editor.commands.focus();
    
    // Force a re-render to see the updated values
    setTimeout(() => {
      setForceUpdate(prev => prev + 1);
    }, 100);
  };

  if (!editor) {
    return null;
  }

  const buttonClass = "h-8 w-8 p-0";
  const activeClass = "bg-muted";

  return (
    <div className="border-b border-border p-2 flex flex-wrap gap-1 items-center">
      {/* Undo/Redo */}
      <Button
        variant="ghost"
        size="sm"
        className={buttonClass}
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().chain().focus().undo().run()}
      >
        <Undo className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={buttonClass}
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().chain().focus().redo().run()}
      >
        <Redo className="h-4 w-4" />
      </Button>

      <div className="w-px h-6 bg-border mx-1" />

      {/* Headings */}
      <Button
        variant="ghost"
        size="sm"
        className={cn(buttonClass, editor.isActive('heading', { level: 1 }) && activeClass)}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      >
        <Heading1 className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={cn(buttonClass, editor.isActive('heading', { level: 2 }) && activeClass)}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={cn(buttonClass, editor.isActive('heading', { level: 3 }) && activeClass)}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        <Heading3 className="h-4 w-4" />
      </Button>

      <div className="w-px h-6 bg-border mx-1" />

      {/* Text Formatting */}
      <Button
        variant="ghost"
        size="sm"
        className={cn(buttonClass, editor.isActive('bold') && activeClass)}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={cn(buttonClass, editor.isActive('italic') && activeClass)}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={cn(buttonClass, editor.isActive('strike') && activeClass)}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={cn(buttonClass, editor.isActive('code') && activeClass)}
        onClick={() => editor.chain().focus().toggleCode().run()}
      >
        <Code className="h-4 w-4" />
      </Button>

      <div className="w-px h-6 bg-border mx-1" />

      {/* Lists */}
      <Button
        variant="ghost"
        size="sm"
        className={cn(buttonClass, editor.isActive('bulletList') && activeClass)}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={cn(buttonClass, editor.isActive('orderedList') && activeClass)}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="h-4 w-4" />
      </Button>

      <div className="w-px h-6 bg-border mx-1" />

      {/* Alignment */}
      <Button
        variant="ghost"
        size="sm"
        className={cn(buttonClass, editor.isActive({ textAlign: 'left' }) && activeClass)}
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
      >
        <AlignLeft className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={cn(buttonClass, editor.isActive({ textAlign: 'center' }) && activeClass)}
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
      >
        <AlignCenter className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={cn(buttonClass, editor.isActive({ textAlign: 'right' }) && activeClass)}
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
      >
        <AlignRight className="h-4 w-4" />
      </Button>

      <div className="w-px h-6 bg-border mx-1" />

      {/* Quote */}
      <Button
        variant="ghost"
        size="sm"
        className={cn(buttonClass, editor.isActive('blockquote') && activeClass)}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Quote className="h-4 w-4" />
      </Button>

      <div className="w-px h-6 bg-border mx-1" />

      {/* Image Upload */}
      <Button
        variant="ghost"
        size="sm"
        className={buttonClass}
        onClick={onImageUpload}
        disabled={uploadingImage}
        title="Insert image"
      >
        {uploadingImage ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ImageIcon className="h-4 w-4" />
        )}
      </Button>

      {/* Image Dimension Inputs - Show when image is selected */}
      {isImageSelected && (
        <>
          <div className="w-px h-6 bg-border mx-1" />
          <div className="flex items-center gap-2">
            <Label htmlFor="img-width" className="text-xs whitespace-nowrap">Width:</Label>
            <Input
              id="img-width"
              type="number"
              value={imageWidth}
              onChange={(e) => setImageWidth(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault(); // Prevent form submission
                  e.stopPropagation(); // Stop event bubbling
                  applyDimensions();
                  editor.commands.focus();
                }
              }}
              placeholder="Auto"
              className="h-8 w-20 text-xs"
            />
            <span className="text-xs text-muted-foreground">px</span>
          </div>
          
          {!maintainAspectRatio && (
            <div className="flex items-center gap-2">
              <Label htmlFor="img-height" className="text-xs whitespace-nowrap">Height:</Label>
              <Input
                id="img-height"
                type="number"
                value={imageHeight}
                onChange={(e) => setImageHeight(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault(); // Prevent form submission
                    e.stopPropagation(); // Stop event bubbling
                    applyDimensions();
                    editor.commands.focus();
                  }
                }}
                placeholder="Auto"
                className="h-8 w-20 text-xs"
              />
              <span className="text-xs text-muted-foreground">px</span>
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            className={cn("h-8 px-2 text-xs", maintainAspectRatio && activeClass)}
            onClick={(e) => {
              e.preventDefault(); // Prevent form submission
              setMaintainAspectRatio(!maintainAspectRatio);
            }}
            title={maintainAspectRatio ? "Unlock aspect ratio" : "Lock aspect ratio"}
            type="button"
          >
            {maintainAspectRatio ? "🔒" : "🔓"}
          </Button>

          <Button
            variant="default"
            size="sm"
            className="h-8 px-3 text-xs"
            onClick={(e) => {
              e.preventDefault(); // Prevent form submission
              applyDimensions();
            }}
            type="button"
          >
            Apply
          </Button>
        </>
      )}
    </div>
  );
};

export default function RichTextEditor({ 
  content, 
  onChange, 
  placeholder = "Start writing...", 
  className,
  enableImageUpload = false
}: RichTextEditorProps) {
  const { toast } = useToast();
  const [uploadingImage, setUploadingImage] = React.useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      ResizableImageExtension.configure({
        inline: false,
        allowBase64: true,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    onSelectionUpdate: ({ editor }) => {
      // Force re-render when selection changes to update dimension controls
      editor.view.dispatch(editor.state.tr);
    },
    editorProps: {
      attributes: {
        class: 'focus:outline-none min-h-[200px] prose prose-sm max-w-none dark:prose-invert p-4',
      },
    },
  });

  // Upload image to server
  const uploadImage = useCallback(async (file: File): Promise<string | null> => {
    try {
      setUploadingImage(true);

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/admin/programs/upload-guide-image', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to upload image');
      }

      return data.url;
    } catch (error) {
      console.error('Image upload error:', error);
      toast({
        title: 'Upload Failed',
        description: error instanceof Error ? error.message : 'Failed to upload image',
        variant: 'destructive',
      });
      return null;
    } finally {
      setUploadingImage(false);
    }
  }, [toast]);

  // Handle image file selection
  const handleImageUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Handle file input change
  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !editor) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid File',
        description: 'Please select an image file',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: 'File Too Large',
        description: 'Image size must be less than 5MB',
        variant: 'destructive',
      });
      return;
    }

    const url = await uploadImage(file);
    if (url) {
      // Insert image using TipTap Image extension with responsive width
      editor.chain().focus().setImage({ 
        src: url, 
        alt: ''
      }).run();
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [editor, uploadImage, toast]);

  // Handle paste event to upload images
  const handlePaste = useCallback(async (event: Event) => {
    if (!enableImageUpload || !editor) return;

    const clipboardEvent = event as ClipboardEvent;
    const items = clipboardEvent.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        event.preventDefault();
        const file = item.getAsFile();
        if (file) {
          const url = await uploadImage(file);
          if (url) {
            // Insert image using TipTap Image extension
            editor.chain().focus().setImage({ src: url, alt: '' }).run();
          }
        }
        break;
      }
    }
  }, [enableImageUpload, editor, uploadImage]);

  // Add paste event listener
  React.useEffect(() => {
    if (!enableImageUpload || !editor) return;

    const editorElement = editor.view.dom;
    editorElement.addEventListener('paste', handlePaste);

    return () => {
      editorElement.removeEventListener('paste', handlePaste);
    };
  }, [editor, enableImageUpload, handlePaste]);

  // Update editor content when prop changes
  React.useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  return (
    <div className={cn("border border-input rounded-md bg-background relative", className)}>
      <MenuBar 
        editor={editor} 
        onImageUpload={handleImageUpload}
        uploadingImage={uploadingImage}
      />
      <div className="relative">
        <EditorContent 
          editor={editor} 
          className="min-h-[200px] max-h-96 overflow-y-auto"
        />
        {!editor?.getText() && (
          <div className="absolute top-4 left-4 text-muted-foreground pointer-events-none">
            {placeholder}
          </div>
        )}
      </div>
      
      {/* Hidden file input for image upload */}
      {enableImageUpload && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      )}
    </div>
  );
}
