import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Remove Prisma from middleware - it can cause issues in Edge Runtime
// We'll do the admin check in the actual API routes and pages instead

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
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
  // Refresh session if expired - required for Server Components
  // await supabase.auth.getUser()
  const { data: { user } } = await supabase.auth.getUser();

  // Temporarily allow access to /chat for testing
  // if (!user && request.nextUrl.pathname.startsWith('/chat')) {
  //   return NextResponse.redirect(new URL('/login', request.url))
  // }
  if (!user && request.nextUrl.pathname.startsWith('/chat')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

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

  if (user && (request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/signup'))) {
    return NextResponse.redirect(new URL('/chat', request.url));
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
