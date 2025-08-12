import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import createIntlMiddleware from 'next-intl/middleware';
import { PrismaClient } from '@prisma/client';

// Create the intl middleware
const intlMiddleware = createIntlMiddleware({
  locales: ['en', 'ar', 'fr'],
  defaultLocale: 'en',
  localeDetection: false, // Disable automatic locale detection
  localePrefix: 'always'
});

// Create a single Prisma instance for the middleware
const prisma = new PrismaClient();

export async function middleware(request: NextRequest) {
  // Check maintenance mode first (before any other processing)
  const isMaintenanceMode = process.env.MAINTENANCE_MODE === 'true';
  const pathname = request.nextUrl.pathname;
  
  // Allow access to maintenance page and admin routes during maintenance
  const isMaintenancePage = pathname.includes('/maintenance');
  const isApiRoute = pathname.startsWith('/api');
  
  // Handle internationalization first
  const intlResponse = intlMiddleware(request);
  
  let response = intlResponse || NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Get user session
  const { data: { user } } = await supabase.auth.getUser()

  // Enhanced maintenance mode check with admin bypass
  if (isMaintenanceMode && !isMaintenancePage && !isApiRoute) {
    // Check if user is admin (admin users can bypass maintenance mode)
    let isAdmin = false;
    if (user) {
      try {
        // Check user role using Prisma
        const userData = await prisma.user.findUnique({
          where: { id: user.id },
          select: { role: true }
        });
        
        isAdmin = userData?.role === 'admin';
      } catch (error) {
        console.error('Error checking admin status in middleware:', error);
        // If there's an error checking role, treat as non-admin for safety
        isAdmin = false;
      }
    }
    
    // Redirect to maintenance page unless user is admin
    if (!isAdmin) {
      const locale = pathname.match(/^\/(en|ar|fr)/)?.[1] || 'en';
      return NextResponse.redirect(new URL(`/${locale}/maintenance`, request.url));
    }
  }

  // Admin route protection - only check authentication, role check happens in API routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    
    // The actual admin role check will happen in the page/API route
  }

  // Redirect authenticated users away from auth pages
  if (user && (request.nextUrl.pathname.includes('/login') || request.nextUrl.pathname.includes('/signup'))) {
    // Extract locale from current URL or use default
    const pathname = request.nextUrl.pathname;
    const locale = pathname.match(/^\/(en|ar|fr)/)?.[1] || 'en';
    return NextResponse.redirect(new URL(`/${locale}/chat`, request.url));
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - manifest.json (PWA manifest)
     * - robots.txt (robots file)
     * - sw.js (service worker)
     * - *.svg, *.png, *.jpg, *.jpeg, *.gif, *.webp (static assets)
     * Include internationalized pathnames
     */
    '/((?!api|_next/static|_next/image|favicon.ico|manifest.json|robots.txt|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    '/',
    '/(ar|fr|en)/:path*'
  ],
}
