import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import createIntlMiddleware from 'next-intl/middleware';

// Create the intl middleware
const intlMiddleware = createIntlMiddleware({
  locales: ['en', 'ar', 'fr'],
  defaultLocale: 'en',
  localeDetection: false, // Disable automatic locale detection
  localePrefix: 'always'
});

export async function middleware(request: NextRequest) {
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

  // Admin route protection - only check authentication, role check happens in API routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    console.log('🔍 Middleware: Admin route accessed');
    
    if (!user) {
      console.log('❌ Middleware: No user found, redirecting to login');
      return NextResponse.redirect(new URL('/login', request.url))
    }
    
    console.log(`👤 Middleware: User authenticated, allowing access to admin route`);
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
