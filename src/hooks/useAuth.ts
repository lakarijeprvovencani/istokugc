/**
 * React Hooks za autentifikaciju
 * 
 * TRENUTNO: Koristi DemoContext (localStorage demo mode)
 * BUDUĆE: Koristi NextAuth.js sesije
 * 
 * Ovi hookovi enkapsuliraju svu auth logiku.
 * Kada se poveže pravi auth, samo se promeni implementacija ovde.
 */

'use client';

import { useCallback } from 'react';
import { useDemo } from '@/context/DemoContext';
import { hasRole, isAdmin, canViewCreators, canEditCreator, canDeleteCreator } from '@/lib/auth';
import type { UserRole } from '@/types';

// ============================================
// HOOK: useAuth - Osnovna auth funkcionalnost
// ============================================

interface UseAuthReturn {
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    // Business-specific fields (all businesses have active subscription)
    subscriptionStatus?: 'active' | 'expired' | 'cancelled';
    subscriptionPlan?: 'monthly' | 'yearly';
  } | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (data: { email: string; password: string; name: string; role: 'creator' | 'business' }) => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const { currentUser, isLoggedIn, logout: contextLogout, setUserType, isHydrated } = useDemo();
  
  // ============================================
  // TRENUTNO: Demo mode implementacija
  // ============================================
  
  const user = isLoggedIn ? {
    id: `demo_${currentUser.type}`,
    name: currentUser.name,
    email: currentUser.email,
    role: currentUser.type as UserRole,
    subscriptionStatus: currentUser.subscriptionStatus,
    subscriptionPlan: currentUser.subscriptionPlan,
  } : null;
  
  const login = useCallback(async (email: string, password: string) => {
    // U demo modu, simuliramo login
    // Na osnovu emaila određujemo tip korisnika
    if (email.includes('admin')) {
      setUserType('admin');
    } else if (email.includes('kreator') || email.includes('creator')) {
      setUserType('creator');
    } else {
      setUserType('business');
    }
  }, [setUserType]);
  
  const logout = useCallback(() => {
    contextLogout();
  }, [contextLogout]);
  
  const register = useCallback(async (data: { email: string; password: string; name: string; role: 'creator' | 'business' }) => {
    // U demo modu, odmah "ulogujemo" korisnika
    setUserType(data.role);
  }, [setUserType]);
  
  return {
    user,
    isLoading: !isHydrated,
    isAuthenticated: isLoggedIn,
    login,
    logout,
    register,
  };
  
  // ============================================
  // BUDUĆE: NextAuth.js implementacija
  // ============================================
  
  /*
  import { useSession, signIn, signOut } from 'next-auth/react';
  
  const { data: session, status } = useSession();
  
  const user = session?.user ? {
    id: session.user.id,
    name: session.user.name ?? '',
    email: session.user.email ?? '',
    role: session.user.role,
    subscriptionStatus: session.user.subscriptionStatus,
    subscriptionPlan: session.user.subscriptionPlan,
  } : null;
  
  const login = useCallback(async (email: string, password: string) => {
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });
    
    if (result?.error) {
      throw new Error(result.error);
    }
  }, []);
  
  const logout = useCallback(() => {
    signOut({ callbackUrl: '/' });
  }, []);
  
  const register = useCallback(async (data) => {
    // Poziv API-ja za registraciju
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }
    
    // Auto login nakon registracije
    await login(data.email, data.password);
  }, [login]);
  
  return {
    user,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
    login,
    logout,
    register,
  };
  */
}

// ============================================
// HOOK: usePermissions - Provera dozvola
// ============================================

interface UsePermissionsReturn {
  isAdmin: boolean;
  canViewCreators: boolean;
  canEditCreator: (isOwnProfile?: boolean) => boolean;
  canDeleteCreator: boolean;
  hasRole: (role: UserRole | UserRole[]) => boolean;
}

export function usePermissions(): UsePermissionsReturn {
  const { user } = useAuth();
  
  const userRole = user?.role ?? 'guest';
  
  return {
    isAdmin: isAdmin(userRole),
    canViewCreators: canViewCreators(userRole), // All businesses have active subscription
    canEditCreator: (isOwnProfile?: boolean) => canEditCreator(userRole, isOwnProfile),
    canDeleteCreator: canDeleteCreator(userRole),
    hasRole: (role: UserRole | UserRole[]) => hasRole(userRole, role),
  };
}

// ============================================
// HOOK: useRequireAuth - Redirect ako nije ulogovan
// ============================================

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface UseRequireAuthOptions {
  redirectTo?: string;
  requiredRole?: UserRole | UserRole[];
}

export function useRequireAuth(options: UseRequireAuthOptions = {}) {
  const { redirectTo = '/login', requiredRole } = options;
  const { user, isLoading, isAuthenticated } = useAuth();
  const { hasRole: checkRole } = usePermissions();
  const router = useRouter();
  
  useEffect(() => {
    if (isLoading) return;
    
    if (!isAuthenticated) {
      router.push(redirectTo);
      return;
    }
    
    if (requiredRole && !checkRole(requiredRole)) {
      router.push('/'); // Ili neka forbidden stranica
    }
  }, [isLoading, isAuthenticated, requiredRole, checkRole, router, redirectTo]);
  
  return {
    user,
    isLoading,
    isAuthorized: isAuthenticated && (!requiredRole || checkRole(requiredRole)),
  };
}

// ============================================
// Export all hooks
// ============================================

export default {
  useAuth,
  usePermissions,
  useRequireAuth,
};

