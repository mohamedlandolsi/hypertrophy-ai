'use client';

import { useMemo, useRef, useEffect, useState } from 'react';

/**
 * Virtual scrolling hook for optimizing large lists
 * Renders only visible items to improve performance
 */
export function useVirtualScrolling<T>({
  items,
  itemHeight,
  containerHeight,
  overscan = 5
}: {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}) {
  const scrollElementRef = useRef<HTMLDivElement>(null);

  const virtualItems = useMemo(() => {
    const scrollTop = scrollElementRef.current?.scrollTop || 0;
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );

    const visibleItems = [];
    for (let i = startIndex; i <= endIndex; i++) {
      visibleItems.push({
        index: i,
        item: items[i],
        offsetTop: i * itemHeight
      });
    }

    return {
      virtualItems: visibleItems,
      totalHeight: items.length * itemHeight,
      startIndex,
      endIndex
    };
  }, [items, itemHeight, containerHeight, overscan]);

  return {
    scrollElementRef,
    virtualItems
  };
}

/**
 * Image lazy loading hook with intersection observer
 */
export function useLazyImage(src: string, options?: IntersectionObserverInit) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, ...options }
    );

    observer.observe(img);

    return () => observer.disconnect();
  }, [options]);

  useEffect(() => {
    if (isInView && src) {
      const img = new Image();
      img.onload = () => setIsLoaded(true);
      img.src = src;
    }
  }, [isInView, src]);

  return { imgRef, isLoaded, isInView };
}
