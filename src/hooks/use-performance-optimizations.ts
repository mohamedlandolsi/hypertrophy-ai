'use client';

import { useCallback, useRef, useEffect, useState } from 'react';

/**
 * Custom hook for throttling function calls
 * Useful for scroll handlers, resize handlers, etc.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const lastRun = useRef(Date.now());

  return useCallback((...args: Parameters<T>) => {
    if (Date.now() - lastRun.current >= delay) {
      callback(...args);
      lastRun.current = Date.now();
    }
  }, [callback, delay]);
}

/**
 * Custom hook for intersection observer to implement virtual scrolling
 * and lazy loading
 */
export function useIntersectionObserver(
  options?: IntersectionObserverInit
) {
  const ref = useRef<HTMLElement>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      options
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [options]);

  return { ref, isIntersecting };
}

/**
 * Custom hook for optimized scroll handling
 */
export function useOptimizedScroll(
  callback: (scrollTop: number, isScrollingUp: boolean) => void,
  throttleDelay = 16 // 60fps
) {
  const lastScrollTop = useRef(0);
  const rafId = useRef<number | undefined>(undefined);

  const handleScroll = useThrottledCallback((e: Event) => {
    if (rafId.current) {
      cancelAnimationFrame(rafId.current);
    }

    rafId.current = requestAnimationFrame(() => {
      const target = e.target as HTMLElement;
      const scrollTop = target.scrollTop;
      const isScrollingUp = scrollTop < lastScrollTop.current;
      
      callback(scrollTop, isScrollingUp);
      lastScrollTop.current = scrollTop;
    });
  }, throttleDelay);

  useEffect(() => {
    return () => {
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, []);

  return handleScroll;
}
