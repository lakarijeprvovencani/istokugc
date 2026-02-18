/**
 * Next.js Middleware
 * 
 * 1. Osvežava Supabase sesiju
 * 2. Štiti rute koje zahtevaju autentifikaciju
 * 3. Štiti admin rute (samo za admin ulogu)
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/register',
  '/pricing',
  '/checkout',
  '/poslovi',
  '/auth/callback',
  '/auth/error',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/verify-email',
];

const AUTH_REQUIRED_ROUTES = [
  '/dashboard',
  '/admin',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // API rute imaju svoju autentifikaciju u samim handlerima
  if (pathname.startsWith('/api/')) {
    return supabaseResponse;
  }

  // Javne rute
  if (PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'))) {
    return supabaseResponse;
  }

  // Rute koje zahtevaju autentifikaciju
  if (AUTH_REQUIRED_ROUTES.some(route => pathname.startsWith(route))) {
    if (!user) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      const redirectResponse = NextResponse.redirect(loginUrl);
      supabaseResponse.cookies.getAll().forEach(cookie => {
        redirectResponse.cookies.set(cookie.name, cookie.value);
      });
      return redirectResponse;
    }

    // Admin rute — samo za admin ulogu
    if (pathname.startsWith('/admin')) {
      const role = user.user_metadata?.role;
      if (role !== 'admin') {
        const redirectResponse = NextResponse.redirect(new URL('/dashboard', request.url));
        supabaseResponse.cookies.getAll().forEach(cookie => {
          redirectResponse.cookies.set(cookie.name, cookie.value);
        });
        return redirectResponse;
      }
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};

