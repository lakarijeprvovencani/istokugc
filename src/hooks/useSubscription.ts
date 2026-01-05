/**
 * useSubscription Hook
 * 
 * Custom hook za rad sa pretplatama.
 * Koristi se u komponentama za:
 * - Proveru statusa pretplate
 * - Prikaz subscription info
 * - Akcije (cancel, reactivate, change plan)
 * 
 * NAPOMENA: U demo modu vraća mock podatke.
 * U produkciji, koristi React Query i API rute.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useDemo } from '@/context/DemoContext';
import type { 
  Subscription, 
  SubscriptionStatus, 
  SubscriptionPlan,
  SubscriptionResponse 
} from '@/types/subscription';
import { 
  isSubscriptionActive, 
  canAccessPremiumFeatures, 
  getDaysUntilExpiry,
  formatSubscriptionStatus,
  getStatusColor,
} from '@/types/subscription';

// ============================================
// DEMO MODE - Mock data
// ============================================

const createDemoSubscription = (plan: SubscriptionPlan): Subscription => ({
  id: 'demo_sub_' + Date.now(),
  businessId: 'demo_business',
  stripeCustomerId: 'cus_demo',
  stripeSubscriptionId: 'sub_demo',
  stripePriceId: plan === 'yearly' ? 'price_yearly' : 'price_monthly',
  plan,
  status: 'active',
  currentPeriodStart: new Date(),
  currentPeriodEnd: new Date(
    Date.now() + (plan === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000
  ),
  createdAt: new Date(),
  updatedAt: new Date(),
});

// ============================================
// Hook Interface
// ============================================

interface UseSubscriptionReturn {
  // Data
  subscription: Subscription | null;
  isLoading: boolean;
  error: string | null;
  
  // Status checks
  isActive: boolean;
  canAccessPremium: boolean;
  daysUntilExpiry: number;
  
  // Formatted data
  statusText: string;
  statusColor: string;
  planText: string;
  priceText: string;
  nextBillingDate: string;
  
  // Actions
  cancelSubscription: (immediately?: boolean) => Promise<void>;
  reactivateSubscription: () => Promise<void>;
  changePlan: (newPlan: SubscriptionPlan) => Promise<void>;
  openCustomerPortal: () => Promise<void>;
  
  // Refetch
  refetch: () => Promise<void>;
}

// ============================================
// Hook Implementation
// ============================================

export function useSubscription(): UseSubscriptionReturn {
  const { currentUser } = useDemo();
  
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch subscription data
  const fetchSubscription = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // ============================================
      // DEMO MODE
      // ============================================
      
      if (currentUser.type === 'business') {
        // Simuliraj pretplatu za business korisnike
        const plan = currentUser.subscriptionPlan || 'yearly';
        setSubscription(createDemoSubscription(plan as SubscriptionPlan));
      } else {
        setSubscription(null);
      }

      // ============================================
      // PRODUKCIJA - Uncomment below
      // ============================================
      
      /*
      const response = await fetch('/api/subscription/status');
      
      if (!response.ok) {
        throw new Error('Failed to fetch subscription');
      }
      
      const data: SubscriptionResponse = await response.json();
      setSubscription(data.subscription);
      */
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setSubscription(null);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  // Fetch on mount
  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  // Cancel subscription
  const cancelSubscription = useCallback(async (immediately = false) => {
    try {
      // DEMO MODE
      console.log('📛 Cancel subscription (demo)', { immediately });
      
      if (subscription) {
        setSubscription({
          ...subscription,
          cancelAt: new Date(
            immediately ? Date.now() : subscription.currentPeriodEnd.getTime()
          ),
          canceledAt: new Date(),
        });
      }

      // PRODUKCIJA
      /*
      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cancelImmediately: immediately }),
      });
      
      if (!response.ok) throw new Error('Failed to cancel');
      await fetchSubscription();
      */
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel');
      throw err;
    }
  }, [subscription]);

  // Reactivate subscription
  const reactivateSubscription = useCallback(async () => {
    try {
      // DEMO MODE
      console.log('🔄 Reactivate subscription (demo)');
      
      if (subscription) {
        setSubscription({
          ...subscription,
          cancelAt: undefined,
          canceledAt: undefined,
        });
      }

      // PRODUKCIJA
      /*
      const response = await fetch('/api/subscription/reactivate', {
        method: 'POST',
      });
      
      if (!response.ok) throw new Error('Failed to reactivate');
      await fetchSubscription();
      */
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reactivate');
      throw err;
    }
  }, [subscription]);

  // Change plan
  const changePlan = useCallback(async (newPlan: SubscriptionPlan) => {
    try {
      // DEMO MODE
      console.log('🔄 Change plan (demo):', newPlan);
      
      if (subscription) {
        setSubscription({
          ...subscription,
          plan: newPlan,
          currentPeriodEnd: new Date(
            Date.now() + (newPlan === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000
          ),
        });
      }

      // PRODUKCIJA
      /*
      const response = await fetch('/api/subscription/change-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPlan }),
      });
      
      if (!response.ok) throw new Error('Failed to change plan');
      await fetchSubscription();
      */
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change plan');
      throw err;
    }
  }, [subscription]);

  // Open customer portal
  // Note: Dashboard koristi direktno /api/stripe/create-portal umesto ovog hook-a
  const openCustomerPortal = useCallback(async () => {
    if (currentUser.type !== 'business' || !currentUser.businessId) {
      throw new Error('No business ID available');
    }
    try {
      const response = await fetch('/api/stripe/create-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId: currentUser.businessId }),
      });
      
      if (!response.ok) throw new Error('Failed to create portal session');
      
      const { url } = await response.json();
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open portal');
      throw err;
    }
  }, [currentUser]);

  // Computed values
  const isActive = subscription ? isSubscriptionActive(subscription.status) : false;
  const canAccessPremium = canAccessPremiumFeatures(subscription || undefined);
  const daysUntilExpiry = getDaysUntilExpiry(subscription || undefined);
  
  const statusText = subscription 
    ? formatSubscriptionStatus(subscription.status) 
    : 'Nema pretplate';
  
  const statusColor = subscription 
    ? getStatusColor(subscription.status) 
    : 'text-muted';
  
  const planText = subscription?.plan === 'yearly' ? 'Godišnji' : 'Mesečni';
  
  const priceText = subscription?.plan === 'yearly' ? '€490/godina' : '€49/mesec';
  
  const nextBillingDate = subscription?.currentPeriodEnd 
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString('sr-RS', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '-';

  return {
    // Data
    subscription,
    isLoading,
    error,
    
    // Status
    isActive,
    canAccessPremium,
    daysUntilExpiry,
    
    // Formatted
    statusText,
    statusColor,
    planText,
    priceText,
    nextBillingDate,
    
    // Actions
    cancelSubscription,
    reactivateSubscription,
    changePlan,
    openCustomerPortal,
    
    // Refetch
    refetch: fetchSubscription,
  };
}

export default useSubscription;





