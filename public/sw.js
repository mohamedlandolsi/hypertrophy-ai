// Service Worker for offline functionality
const CACHE_VERSION = Date.now(); // Dynamic versioning
const CACHE_NAME = `hypertroq-v${CACHE_VERSION}`;
const STATIC_CACHE = `hypertroq-static-v${CACHE_VERSION}`;
const DYNAMIC_CACHE = `hypertroq-dynamic-v${CACHE_VERSION}`;

// Cache static assets
const STATIC_ASSETS = [
  '/logo.png',
  '/logo-dark.png',
  '/favicon.ico',
  '/manifest.json'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS).catch((error) => {
          console.warn('Service Worker: Failed to cache some assets:', error);
          // Don't fail installation if some assets can't be cached
          return Promise.resolve();
        });
      })
      .then(() => self.skipWaiting())
      .catch((error) => {
        console.error('Service Worker: Installation failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Delete all old caches that don't match current version
            if (!cacheName.includes(`v${CACHE_VERSION}`)) {
              console.log('Service Worker: Deleting old cache:', cacheName);
              return caches.delete(cacheName).catch((error) => {
                console.warn('Service Worker: Failed to delete cache:', cacheName, error);
              });
            }
            return Promise.resolve();
          })
        );
      })
      .then(() => self.clients.claim())
      .catch((error) => {
        console.error('Service Worker: Activation failed:', error);
      })
  );
});

// Fetch event - network first with cache fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and chrome-extension requests
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }

  // Handle API requests - always try network first
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Only cache successful non-auth API responses
          if (response.status === 200 && !url.pathname.includes('/auth/')) {
            caches.open(DYNAMIC_CACHE)
              .then((cache) => {
                cache.put(request, response.clone()).catch((error) => {
                  console.warn('Service Worker: Failed to cache API response:', error);
                });
              });
          }
          return response;
        })
        .catch(() => {
          // Return cached response only if network fails
          return caches.match(request).then((cachedResponse) => {
            return cachedResponse || new Response('{"error": "Service unavailable"}', {
              status: 503,
              headers: { 'Content-Type': 'application/json' }
            });
          });
        })
    );
    return;
  }

  // Handle navigation requests - always try network first
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful navigation responses
          if (response.status === 200) {
            caches.open(DYNAMIC_CACHE)
              .then((cache) => {
                cache.put(request, response.clone());
              })
              .catch((error) => {
                console.warn('Service Worker: Failed to cache navigation:', error);
              });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cached version only if network fails
          return caches.match(request).then((cachedResponse) => {
            return cachedResponse || caches.match('/').then((homeResponse) => {
              return homeResponse || new Response('Offline', { status: 503 });
            });
          });
        })
    );
    return;
  }

  // Handle static assets - check cache first, then network
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request)
          .then((response) => {
            // Cache static resources
            if (response.status === 200 && (
              url.pathname.includes('/favicon/') || 
              url.pathname.endsWith('.png') || 
              url.pathname.endsWith('.ico') ||
              url.pathname.endsWith('.json')
            )) {
              caches.open(STATIC_CACHE)
                .then((cache) => {
                  cache.put(request, response.clone());
                })
                .catch((error) => {
                  console.warn('Service Worker: Failed to cache static asset:', error);
                });
            }
            return response;
          })
          .catch(() => {
            return new Response('Resource not available', { status: 503 });
          });
      })
      .catch((error) => {
        console.warn('Service Worker: Fetch failed:', error);
        return new Response('Service unavailable', { status: 503 });
      })
  );
});

// Handle background sync for when connection is restored
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered:', event.tag);
  if (event.tag === 'background-sync') {
    event.waitUntil(
      Promise.resolve().then(() => {
        console.log('Service Worker: Background sync completed');
      }).catch((error) => {
        console.warn('Service Worker: Background sync failed:', error);
      })
    );
  }
});

// Handle push notifications (for future use)
self.addEventListener('push', (event) => {
  if (event.data) {
    try {
      const data = event.data.json();
      const options = {
        body: data.body,
        icon: '/logo.png',
        badge: '/logo.png',
        vibrate: [100, 50, 100],
        data: {
          dateOfArrival: Date.now(),
          primaryKey: 1
        }
      };
      
      event.waitUntil(
        self.registration.showNotification(data.title, options)
          .catch((error) => {
            console.warn('Service Worker: Push notification failed:', error);
          })
      );
    } catch (error) {
      console.warn('Service Worker: Push data parsing failed:', error);
    }
  }
});

// Handle unhandled promise rejections
self.addEventListener('unhandledrejection', (event) => {
  console.warn('Service Worker: Unhandled promise rejection:', event.reason);
  event.preventDefault(); // Prevent the default behavior
});

// Handle errors
self.addEventListener('error', (event) => {
  console.error('Service Worker: Error occurred:', event.error);
});
