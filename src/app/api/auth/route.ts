/**
 * API Route: /api/auth
 * 
 * PLACEHOLDER za buduću auth implementaciju
 * 
 * Kada se doda NextAuth.js, ovaj folder će sadržati:
 * - /api/auth/[...nextauth]/route.ts - NextAuth handler
 * 
 * Za sada, ovo je placeholder koji vraća informaciju o demo modu.
 */

import { NextRequest, NextResponse } from 'next/server';
import type { ApiResponse } from '@/types';

export async function GET(request: NextRequest) {
  const response: ApiResponse<{ message: string; isDemo: boolean }> = {
    success: true,
    data: {
      message: 'Auth endpoint placeholder. Using demo mode with localStorage.',
      isDemo: true,
    },
  };
  
  return NextResponse.json(response);
}

// ============================================
// BUDUĆE: NextAuth.js implementacija
// ============================================

/*
Kada se aktivira NextAuth.js, kreirati:

src/app/api/auth/[...nextauth]/route.ts:

import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
*/

