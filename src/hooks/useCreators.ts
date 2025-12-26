/**
 * React Hooks za rad sa kreatorima
 * 
 * TRENUTNO: Koristi DemoContext (localStorage)
 * BUDUĆE: Koristi React Query za API pozive
 * 
 * Ovi hookovi enkapsuliraju svu logiku za dohvatanje i mutiranje
 * podataka o kreatorima. Kada se poveže baza, samo se promeni
 * implementacija u ovom fajlu, a komponente ostaju iste.
 */

'use client';

import { useState, useCallback, useMemo } from 'react';
import { useDemo } from '@/context/DemoContext';
import type { Creator, CreatorFilters, UpdateCreatorInput } from '@/types';

// ============================================
// HOOK: useCreators - Lista kreatora
// ============================================

interface UseCreatorsOptions {
  filters?: CreatorFilters;
  includeHidden?: boolean;
}

interface UseCreatorsReturn {
  creators: Creator[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  total: number;
}

export function useCreators(options: UseCreatorsOptions = {}): UseCreatorsReturn {
  const { getCreators, isHydrated } = useDemo();
  const { filters, includeHidden = false } = options;
  
  // ============================================
  // TRENUTNO: Sinhronizovano iz Context-a
  // ============================================
  
  const allCreators = useMemo(() => {
    if (!isHydrated) return [];
    return getCreators(includeHidden);
  }, [getCreators, includeHidden, isHydrated]);
  
  // Primena filtera
  const filteredCreators = useMemo(() => {
    let result = [...allCreators];
    
    if (filters?.category) {
      result = result.filter(c => c.categories.includes(filters.category!));
    }
    
    if (filters?.platform) {
      result = result.filter(c => c.platforms.includes(filters.platform!));
    }
    
    if (filters?.language) {
      result = result.filter(c => c.languages.includes(filters.language!));
    }
    
    if (filters?.priceMin !== undefined) {
      result = result.filter(c => c.priceFrom >= filters.priceMin!);
    }
    
    if (filters?.priceMax !== undefined) {
      result = result.filter(c => c.priceFrom <= filters.priceMax!);
    }
    
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(c => 
        c.name.toLowerCase().includes(searchLower) ||
        c.location.toLowerCase().includes(searchLower)
      );
    }
    
    return result;
  }, [allCreators, filters]);
  
  return {
    creators: filteredCreators,
    isLoading: !isHydrated,
    error: null,
    refetch: () => {}, // Nije potrebno za localStorage
    total: filteredCreators.length,
  };
  
  // ============================================
  // BUDUĆE: React Query implementacija
  // ============================================
  
  /*
  import { useQuery } from '@tanstack/react-query';
  
  const queryKey = ['creators', filters, includeHidden];
  
  const { data, isLoading, error, refetch } = useQuery({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (filters?.category) params.set('category', filters.category);
      if (filters?.platform) params.set('platform', filters.platform);
      if (filters?.language) params.set('language', filters.language);
      if (filters?.priceMin) params.set('priceMin', String(filters.priceMin));
      if (filters?.priceMax) params.set('priceMax', String(filters.priceMax));
      if (filters?.search) params.set('search', filters.search);
      if (filters?.page) params.set('page', String(filters.page));
      if (filters?.pageSize) params.set('pageSize', String(filters.pageSize));
      if (includeHidden) params.set('includeHidden', 'true');
      
      const response = await fetch(`/api/creators?${params}`);
      if (!response.ok) throw new Error('Failed to fetch creators');
      return response.json();
    },
  });
  
  return {
    creators: data?.data?.data ?? [],
    isLoading,
    error: error?.message ?? null,
    refetch,
    total: data?.data?.total ?? 0,
  };
  */
}

// ============================================
// HOOK: useCreator - Pojedinačni kreator
// ============================================

