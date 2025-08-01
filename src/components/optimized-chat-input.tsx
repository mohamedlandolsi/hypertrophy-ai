'use client';

import React, { memo, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Send, Image as ImageIcon, X } from 'lucide-react';
import { useDebouncedCallback } from '@/hooks/use-debounced-value';
import { useThrottledCallback } from '@/hooks/use-performance-optimizations';
import { OptimizedImageGrid } from '@/components/optimized-image';
import { SuspendedArabicAwareTextarea } from '@/components/lazy-components';

interface OptimizedChatInputProps {
  input: string;
  isLoading: boolean;
  selectedImages: File[];
  imagePreviews: string[];
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSendMessage: (message: string, images?: File[]) => void;
  onImageSelect: (files: FileList) => void;
  onImageRemove: (index: number) => void;
  onImageClear: () => void;
  onPaste: (e: React.ClipboardEvent<HTMLTextAreaElement>) => void;
  placeholder: string;
  isOnline: boolean;
  t: (key: string) => string;
}

/**
 * Optimized chat input with debounced auto-resize and throttled scroll
 */
export const OptimizedChatInput = memo<OptimizedChatInputProps>(({
  input,
  isLoading,
  selectedImages,
  imagePreviews,
  onInputChange,
  onSendMessage,
  onImageSelect,
  onImageRemove,
  onImageClear,
  onPaste,
  placeholder,
  isOnline
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Debounced auto-resize for better performance (now handled by ArabicAwareTextarea)
  const debouncedResize = useDebouncedCallback(() => {
    // Auto-resize is handled by ArabicAwareTextarea component
  }, 100);

  // Throttled input change handler
  const throttledInputChange = useThrottledCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onInputChange(e);
    debouncedResize();
  }, 16); // 60fps

  const handleSend = useCallback(() => {
    if (!input.trim() && selectedImages.length === 0) return;
    if (isLoading || !isOnline) return;
    
    onSendMessage(input, selectedImages);
  }, [input, selectedImages, isLoading, isOnline, onSendMessage]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const handleImageButtonClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      onImageSelect(files);
    }
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  }, [onImageSelect]);

  // Process images into the format expected by OptimizedImageGrid
  const processedImages = selectedImages.map((file, index) => ({
    data: imagePreviews[index],
    mimeType: file.type,
    name: file.name
  }));

  // Auto-resize on mount
  useEffect(() => {
    debouncedResize();
  }, [input, debouncedResize]);

  return (
    <div className="p-4 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="w-full max-w-5xl mx-auto space-y-3">
        {/* Image previews */}
        {selectedImages.length > 0 && (
          <div className="relative">
            <OptimizedImageGrid
              images={processedImages}
              onRemoveImage={onImageRemove}
              className="max-w-md"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={onImageClear}
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-background shadow-md"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}

        {/* Input area */}
        <div className="flex items-end space-x-3">
          <div className="flex-1">
            <SuspendedArabicAwareTextarea
              value={input}
              onChange={throttledInputChange}
              onKeyDown={handleKeyDown}
              onPaste={onPaste}
              placeholder={placeholder}
              className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
              disabled={isLoading || !isOnline}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Image upload button */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-10 w-10 text-muted-foreground hover:text-foreground transition-colors duration-200"
              onClick={handleImageButtonClick}
              disabled={isLoading || !isOnline}
              data-testid="image-upload-button"
            >
              <ImageIcon className="h-5 w-5" />
            </Button>
            
            {/* Send button */}
            <Button
              type="submit"
              size="icon"
              className="h-10 w-10 shadow-md hover-lift"
              onClick={handleSend}
              disabled={(!input.trim() && selectedImages.length === 0) || isLoading || !isOnline}
              data-testid="send-button"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for optimal re-rendering
  return (
    prevProps.input === nextProps.input &&
    prevProps.isLoading === nextProps.isLoading &&
    prevProps.selectedImages.length === nextProps.selectedImages.length &&
    prevProps.imagePreviews.length === nextProps.imagePreviews.length &&
    prevProps.isOnline === nextProps.isOnline
  );
});

OptimizedChatInput.displayName = 'OptimizedChatInput';
