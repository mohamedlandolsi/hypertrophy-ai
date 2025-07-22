'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker
        .register('/sw.js', { 
          // Update service worker more frequently
          updateViaCache: 'none'
        })
        .then((registration) => {
          console.log('Service Worker registered successfully:', registration);
          
          // Force immediate check for updates
          registration.update();
          
          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New update available - force refresh to avoid cache issues
                  console.log('New service worker available, refreshing...');
                  window.location.reload();
                }
              });
            }
          });

          // Check for updates every 5 minutes
          setInterval(() => {
            registration.update();
          }, 5 * 60 * 1000);
        })
        .catch((error) => {
          console.warn('Service Worker registration failed:', error);
        });

      // Listen for service worker messages
      navigator.serviceWorker.addEventListener('message', (event) => {
        try {
          if (event.data && event.data.type === 'CACHE_UPDATED') {
            console.log('Cache has been updated');
          }
        } catch (error) {
          console.warn('Service Worker message handling failed:', error);
        }
      });

      // Handle service worker errors
      navigator.serviceWorker.addEventListener('error', (error) => {
        console.warn('Service Worker error:', error);
      });

      // Handle controller change (new SW took control)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('Service Worker controller changed');
        // Optionally reload the page when a new SW takes control
        window.location.reload();
      });

      // Add debug functions to global scope in production
      if (typeof window !== 'undefined') {
        interface HypertroqDebug {
          clearCaches(): Promise<void>;
          unregisterSW(): Promise<void>;
          forceRefresh(): Promise<void>;
          checkCaches(): Promise<void>;
        }

        const hypertroqDebug: HypertroqDebug = {
          async clearCaches() {
            const cacheNames = await caches.keys();
            await Promise.all(cacheNames.map(name => caches.delete(name)));
            console.log('All caches cleared');
          },
          async unregisterSW() {
            const registrations = await navigator.serviceWorker.getRegistrations();
            await Promise.all(registrations.map(reg => reg.unregister()));
            console.log('Service worker unregistered');
          },
          async forceRefresh() {
            await this.clearCaches();
            await this.unregisterSW();
            localStorage.clear();
            sessionStorage.clear();
            window.location.reload();
          },
          async checkCaches() {
            const cacheNames = await caches.keys();
            console.log('Current caches:', cacheNames);
            for (const cacheName of cacheNames) {
              const cache = await caches.open(cacheName);
              const keys = await cache.keys();
              console.log(`Cache ${cacheName}:`, keys.map(req => req.url));
            }
          }
        };

        (window as typeof window & { hypertroqDebug: HypertroqDebug }).hypertroqDebug = hypertroqDebug;
        console.log('Debug functions available: window.hypertroqDebug');
      }
    }
  }, []);

  return null;
}