interface UseCreatorReturn {
  creator: Creator | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useCreator(id: string | null): UseCreatorReturn {
  const { getCreatorById, isHydrated } = useDemo();
  
  // ============================================
  // TRENUTNO: Sinhronizovano iz Context-a
  // ============================================
  
  const creator = useMemo(() => {
    if (!isHydrated || !id) return null;
    return getCreatorById(id) || null;
  }, [getCreatorById, id, isHydrated]);
  
  return {
    creator,
    isLoading: !isHydrated,
    error: null,
    refetch: () => {},
  };
  
  // ============================================
  // BUDUĆE: React Query implementacija
  // ============================================
  
  /*
  import { useQuery } from '@tanstack/react-query';
  
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['creator', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await fetch(`/api/creators/${id}`);
      if (!response.ok) throw new Error('Failed to fetch creator');
      const result = await response.json();
      return result.data;
    },
    enabled: !!id,
  });
  
  return {
    creator: data ?? null,
    isLoading,
    error: error?.message ?? null,
    refetch,
  };
  */
}

// ============================================
// HOOK: useUpdateCreator - Ažuriranje kreatora
// ============================================

interface UseUpdateCreatorReturn {
  updateCreator: (id: string, data: UpdateCreatorInput) => Promise<void>;
  isUpdating: boolean;
  error: string | null;
}

export function useUpdateCreator(): UseUpdateCreatorReturn {
  const { updateCreator: contextUpdateCreator } = useDemo();
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // ============================================
  // TRENUTNO: Direktno u Context
  // ============================================
  
  const updateCreator = useCallback(async (id: string, data: UpdateCreatorInput) => {
    setIsUpdating(true);
    setError(null);
    
    try {
      // Simulacija async operacije
      await new Promise(resolve => setTimeout(resolve, 100));
      contextUpdateCreator(id, data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update creator');
      throw err;
    } finally {
      setIsUpdating(false);
    }
  }, [contextUpdateCreator]);
  
  return {
    updateCreator,
    isUpdating,
    error,
  };
  
  // ============================================
  // BUDUĆE: React Query mutation
  // ============================================
  
  /*
  import { useMutation, useQueryClient } from '@tanstack/react-query';
  
  const queryClient = useQueryClient();
  
  const mutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateCreatorInput }) => {
      const response = await fetch(`/api/creators/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update creator');
      return response.json();
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['creators'] });
      queryClient.invalidateQueries({ queryKey: ['creator', id] });
    },
  });
  
  return {
    updateCreator: (id: string, data: UpdateCreatorInput) => 
      mutation.mutateAsync({ id, data }),
    isUpdating: mutation.isPending,
    error: mutation.error?.message ?? null,
  };
  */
}

// ============================================
// HOOK: useDeleteCreator - Brisanje kreatora
// ============================================

interface UseDeleteCreatorReturn {
  deleteCreator: (id: string) => Promise<void>;
  isDeleting: boolean;
  error: string | null;
}

export function useDeleteCreator(): UseDeleteCreatorReturn {
  const { deleteCreator: contextDeleteCreator } = useDemo();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // ============================================
  // TRENUTNO: Direktno u Context
  // ============================================
  
  const deleteCreator = useCallback(async (id: string) => {
    setIsDeleting(true);
    setError(null);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      contextDeleteCreator(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete creator');
      throw err;
    } finally {
      setIsDeleting(false);
    }
  }, [contextDeleteCreator]);
  
  return {
    deleteCreator,
    isDeleting,
    error,
  };
  
  // ============================================
  // BUDUĆE: React Query mutation
  // ============================================
  
  /*
  import { useMutation, useQueryClient } from '@tanstack/react-query';
  
  const queryClient = useQueryClient();
  
  const mutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/creators/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete creator');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creators'] });
    },
  });
  
  return {
    deleteCreator: (id: string) => mutation.mutateAsync(id),
    isDeleting: mutation.isPending,
    error: mutation.error?.message ?? null,
  };
  */
}

// ============================================
// Export all hooks
// ============================================

export default {
  useCreators,
  useCreator,
  useUpdateCreator,
  useDeleteCreator,
};


