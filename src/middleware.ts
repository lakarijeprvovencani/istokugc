/**
 * Next.js Middleware
 * 
 * Ovaj middleware proverava autentifikaciju i status pretplate
 * za zaštićene rute.
 * 
 * NAPOMENA: U demo modu, sve provere su preskočene.
 * U produkciji, aktivirajte NextAuth i Subscription provere.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
// import { getToken } from 'next-auth/jwt';

// Rute koje zahtevaju aktivnu pretplatu (business users)
const SUBSCRIPTION_REQUIRED_ROUTES = [
  '/kreatori',      // Pregled kreatora
  '/kreator/',      // Pojedinačni kreator
];

// Rute koje zahtevaju autentifikaciju
const AUTH_REQUIRED_ROUTES = [
  '/dashboard',
  '/admin',
  ...SUBSCRIPTION_REQUIRED_ROUTES,
];

// Rute koje su javne (ne zahtevaju ništa)
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/register',
  '/checkout',
  '/api/stripe/webhook',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ============================================
  // DEMO MODE - Preskoči sve provere
  // ============================================
  
  // U demo modu, dozvoljavamo sve rute
  return NextResponse.next();

  // ============================================
  // PRODUKCIJA - Aktiviraj provere ispod
  // ============================================
  
  /*
  // Javne rute - dozvoli
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // API rute (osim webhook) - posebna logika
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/stripe/webhook')) {
    // API rute imaju svoju autentifikaciju
    return NextResponse.next();
  }

  // Dohvati JWT token
  const token = await getToken({ 
    req: request as any,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Nije ulogovan
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Proveri subscription za business korisnike
  if (SUBSCRIPTION_REQUIRED_ROUTES.some(route => pathname.startsWith(route))) {
    // Admini uvek imaju pristup
    if (token.role === 'admin') {
      return NextResponse.next();
    }

    // Kreatori uvek imaju pristup
    if (token.role === 'creator') {
      return NextResponse.next();
    }

    // Business korisnici - proveri subscription
    if (token.role === 'business') {
      // Proveri subscription status
      const subscriptionResponse = await fetch(
        `${process.env.NEXTAUTH_URL}/api/subscription/status`,
        {
          headers: {
            Cookie: request.headers.get('cookie') || '',
          },
        }
      );

      if (subscriptionResponse.ok) {
        const { canAccessPremium } = await subscriptionResponse.json();
        
        if (!canAccessPremium) {
          // Nema aktivnu pretplatu - redirect na pricing
          return NextResponse.redirect(new URL('/register/biznis', request.url));
        }
      }
    }

    // Guest korisnici - redirect na registraciju
    if (token.role === 'guest' || !token.role) {
      return NextResponse.redirect(new URL('/register/biznis', request.url));
    }
  }

  // Admin rute
  if (pathname.startsWith('/admin') && token.role !== 'admin') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
  */
}

// Definiši koje rute middleware obrađuje
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};


