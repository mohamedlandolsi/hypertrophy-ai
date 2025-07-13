'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered successfully:', registration);
          
          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New update available
                  console.log('New update available');
                }
              });
            }
          });
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
    }
  }, []);

  return null;
}
