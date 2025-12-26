/**
 * Centralizovani tipovi za aplikaciju
 * 
 * Ovi tipovi se koriste kroz celu aplikaciju i spremni su za mapiranje
 * u Prisma/Drizzle šeme kada se baza poveže.
 * 
 * NAPOMENA: Trenutno se koriste iz mockData.ts, ali kada se poveže baza,
 * svi importi će se prebaciti na ovaj fajl.
 */

// ============================================
// CREATOR TYPES
// ============================================

export type CreatorStatus = 'pending' | 'approved' | 'deactivated';

export interface Creator {
  id: string;
  name: string;
  photo: string;
  bio: string;
  categories: string[];
  platforms: string[];
  languages: string[];
  location: string;
  priceFrom: number;
  portfolio: PortfolioItem[];
  email: string;
  phone?: string;
  instagram?: string;
  tiktok?: string;
  youtube?: string;
  approved: boolean;
  status?: CreatorStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface PortfolioItem {
  type: 'youtube' | 'tiktok' | 'instagram';
  url: string;
  thumbnail: string;
}

export interface CreateCreatorInput {
  name: string;
  email: string;
  bio: string;
  photo?: string;
  categories: string[];
  platforms: string[];
  languages: string[];
  location: string;
  priceFrom: number;
  phone?: string;
  instagram?: string;
  tiktok?: string;
  youtube?: string;
}

export interface UpdateCreatorInput {
  name?: string;
  bio?: string;
  photo?: string;
  categories?: string[];
  platforms?: string[];
  languages?: string[];
  location?: string;
  priceFrom?: number;
  phone?: string;
  instagram?: string;
  tiktok?: string;
  youtube?: string;
  status?: CreatorStatus;
  approved?: boolean;
}

// ============================================
// BUSINESS TYPES
// ============================================

export type SubscriptionType = 'monthly' | 'yearly';
export type SubscriptionStatus = 'active' | 'expired' | 'none';

export interface Business {
  id: string;
  companyName: string;
  email: string;
  description?: string;
  website?: string;
  industry?: string;
  subscriptionType: SubscriptionType | null;
  subscriptionStatus: SubscriptionStatus;
  subscribedAt?: string;
  expiresAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateBusinessInput {
  companyName: string;
  email: string;
  password: string; // Za registraciju
  description?: string;
  website?: string;
  industry?: string;
}

export interface UpdateBusinessInput {
  companyName?: string;
  email?: string;
  description?: string;
  website?: string;
  industry?: string;
}

// ============================================
// USER & AUTH TYPES
// ============================================

export type UserRole = 'guest' | 'creator' | 'business' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  // Business-specific fields (all businesses must have active subscription)
  subscriptionStatus?: SubscriptionStatus;
  subscriptionPlan?: SubscriptionType;
  subscriptionExpiresAt?: string;
  creatorId?: string; // Ako je kreator, link ka Creator profilu
  businessId?: string; // Ako je biznis, link ka Business profilu
  createdAt: string;
  updatedAt?: string;
}

export interface Session {
  user: User;
  expires: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
  role: 'creator' | 'business';
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ============================================
// FILTER TYPES
// ============================================

export interface CreatorFilters {
  category?: string;
  platform?: string;
  language?: string;
  priceMin?: number;
  priceMax?: number;
  search?: string;
  status?: CreatorStatus;
  page?: number;
  pageSize?: number;
}

// ============================================
// SUBSCRIPTION TYPES (export sve iz subscription.ts)
// ============================================

export type {
  SubscriptionStatus as DetailedSubscriptionStatus,
  SubscriptionPlan,
  BillingInterval,
  Subscription,
  BusinessWithSubscription,
  Invoice,
  PaymentMethod,
  WebhookEvent,
  SubscriptionResponse,
  CheckoutSessionResponse,
  PortalSessionResponse,
} from './subscription';

export {
  isSubscriptionActive,
  canAccessPremiumFeatures,
  getDaysUntilExpiry,
  formatSubscriptionStatus,
  getStatusColor,
} from './subscription';

// ============================================
// CONSTANTS (re-export iz mockData dok se ne poveže baza)
// ============================================

export { categories, platforms, languages } from '@/lib/mockData';

