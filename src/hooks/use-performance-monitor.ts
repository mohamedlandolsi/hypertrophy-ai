'use client';

import { useEffect, useRef, useState } from 'react';

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  componentCount: number;
  rerenderCount: number;
  lastUpdate: number;
}

/**
 * Hook for monitoring React component performance
 */
export function usePerformanceMonitor(componentName: string) {
  const renderStartTime = useRef<number | undefined>(undefined);
  const rerenderCount = useRef(0);
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    memoryUsage: 0,
    componentCount: 0,
    rerenderCount: 0,
    lastUpdate: Date.now()
  });

  useEffect(() => {
    renderStartTime.current = performance.now();
    rerenderCount.current++;
  });

  useEffect(() => {
    if (renderStartTime.current) {
      const renderTime = performance.now() - renderStartTime.current;
      
      // Get memory usage if available
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const memoryUsage = (performance as any).memory?.usedJSHeapSize || 0;
      
      setMetrics(prev => ({
        ...prev,
        renderTime,
        memoryUsage,
        rerenderCount: rerenderCount.current,
        lastUpdate: Date.now()
      }));

      // Log performance warnings in development
      if (process.env.NODE_ENV === 'development') {
        if (renderTime > 16) { // More than 1 frame at 60fps
          console.warn(`🐌 Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`);
        }
        
        if (rerenderCount.current > 10) {
          console.warn(`🔄 High rerender count in ${componentName}: ${rerenderCount.current}`);
        }
      }
    }
  }, [componentName]); // Added dependency to fix warning

  return metrics;
}

/**
 * Hook for measuring API response times
 */
export function useApiPerformanceMonitor() {
  const [apiMetrics, setApiMetrics] = useState<Record<string, {
    averageTime: number;
    lastTime: number;
    callCount: number;
    errorCount: number;
  }>>({});

  const measureApiCall = async <T>(
    endpoint: string,
    apiCall: () => Promise<T>
  ): Promise<T> => {
    const startTime = performance.now();
    
    try {
      const result = await apiCall();
      const duration = performance.now() - startTime;
      
      setApiMetrics(prev => {
        const existing = prev[endpoint] || { averageTime: 0, lastTime: 0, callCount: 0, errorCount: 0 };
        const newCallCount = existing.callCount + 1;
        const newAverageTime = (existing.averageTime * existing.callCount + duration) / newCallCount;
        
        return {
          ...prev,
          [endpoint]: {
            averageTime: newAverageTime,
            lastTime: duration,
            callCount: newCallCount,
            errorCount: existing.errorCount
          }
        };
      });

      // Log slow API calls in development
      if (process.env.NODE_ENV === 'development' && duration > 1000) {
        console.warn(`🐌 Slow API call to ${endpoint}: ${duration.toFixed(2)}ms`);
      }
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      setApiMetrics(prev => {
        const existing = prev[endpoint] || { averageTime: 0, lastTime: 0, callCount: 0, errorCount: 0 };
        
        return {
          ...prev,
          [endpoint]: {
            ...existing,
            lastTime: duration,
            errorCount: existing.errorCount + 1
          }
        };
      });
      
      throw error;
    }
  };

  return {
    apiMetrics,
    measureApiCall
  };
}

/**
 * Component for displaying performance metrics in development
 */
export function PerformanceDebugger({ enabled = process.env.NODE_ENV === 'development' }: { enabled?: boolean }) {
  const [metrics, setMetrics] = useState<{
    fps: number;
    memory: number;
    domNodes: number;
  }>({
    fps: 0,
    memory: 0,
    domNodes: 0
  });

  useEffect(() => {
    if (!enabled) return;

    let frameCount = 0;
    let lastTime = performance.now();
    let animationFrameId: number;

    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime >= lastTime + 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const memory = (performance as any).memory?.usedJSHeapSize || 0;
        const domNodes = document.querySelectorAll('*').length;
        
        setMetrics({
          fps,
          memory: Math.round(memory / 1024 / 1024), // Convert to MB
          domNodes
        });
        
        frameCount = 0;
        lastTime = currentTime;
      }
      
      animationFrameId = requestAnimationFrame(measureFPS);
    };

    measureFPS();

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [enabled]);

  return metrics;
}
