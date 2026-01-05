// Simple in-memory cache for API responses
// This dramatically speeds up repeated requests

type CacheEntry = {
  data: any;
  timestamp: number;
  ttl: number;
};

const memoryCache = new Map<string, CacheEntry>();

// Default TTL values in milliseconds
export const CACHE_TTL = {
  CATEGORIES: 60 * 60 * 1000,      // 1 hour - categories rarely change
  CREATORS_LIST: 2 * 60 * 1000,    // 2 minutes
  JOBS_LIST: 2 * 60 * 1000,        // 2 minutes  
  CREATOR_PROFILE: 5 * 60 * 1000,  // 5 minutes
  BUSINESS_PROFILE: 5 * 60 * 1000, // 5 minutes
  SHORT: 30 * 1000,                // 30 seconds
};

// Get from cache
export function getCache<T>(key: string): T | null {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  
  // Check if expired
  if (Date.now() - entry.timestamp > entry.ttl) {
    memoryCache.delete(key);
    return null;
  }
  
  return entry.data as T;
}

// Set cache
export function setCache(key: string, data: any, ttl: number = CACHE_TTL.SHORT): void {
  memoryCache.set(key, {
    data,
    timestamp: Date.now(),
    ttl,
  });
}

// Clear specific cache
export function clearCache(key: string): void {
  memoryCache.delete(key);
}

// Clear all cache
export function clearAllCache(): void {
  memoryCache.clear();
}

// Clear cache by prefix (e.g., clear all creator-related cache)
export function clearCacheByPrefix(prefix: string): void {
  for (const key of memoryCache.keys()) {
    if (key.startsWith(prefix)) {
      memoryCache.delete(key);
    }
  }
}

// Cached fetch wrapper - use this instead of fetch for GET requests
export async function cachedFetch<T>(
  url: string,
  ttl: number = CACHE_TTL.SHORT,
  options?: RequestInit
): Promise<T> {
  // Only cache GET requests
  if (options?.method && options.method !== 'GET') {
    const response = await fetch(url, options);
    return response.json();
  }
  
  // Check cache first
  const cached = getCache<T>(url);
  if (cached !== null) {
    return cached;
  }
  
  // Fetch and cache
  const response = await fetch(url, options);
  const data = await response.json();
  
  if (response.ok) {
    setCache(url, data, ttl);
  }
  
  return data;
}

// Session storage cache (persists across page navigations)
export function getSessionCache<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const item = sessionStorage.getItem(key);
    if (!item) return null;
    
    const { data, timestamp, ttl } = JSON.parse(item);
    if (Date.now() - timestamp > ttl) {
      sessionStorage.removeItem(key);
      return null;
    }
    
    return data as T;
  } catch {
    return null;
  }
}

export function setSessionCache(key: string, data: any, ttl: number = CACHE_TTL.SHORT): void {
  if (typeof window === 'undefined') return;
  
  try {
    sessionStorage.setItem(key, JSON.stringify({
      data,
      timestamp: Date.now(),
      ttl,
    }));
  } catch {
    // Storage full or unavailable, ignore
  }
}

