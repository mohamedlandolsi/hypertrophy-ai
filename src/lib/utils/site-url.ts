/**
 * Get the site URL for the current environment
 * Uses NEXT_PUBLIC_SITE_URL in production, falls back to window.location.origin for development
 */
export function getSiteUrl(): string {
  // Check if we're on the server side
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_SITE_URL || 'https://hypertroq.com';
  }
  
  // On client side, use environment variable if available, otherwise use current origin
  return process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
}

/**
 * Get the auth callback URL for the current environment
 */
export function getAuthCallbackUrl(next?: string): string {
  const baseUrl = getSiteUrl();
  const nextParam = next ? `?next=${encodeURIComponent(next)}` : '';
  return `${baseUrl}/auth/callback${nextParam}`;
}
