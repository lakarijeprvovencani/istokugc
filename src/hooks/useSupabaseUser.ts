'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

export interface CreatorProfile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string | null;
  location: string;
  bio: string;
  photo: string | null;
  categories: string[];
  platforms: string[];
  languages: string[];
  price_from: number;
  instagram: string | null;
  tiktok: string | null;
  youtube: string | null;
  portfolio: any[];
  status: 'pending' | 'approved' | 'rejected' | 'deactivated';
  rejection_reason: string | null;
  profile_views: number;
  created_at: string;
  updated_at: string;
}

export interface BusinessProfile {
  id: string;
  user_id: string;
  company_name: string;
  email: string;
  description: string | null;
  website: string | null;
  industry: string | null;
  subscription_type: 'monthly' | 'yearly' | null;
  subscription_status: 'active' | 'expired' | 'none';
  created_at: string;
  updated_at: string;
}

export interface UserData {
  id: string;
  email: string;
  role: 'creator' | 'business' | 'admin';
}

interface UseSupabaseUserReturn {
  user: User | null;
  userData: UserData | null;
  creatorProfile: CreatorProfile | null;
  businessProfile: BusinessProfile | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  logout: () => Promise<void>;
}

export function useSupabaseUser(): UseSupabaseUserReturn {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [creatorProfile, setCreatorProfile] = useState<CreatorProfile | null>(null);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      
      // Dohvati Supabase Auth sesiju
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !authUser) {
        setUser(null);
        setUserData(null);
        setCreatorProfile(null);
        setBusinessProfile(null);
        setIsLoading(false);
        return;
      }

      setUser(authUser);

      // Dohvati user podatke iz naše tabele
      const { data: userRow, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (userError) {
        console.error('User fetch error:', userError);
        setError('Greška pri učitavanju korisnika');
        setIsLoading(false);
        return;
      }

      setUserData(userRow);

      // Dohvati profil prema roli
      if (userRow.role === 'creator') {
        const { data: creator, error: creatorError } = await supabase
          .from('creators')
          .select('*')
          .eq('user_id', authUser.id)
          .single();

        if (creatorError) {
          console.error('Creator fetch error:', creatorError);
        } else {
          setCreatorProfile(creator);
        }
      } else if (userRow.role === 'business') {
        const { data: business, error: businessError } = await supabase
          .from('businesses')
          .select('*')
          .eq('user_id', authUser.id)
          .single();

        if (businessError) {
          console.error('Business fetch error:', businessError);
        } else {
          setBusinessProfile(business);
        }
      }

    } catch (err) {
      console.error('useSupabaseUser error:', err);
      setError('Greška pri učitavanju podataka');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    
    // Očisti localStorage
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    
    // Reset state
    setUser(null);
    setUserData(null);
    setCreatorProfile(null);
    setBusinessProfile(null);
    
    // Redirect
    window.location.href = '/login';
  };

  useEffect(() => {
    fetchUserData();

    // Slušaj auth promene
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setUserData(null);
        setCreatorProfile(null);
        setBusinessProfile(null);
      } else if (event === 'SIGNED_IN') {
        fetchUserData();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    user,
    userData,
    creatorProfile,
    businessProfile,
    isLoading,
    error,
    refetch: fetchUserData,
    logout,
  };
}





