/**
 * Authentication Configuration
 * 
 * Ovaj fajl je placeholder za buduću integraciju sa NextAuth.js
 * ili drugim auth sistemom.
 * 
 * OPCIJE:
 * 1. NextAuth.js - najčešći izbor za Next.js, podržava OAuth, Credentials
 * 2. Clerk - managed auth, jednostavan za setup
 * 3. Auth0 - enterprise rešenje
 * 4. Supabase Auth - ako se koristi Supabase za bazu
 * 5. Custom JWT - za potpunu kontrolu
 */

import { UserRole } from '@/types';

// ============================================
// TRENUTNA IMPLEMENTACIJA - Demo mode
// ============================================

/**
 * Trenutno se auth simulira kroz DemoContext.
 * Kada se doda pravi auth, ovaj fajl će eksportovati:
 * - authOptions za NextAuth.js
 * - getServerSession helper
 * - signIn, signOut funkcije
 */

// ============================================
// HELPER FUNKCIJE (koristive odmah)
// ============================================

/**
 * Provera da li korisnik ima određenu ulogu
 */
export function hasRole(userRole: UserRole, requiredRole: UserRole | UserRole[]): boolean {
  const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  return roles.includes(userRole);
}

/**
 * Provera da li je korisnik admin
 */
export function isAdmin(userRole: UserRole): boolean {
  return userRole === 'admin';
}

/**
 * Provera da li korisnik ima pristup kreatorima
 * Note: All business users have active subscription (required to access the app)
 */
export function canViewCreators(userRole: UserRole): boolean {
  if (userRole === 'admin') return true;
  if (userRole === 'creator') return true;
  if (userRole === 'business') return true; // All businesses have active subscription
  return false;
}

/**
 * Provera da li korisnik može da uređuje kreatora
 */
export function canEditCreator(userRole: UserRole, isOwnProfile?: boolean): boolean {
  if (userRole === 'admin') return true;
  if (userRole === 'creator' && isOwnProfile) return true;
  return false;
}

/**
 * Provera da li korisnik može da briše kreatore
 */
export function canDeleteCreator(userRole: UserRole): boolean {
  return userRole === 'admin';
}

// ============================================
// PLACEHOLDER - NextAuth.js konfiguracija
// ============================================

/*
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { prisma } from './db';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  providers: [
    // Email/Password login
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { creator: true, business: true },
        });

        if (!user) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }

        // Note: Business users can only login if they have active subscription
        // Subscription validation happens during registration/payment flow
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          creatorId: user.creator?.id,
          businessId: user.business?.id,
          subscriptionStatus: user.business?.subscriptionStatus,
          subscriptionPlan: user.business?.subscriptionPlan,
        };
      },
    }),
    
    // Google OAuth (opciono)
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.creatorId = user.creatorId;
        token.businessId = user.businessId;
        token.subscriptionStatus = user.subscriptionStatus;
        token.subscriptionPlan = user.subscriptionPlan;
      }
      return token;
    },
    
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role as UserRole;
        session.user.creatorId = token.creatorId as string | undefined;
        session.user.businessId = token.businessId as string | undefined;
        session.user.subscriptionStatus = token.subscriptionStatus as string | undefined;
        session.user.subscriptionPlan = token.subscriptionPlan as string | undefined;
      }
      return session;
    },
  },
  
  pages: {
    signIn: '/login',
    error: '/login',
  },
  
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 dana
  },
};

// Helper za dobijanje sesije na serveru
import { getServerSession } from 'next-auth';

export async function getSession() {
  return await getServerSession(authOptions);
}

// Helper za proveru autentifikacije u API rutama
export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    throw new Error('Unauthorized');
  }
  return session;
}

// Helper za proveru admin pristupa
export async function requireAdmin() {
  const session = await requireAuth();
  if (session.user.role !== 'ADMIN') {
    throw new Error('Forbidden');
  }
  return session;
}
*/

// ============================================
// TYPE AUGMENTATION za NextAuth
// ============================================

/*
// Dodati u types/next-auth.d.ts kada se aktivira NextAuth:

import { UserRole, SubscriptionStatus, SubscriptionType } from '@/types';

declare module 'next-auth' {
  interface User {
    role: UserRole;
    creatorId?: string;
    businessId?: string;
    subscriptionStatus?: SubscriptionStatus;
    subscriptionPlan?: SubscriptionType;
  }
  
  interface Session {
    user: User & {
      id: string;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: UserRole;
    creatorId?: string;
    businessId?: string;
    subscriptionStatus?: SubscriptionStatus;
    subscriptionPlan?: SubscriptionType;
  }
}
*/

export default {
  hasRole,
  isAdmin,
  canViewCreators,
  canEditCreator,
  canDeleteCreator,
};

