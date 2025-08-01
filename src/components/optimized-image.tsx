'use client';

import React, { memo, useState, useCallback } from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OptimizedImageProps {
  src: string;
  alt: string;
  index: number;
  onRemove?: (index: number) => void;
  className?: string;
  priority?: boolean;
  quality?: number;
}

/**
 * Optimized image component with lazy loading and compression
 */
export const OptimizedImage = memo<OptimizedImageProps>(({
  src,
  alt,
  index,
  onRemove,
  className = '',
  priority = false,
  quality = 85
}) => {
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleError = useCallback(() => {
    setIsError(true);
    setIsLoading(false);
  }, []);

  const handleRemove = useCallback(() => {
    if (onRemove) {
      onRemove(index);
    }
  }, [index, onRemove]);

  if (isError) {
    return (
      <div className={`flex items-center justify-center bg-muted rounded-lg p-4 ${className}`}>
        <span className="text-muted-foreground text-sm">Failed to load image</span>
      </div>
    );
  }

  return (
    <div className={`relative group ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50 rounded-lg animate-pulse">
          <div className="w-8 h-8 bg-muted rounded-full animate-pulse" />
        </div>
      )}
      
      <Image
        src={src}
        alt={alt}
        className={`w-full h-auto object-cover rounded-lg transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
        width={400}
        height={300}
        priority={priority}
        quality={quality}
        onLoad={handleLoad}
        onError={handleError}
        loading={priority ? 'eager' : 'lazy'}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />
      
      {onRemove && (
        <Button
          variant="destructive"
          size="icon"
          className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          onClick={handleRemove}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
});

OptimizedImage.displayName = 'OptimizedImage';

interface OptimizedImageGridProps {
  images: Array<{
    data: string;
    mimeType: string;
    name?: string;
  }>;
  onRemoveImage?: (index: number) => void;
  className?: string;
}

/**
 * Optimized image grid with lazy loading
 */
export const OptimizedImageGrid = memo<OptimizedImageGridProps>(({
  images,
  onRemoveImage,
  className = ''
}) => {
  if (!images || images.length === 0) return null;

  return (
    <div className={`grid grid-cols-2 gap-2 ${className}`}>
      {images.map((image, index) => (
        <OptimizedImage
          key={`${index}-${image.data.slice(0, 20)}`}
          src={image.data}
          alt={image.name || `Image ${index + 1}`}
          index={index}
          onRemove={onRemoveImage}
          priority={index < 2} // Load first 2 images with priority
          quality={index < 2 ? 90 : 75} // Higher quality for first 2
        />
      ))}
    </div>
  );
});

OptimizedImageGrid.displayName = 'OptimizedImageGrid';
