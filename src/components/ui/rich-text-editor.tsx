'use client';

import React, { useCallback, useRef } from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextStyle from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import TextAlign from '@tiptap/extension-text-align';
import Image from '@tiptap/extension-image';
import { Button } from '@/components/ui/button';
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
  if (!editor) {
    return null;
  }

  const buttonClass = "h-8 w-8 p-0";
  const activeClass = "bg-muted";

  return (
    <div className="border-b border-border p-2 flex flex-wrap gap-1">
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
      Image.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg my-4',
        },
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
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
      // Insert image using TipTap Image extension
      editor.chain().focus().setImage({ src: url, alt: 'Uploaded image' }).run();
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
            editor.chain().focus().setImage({ src: url, alt: 'Pasted image' }).run();
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
