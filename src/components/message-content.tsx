"use client";

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getTextFormatting } from '@/lib/text-formatting';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface MessageContentProps {
  content: string;
  role: 'user' | 'assistant';
  imageData?: string | string[]; // Support both single and multiple images
  imageMimeType?: string | string[];
  images?: Array<{ // New structured format for multiple images
    data: string;
    mimeType: string;
    name?: string;
  }>;
}

export const MessageContent: React.FC<MessageContentProps> = ({ content, imageData, images }) => {
  const formatting = getTextFormatting(content);
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  
  // Process images - prioritize new structured format, then handle legacy formats
  const processedImages = React.useMemo(() => {
    let rawImages: Array<{ data: string; mimeType: string; name?: string }> = [];
    
    if (images && images.length > 0) {
      rawImages = images;
    } else if (imageData) {
      if (Array.isArray(imageData)) {
        rawImages = imageData.map((data, index) => ({
          data,
          mimeType: 'image/jpeg', // Default fallback
          name: `Image ${index + 1}`
        }));
      } else {
        rawImages = [{
          data: imageData,
          mimeType: 'image/jpeg', // Default fallback
          name: 'Image'
        }];
      }
    }
    
    // Filter out any images with empty or invalid data
    const filtered = rawImages.filter(image =>
      image && typeof image.data === 'string' && image.data.trim().length > 0
    );
    
    // Debug logging to help identify the issue
    if (rawImages.length > 0) {
      console.log('🖼️ MessageContent: Processing images', {
        rawCount: rawImages.length,
        filteredCount: filtered.length,
        rawImages: rawImages.map(img => ({
          hasData: !!img.data,
          dataLength: img.data?.length || 0,
          dataPreview: img.data?.substring(0, 50) + '...'
        }))
      });
    }
    
    return filtered;
  }, [images, imageData]);

  const openImageDialog = (index: number) => {
    setSelectedImageIndex(index);
    setIsImageDialogOpen(true);
  };
  
  return (
    <div
      dir={formatting.dir}
      lang={formatting.lang}
      style={formatting.style}
      className={`message-content ${formatting.className}`}
    >
      {/* Display images if present */}
      {processedImages.length > 0 && (
        <div className={`${content && content !== '[Image]' ? 'mb-3' : ''} w-full overflow-hidden`}>
          {processedImages.length === 1 && processedImages[0]?.data ? (
            // Single image display
            <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
              <DialogTrigger asChild>
                <div className="relative cursor-pointer hover:opacity-80 transition-opacity">
                  <Image
                    src={processedImages[0].data}
                    alt="Uploaded image"
                    width={300}
                    height={256}
                    className="w-full max-w-sm max-h-48 sm:max-h-64 object-contain rounded-lg border border-white/20"
                    style={{ maxWidth: '100%', height: 'auto' }}
                    title="Click to view full size"
                    unoptimized={processedImages[0].data.startsWith('data:')}
                  />
                </div>
              </DialogTrigger>
              <DialogContent className="max-w-[90vw] max-h-[90vh] p-2" showCloseButton={true}>
                <DialogTitle className="sr-only">Image Preview</DialogTitle>
                <div className="flex items-center justify-center">
                  <Image
                    src={processedImages[0].data}
                    alt="Uploaded image - Full size"
                    width={800}
                    height={600}
                    className="max-w-full max-h-[80vh] object-contain rounded-lg"
                    unoptimized={processedImages[0].data.startsWith('data:')}
                  />
                </div>
              </DialogContent>
            </Dialog>
          ) : processedImages.length > 1 ? (
            // Multiple images display
            <div className="space-y-3 w-full">
              <div className="grid grid-cols-2 gap-1.5 sm:gap-2 w-full max-w-xs sm:max-w-sm">
                {processedImages.slice(0, 4).map((image, index) => {
                  // Extra defensive check
                  if (!image?.data || image.data.trim() === '') {
                    return null;
                  }
                  
                  return (
                    <div key={index} className="relative">
                      <div 
                        className="relative cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => openImageDialog(index)}
                      >
                        <Image
                          src={image.data}
                          alt={`Image ${index + 1}`}
                          width={150}
                          height={150}
                          className="w-full aspect-square object-cover rounded-lg border border-white/20"
                          style={{ height: 'auto', minHeight: '60px', maxHeight: '120px' }}
                          unoptimized={image.data.startsWith('data:')}
                        />
                        {index === 3 && processedImages.length > 4 && (
                          <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                            <span className="text-white text-sm font-semibold">
                              +{processedImages.length - 4}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Multi-image dialog */}
              <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
                <DialogContent className="max-w-[90vw] max-h-[90vh] p-2" showCloseButton={true}>
                  <DialogTitle className="sr-only">Image gallery</DialogTitle>
                  <div className="space-y-4">
                    <div className="flex items-center justify-center">
                      {processedImages[selectedImageIndex]?.data && processedImages[selectedImageIndex].data.trim() !== '' && (
                        <Image
                          src={processedImages[selectedImageIndex].data}
                          alt={`Image ${selectedImageIndex + 1}`}
                          width={800}
                          height={600}
                          className="max-w-full max-h-[70vh] object-contain rounded-lg"
                          unoptimized={processedImages[selectedImageIndex].data.startsWith('data:')}
                        />
                      )}
                    </div>
                    
                    {/* Image thumbnails navigation */}
                    {processedImages.length > 1 && (
                      <div className="flex gap-2 justify-center overflow-x-auto pb-2">
                        {processedImages.map((image, index) => {
                          // Extra defensive check for thumbnails
                          if (!image?.data || image.data.trim() === '') {
                            return null;
                          }
                          
                          return (
                            <button
                              key={index}
                              onClick={() => setSelectedImageIndex(index)}
                              className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                                index === selectedImageIndex 
                                  ? 'border-primary ring-2 ring-primary/20' 
                                  : 'border-white/20 hover:border-white/40'
                              }`}
                            >
                              <Image
                                src={image.data}
                                alt={`Thumbnail ${index + 1}`}
                                width={64}
                                height={64}
                                className="w-full h-full object-cover"
                                unoptimized={image.data.startsWith('data:')}
                              />
                            </button>
                          );
                        })}
                      </div>
                    )}
                    
                    {/* Image counter */}
                    <div className="text-center text-sm text-muted-foreground">
                      {selectedImageIndex + 1} of {processedImages.length}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          ) : null}
        </div>
      )}
      
      {/* Only show text content if it exists and is not just the placeholder */}
      {content && content !== '[Image]' && (
        <div className="max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
          // Custom styling for different elements
          p: ({ children }) => (
            <p 
              className="text-sm leading-relaxed mb-3 last:mb-0 text-foreground dark:text-foreground"
              style={{
                lineHeight: formatting.lang === 'ar' ? '1.8' : '1.7',
                wordBreak: 'break-word',
                overflowWrap: 'break-word',
                textRendering: 'optimizeLegibility',
                fontFeatureSettings: '"liga" 1, "calt" 1',
                wordSpacing: formatting.dir === 'auto' ? '0.1em' : 'normal',
              }}
            >
              {children}
            </p>
          ),
          // Bold text
          strong: ({ children }) => (
            <strong className="font-bold text-foreground dark:text-foreground">
              {children}
            </strong>
          ),
          // Italic text
          em: ({ children }) => (
            <em className="italic text-foreground/80 dark:text-foreground/80">
              {children}
            </em>
          ),
          // Unordered lists
          ul: ({ children }) => (
            <ul className="list-disc list-inside space-y-1 my-3 pl-4 text-foreground dark:text-foreground">
              {children}
            </ul>
          ),
          // Ordered lists
          ol: ({ children }) => (
            <ol className="list-decimal space-y-1 my-3 pl-6 text-foreground dark:text-foreground">
              {children}
            </ol>
          ),
          // List items
          li: ({ children }) => (
            <li className="text-sm leading-relaxed mb-1 text-foreground dark:text-foreground">
              {children}
            </li>
          ),
          // Headings
          h1: ({ children }) => (
            <h1 className="text-lg font-bold mb-3 mt-4 first:mt-0 text-foreground dark:text-foreground">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-base font-bold mb-2 mt-3 first:mt-0 text-foreground dark:text-foreground">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm font-bold mb-2 mt-3 first:mt-0 text-foreground dark:text-foreground">
              {children}
            </h3>
          ),
          // Code blocks
          code: ({ children, className }) => {
            const isInline = !className;
            if (isInline) {
              return (
                <code className="px-1.5 py-0.5 rounded bg-muted dark:bg-muted text-xs font-mono text-foreground dark:text-foreground">
                  {children}
                </code>
              );
            }
            return (
              <code className="block p-3 rounded-lg bg-muted dark:bg-muted text-xs font-mono overflow-x-auto text-foreground dark:text-foreground">
                {children}
              </code>
            );
          },
          // Blockquotes
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary dark:border-primary pl-4 my-3 italic text-foreground/70 dark:text-foreground/70">
              {children}
            </blockquote>
          ),
          // Tables
          table: ({ children }) => (
            <div className="overflow-x-auto my-3">
              <table className="min-w-full border border-border dark:border-border">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-border dark:border-border px-3 py-2 bg-muted dark:bg-muted font-semibold text-xs text-foreground dark:text-foreground">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-border dark:border-border px-3 py-2 text-xs text-foreground dark:text-foreground">
              {children}
            </td>
          ),
          // Links
          a: ({ children, href }) => {
            // Regular external links only (article links are handled separately now)
            return (
              <a 
                href={href} 
                className="text-primary dark:text-primary underline hover:no-underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                {children}
              </a>
            );
          },
          // Horizontal rules
          hr: () => (
            <hr className="my-4 border-border dark:border-border" />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
        </div>
      )}
    </div>
  );
};
