/**
 * Utility functions for managing application cache
 */

export async function clearAllCaches(): Promise<void> {
  if ('caches' in window) {
    try {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
      console.log('All caches cleared successfully');
    } catch (error) {
      console.error('Failed to clear caches:', error);
      throw error;
    }
  }
}

export async function clearServiceWorker(): Promise<void> {
  if ('serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(
        registrations.map(registration => registration.unregister())
      );
      console.log('Service worker unregistered successfully');
    } catch (error) {
      console.error('Failed to unregister service worker:', error);
      throw error;
    }
  }
}

export async function forceRefresh(): Promise<void> {
  try {
    // Clear caches
    await clearAllCaches();
    
    // Clear service worker
    await clearServiceWorker();
    
    // Clear local storage and session storage
    if (typeof window !== 'undefined') {
      localStorage.clear();
      sessionStorage.clear();
    }
    
    // Force reload without cache
    window.location.reload();
  } catch (error) {
    console.error('Failed to force refresh:', error);
    // Fallback to simple reload
    window.location.reload();
  }
}

export function isCacheApiSupported(): boolean {
  return 'caches' in window;
}

export function isServiceWorkerSupported(): boolean {
  return 'serviceWorker' in navigator;
}
