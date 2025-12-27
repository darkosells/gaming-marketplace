import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

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
        set(name: string, value: string, options: any) {
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
        remove(name: string, options: any) {
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

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  // Public routes that anyone can access (even logged out)
  const publicRoutes = [
    '/', 
    '/login', 
    '/signup', 
    '/verify-email', 
    '/forgot-password', 
    '/terms', 
    '/privacy', 
    '/cookies',
    '/browse',
  ]
  const isPublicRoute = publicRoutes.some(route => path === route || path.startsWith('/games/') || path.startsWith('/listing/'))

  // Protected routes that REQUIRE email verification
  const protectedRoutes = [
    '/dashboard',
    '/boosting',
    '/customer-dashboard', 
    '/admin',
    '/cart',
    '/checkout',
    '/messages',
    '/settings',
    '/sell',
    '/orders',
  ]
  const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route))

  // If user is not logged in and trying to access protected route
  if (!user && isProtectedRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // If user is logged in, check email verification
  if (user) {
    // Get user profile to check email_verified status
    const { data: profile } = await supabase
      .from('profiles')
      .select('email_verified, role, is_admin')
      .eq('id', user.id)
      .single()

    if (profile) {
      // If email is NOT verified
      if (!profile.email_verified) {
        // Allow access to verification page
        if (path === '/verify-email') {
          return response
        }

        // Allow public browsing routes
        if (isPublicRoute) {
          return response
        }

        // For ANY other page, redirect to verification
        const userEmail = user.email
        return NextResponse.redirect(new URL(`/verify-email?email=${encodeURIComponent(userEmail || '')}`, request.url))
      }

      // Email IS verified - normal routing
      
      // If verified and on verification page, redirect to dashboard
      if (profile.email_verified && path === '/verify-email') {
        if (profile.is_admin) {
          return NextResponse.redirect(new URL('/admin', request.url))
        } else if (profile.role === 'vendor') {
          return NextResponse.redirect(new URL('/dashboard', request.url))
        } else {
          return NextResponse.redirect(new URL('/customer-dashboard', request.url))
        }
      }

      // Redirect from login/signup to dashboard if already logged in and verified
      if (profile.email_verified && (path === '/login' || path === '/signup')) {
        if (profile.is_admin) {
          return NextResponse.redirect(new URL('/admin', request.url))
        } else if (profile.role === 'vendor') {
          return NextResponse.redirect(new URL('/dashboard', request.url))
        } else {
          return NextResponse.redirect(new URL('/customer-dashboard', request.url))
        }
      }
    }
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
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}