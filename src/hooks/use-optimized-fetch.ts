'use client';

import { useState, useEffect, useCallback } from 'react';
import { useApiCache } from '@/hooks/use-smart-cache';

interface UseFetchOptions {
  cacheKey?: string;
  cacheTTL?: number;
  enabled?: boolean;
  retryCount?: number;
  retryDelay?: number;
}

/**
 * Custom hook for optimized data fetching with caching and retry logic
 */
export function useOptimizedFetch<T>(
  url: string,
  options: UseFetchOptions = {}
) {
  const {
    cacheKey = url,
    cacheTTL = 2 * 60 * 1000, // 2 minutes
    enabled = true,
    retryCount = 3,
    retryDelay = 1000
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Use a stable cache instance - avoid creating new cache on every render
  const cache = useApiCache();

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    setIsLoading(true);
    setError(null);

    let attempts = 0;
    const fetchFunction = async (): Promise<T> => {
      attempts++;
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
      } catch (err) {
        if (attempts < retryCount) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * attempts));
          return fetchFunction();
        }
        throw err;
      }
    };

    try {
      const result = await cache.getCachedResponse(cacheKey, fetchFunction, cacheTTL) as T;
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [url, enabled, cacheKey, cacheTTL, retryCount, retryDelay, cache]); // Add cache to dependencies

  const refetch = useCallback(() => {
    cache.remove(cacheKey);
    // Create a new fetch call without depending on fetchData to avoid circular dependency
    if (enabled) {
      setIsLoading(true);
      setError(null);
      
      let attempts = 0;
      const fetchFunction = async (): Promise<T> => {
        attempts++;
        try {
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return await response.json();
        } catch (err) {
          if (attempts < retryCount) {
            await new Promise(resolve => setTimeout(resolve, retryDelay * attempts));
            return fetchFunction();
          }
          throw err;
        }
      };

      cache.getCachedResponse(cacheKey, fetchFunction, cacheTTL)
        .then(result => setData(result as T))
        .catch(err => setError(err as Error))
        .finally(() => setIsLoading(false));
    }
  }, [url, enabled, cacheKey, cacheTTL, retryCount, retryDelay, cache]); // Add cache to dependencies

  const invalidate = useCallback(() => {
    cache.remove(cacheKey);
    setData(null);
  }, [cacheKey, cache]); // Add cache dependency

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    refetch,
    invalidate
  };
}

/**
 * Hook for optimized chat history fetching with pagination
 */
export function useOptimizedChatHistory(
  page: number = 1,
  limit: number = 10,
  enabled: boolean = true
) {
  const cacheKey = `chat-history-${page}-${limit}`;
  
  return useOptimizedFetch<{
    conversations: unknown[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      hasMore: boolean;
    };
  }>(`/api/conversations?page=${page}&limit=${limit}`, {
    cacheKey,
    enabled,
    cacheTTL: 1 * 60 * 1000 // 1 minute for chat history
  });
}

/**
 * Hook for optimized user plan fetching
 */
export function useOptimizedUserPlan(enabled: boolean = true) {
  return useOptimizedFetch<{
    plan: 'FREE' | 'PRO';
    messagesUsedToday: number;
    freeMessagesRemaining: number;
    dailyLimit: number;
    uploadsThisMonth: number;
    knowledgeItemsCount: number;
    limits?: {
      dailyMessages: number;
      monthlyUploads: number;
      maxFileSize: number;
      hasConversationMemory: boolean;
      canAccessProFeatures: boolean;
      canAccessAdvancedRAG: boolean;
      maxKnowledgeItems: number;
    };
  }>('/api/user/plan', {
    cacheKey: 'user-plan',
    enabled,
    cacheTTL: 30 * 1000 // 30 seconds for user plan
  });
}

/**
 * Hook for optimized user role fetching
 */
export function useOptimizedUserRole(enabled: boolean = true) {
  return useOptimizedFetch<{
    role: string;
  }>('/api/user/role', {
    cacheKey: 'user-role',
    enabled,
    cacheTTL: 5 * 60 * 1000 // 5 minutes for user role
  });
}
