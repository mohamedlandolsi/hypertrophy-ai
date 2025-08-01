'use client';

import { useCallback, useRef, useEffect } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

/**
 * Custom hook for intelligent caching with TTL and LRU eviction
 */
export function useSmartCache<T>(
  maxSize = 50,
  defaultTTL = 5 * 60 * 1000 // 5 minutes
) {
  const cache = useRef(new Map<string, CacheEntry<T>>());
  const accessOrder = useRef<string[]>([]);

  const cleanup = useCallback(() => {
    const now = Date.now();
    const keysToDelete: string[] = [];

    // Remove expired entries
    cache.current.forEach((entry, key) => {
      if (now > entry.expiry) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => {
      cache.current.delete(key);
      const index = accessOrder.current.indexOf(key);
      if (index > -1) {
        accessOrder.current.splice(index, 1);
      }
    });

    // LRU eviction if cache is too large
    while (cache.current.size > maxSize) {
      const oldestKey = accessOrder.current.shift();
      if (oldestKey) {
        cache.current.delete(oldestKey);
      }
    }
  }, [maxSize]);

  const get = useCallback((key: string): T | null => {
    const entry = cache.current.get(key);
    
    if (!entry) return null;
    
    // Check if expired
    if (Date.now() > entry.expiry) {
      cache.current.delete(key);
      const index = accessOrder.current.indexOf(key);
      if (index > -1) {
        accessOrder.current.splice(index, 1);
      }
      return null;
    }

    // Update access order (move to end)
    const index = accessOrder.current.indexOf(key);
    if (index > -1) {
      accessOrder.current.splice(index, 1);
    }
    accessOrder.current.push(key);

    return entry.data;
  }, []);

  const set = useCallback((key: string, data: T, ttl = defaultTTL) => {
    const now = Date.now();
    
    cache.current.set(key, {
      data,
      timestamp: now,
      expiry: now + ttl
    });

    // Update access order
    const index = accessOrder.current.indexOf(key);
    if (index > -1) {
      accessOrder.current.splice(index, 1);
    }
    accessOrder.current.push(key);

    // Cleanup if needed
    cleanup();
  }, [defaultTTL, cleanup]);

  const remove = useCallback((key: string) => {
    cache.current.delete(key);
    const index = accessOrder.current.indexOf(key);
    if (index > -1) {
      accessOrder.current.splice(index, 1);
    }
  }, []);

  const clear = useCallback(() => {
    cache.current.clear();
    accessOrder.current = [];
  }, []);

  const has = useCallback((key: string): boolean => {
    const entry = cache.current.get(key);
    if (!entry) return false;
    
    // Check if expired
    if (Date.now() > entry.expiry) {
      remove(key);
      return false;
    }
    
    return true;
  }, [remove]);

  // Periodic cleanup
  useEffect(() => {
    const interval = setInterval(cleanup, 60000); // Cleanup every minute
    return () => clearInterval(interval);
  }, [cleanup]);

  return {
    get,
    set,
    remove,
    clear,
    has,
    size: () => cache.current.size
  };
}

/**
 * Hook for caching API responses with intelligent invalidation
 */
export function useApiCache<T = unknown>(maxSize = 30) {
  const cache = useSmartCache<T>(maxSize, 2 * 60 * 1000); // 2 minutes TTL

  const getCachedResponse = useCallback(async (
    key: string,
    fetchFunction: () => Promise<T>,
    ttl?: number
  ) => {
    // Check cache first
    const cached = cache.get(key);
    if (cached) {
      return cached;
    }

    // Fetch fresh data
    try {
      const data = await fetchFunction();
      cache.set(key, data, ttl);
      return data;
    } catch (error) {
      console.error('API cache fetch error:', error);
      throw error;
    }
  }, [cache]); // Add cache dependency

  const invalidateCache = useCallback((keyPattern?: string) => {
    if (keyPattern) {
      // Invalidate specific patterns (simple string matching)
      // In a real implementation, you might want regex support
      cache.clear(); // For now, clear all
    } else {
      cache.clear();
    }
  }, [cache]); // Add cache dependency

  // Use useRef to create stable object reference
  const apiCacheRef = useRef({
    getCachedResponse,
    invalidateCache,
    remove: cache.remove,
    clear: cache.clear,
    has: cache.has,
    size: cache.size
  });

  // Update the methods without changing the object reference
  useEffect(() => {
    apiCacheRef.current.getCachedResponse = getCachedResponse;
    apiCacheRef.current.invalidateCache = invalidateCache;
    apiCacheRef.current.remove = cache.remove;
    apiCacheRef.current.clear = cache.clear;
    apiCacheRef.current.has = cache.has;
    apiCacheRef.current.size = cache.size;
  });

  return apiCacheRef.current;
}
