'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { 
  UserType, 
  DemoUser, 
  demoUsers, 
  Creator, 
  CreatorStatus,
  Review,
  ReviewStatus,
} from '@/lib/mockData';
import type { Rating, CreateReviewInput } from '@/types/review';
import { createClient } from '@/lib/supabase/client';

// No more mock creators - all data comes from Supabase
const allBaseCreators: Creator[] = [];

// Type for creator modifications stored in localStorage
interface CreatorModification {
  status?: CreatorStatus;
  approved?: boolean;
  deleted?: boolean;
  rejectionReason?: string;
  profileViews?: number;
  // Add other editable fields as needed
  name?: string;
  bio?: string;
  location?: string;
  email?: string;
  phone?: string;
  instagram?: string;
  priceFrom?: number;
  categories?: string[];
  platforms?: string[];
  languages?: string[];
  photo?: string;
}

// Input type for creating new creator
export interface CreateCreatorInput {
  name: string;
  email: string;
  bio: string;
  location: string;
  priceFrom: number;
  categories: string[];
  platforms: string[];
  languages: string[];
  instagram?: string;
  tiktok?: string;
  youtube?: string;
  phone?: string;
  photo?: string;
  portfolio?: {
    id: string;
    type: 'youtube' | 'tiktok' | 'instagram' | 'upload';
    url: string;
    thumbnail: string;
    description?: string;
  }[];
}

interface DemoContextType {
  currentUser: DemoUser;
  setUserType: (type: UserType) => void;
  updateCurrentUser: (updates: Partial<DemoUser>) => void; // Update current user properties
  loginAsNewCreator: (creatorId: string, creatorName?: string, creatorEmail?: string, creatorPhoto?: string) => void;
  loginAsNewBusiness: (businessId: string, companyName: string, subscriptionStatus?: string, subscriptionPlan?: string, logo?: string) => void;
  isLoggedIn: boolean;
  logout: () => void;
  isHydrated: boolean;
  // Profile ownership
  isOwnProfile: (creatorId: string) => boolean;
  getOwnCreatorId: () => string | undefined;
  getOwnCreatorStatus: () => { status: CreatorStatus | undefined; rejectionReason?: string } | undefined;
  // Creator management
  getCreators: (includeHidden?: boolean) => Creator[];
  getCreatorById: (id: string) => Creator | undefined;
  updateCreator: (id: string, updates: Partial<Creator>) => void;
  deleteCreator: (id: string) => void;
  addCreator: (input: CreateCreatorInput) => Creator;
  addCreatorFromSupabase: (creator: Creator) => void;
  creatorModifications: Record<string, CreatorModification>;
  // Favorites management
  favorites: string[];
  addToFavorites: (creatorId: string) => void;
  removeFromFavorites: (creatorId: string) => void;
  isFavorite: (creatorId: string) => boolean;
  getFavoriteCreators: () => Creator[];
  // Recently viewed management
  recentlyViewed: string[];
  addToRecentlyViewed: (creatorId: string) => void;
  getRecentlyViewedCreators: (limit?: number) => Creator[];
  // Profile views management
  incrementProfileViews: (creatorId: string) => void;
  // Settings management
  userSettings: UserSettings;
  updateSettings: (settings: Partial<UserSettings>) => void;
  // Review management
  reviews: Review[];
  getReviewsForCreator: (creatorId: string, onlyApproved?: boolean) => Review[];
  getReviewsByBusiness: (businessId: string) => Review[];
  getPendingReviews: () => Review[];
  getAllReviews: () => Review[];
  addReview: (input: CreateReviewInput) => Review;
  updateReview: (reviewId: string, updates: { rating?: Rating; comment?: string }) => void;
  deleteReview: (reviewId: string) => void;
  approveReview: (reviewId: string) => void;
  rejectReview: (reviewId: string, reason?: string) => void;
  addReplyToReview: (reviewId: string, reply: string) => void;
  updateReplyToReview: (reviewId: string, reply: string) => void;
  deleteReplyFromReview: (reviewId: string) => void;
  hasBusinessReviewedCreator: (businessId: string, creatorId: string) => boolean;
  getBusinessReviewForCreator: (businessId: string, creatorId: string) => Review | undefined;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

const STORAGE_KEY = 'demoUserType';
const CREATOR_MODS_KEY = 'creatorModifications';
const REVIEWS_KEY = 'reviews';
const FAVORITES_KEY = 'favoriteCreators';
const SETTINGS_KEY = 'userSettings';
const RECENTLY_VIEWED_KEY = 'recentlyViewedCreators';
const NEW_CREATORS_KEY = 'newCreators';
const CURRENT_CREATOR_ID_KEY = 'currentCreatorId'; // ID of logged in creator's profile
const CURRENT_CREATOR_KEY = 'currentCreator'; // Full creator data (id, name)
const CURRENT_BUSINESS_KEY = 'currentBusiness'; // Logged in business data

// User settings interface
export interface UserSettings {
  notifications: {
    email: boolean;
    newCreators: boolean;
    promotions: boolean;
  };
  profile: {
    name: string;
    email: string;
    phone?: string;
    companyName?: string;
  };
}

// Default settings
const defaultSettings: UserSettings = {
  notifications: {
    email: true,
    newCreators: true,
    promotions: false,
  },
  profile: {
    name: '',
    email: '',
    phone: '',
    companyName: '',
  },
};

export function DemoProvider({ children }: { children: ReactNode }) {
  // Initialize with guest, will be updated by useEffect if localStorage has saved value
  const [currentUser, setCurrentUser] = useState<DemoUser>(demoUsers.guest);
  const [isHydrated, setIsHydrated] = useState(false);
  const [creatorModifications, setCreatorModifications] = useState<Record<string, CreatorModification>>({});
  const [newCreators, setNewCreators] = useState<Creator[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>([]);
  const [userSettings, setUserSettings] = useState<UserSettings>(defaultSettings);
  const [loggedInCreatorId, setLoggedInCreatorId] = useState<string | undefined>(undefined);
  const [loggedInBusiness, setLoggedInBusiness] = useState<{ id: string; companyName: string } | undefined>(undefined);

  // Load saved data from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Load user type
      const savedUserType = localStorage.getItem(STORAGE_KEY);
      
      // For creator users, load saved creator data
      if (savedUserType === 'creator') {
        const savedCreator = localStorage.getItem(CURRENT_CREATOR_KEY);
        const savedCreatorId = localStorage.getItem(CURRENT_CREATOR_ID_KEY);
        
        if (savedCreator) {
          try {
            const creatorData = JSON.parse(savedCreator);
            setCurrentUser({
              type: 'creator',
              name: creatorData.name || 'Kreator',
              email: creatorData.email || '',
              creatorId: creatorData.id,
              photo: creatorData.photo || undefined, // Load photo from localStorage
            });
            setLoggedInCreatorId(creatorData.id);
          } catch (e) {
            // Set minimal user without mock data - checkSupabaseSession will fill in details
            if (savedCreatorId) {
              setCurrentUser({
                type: 'creator',
                name: '', // Will be filled by checkSupabaseSession
                email: '',
                creatorId: savedCreatorId,
              });
              setLoggedInCreatorId(savedCreatorId);
            }
          }
        } else if (savedCreatorId) {
          // Set minimal user without mock data - checkSupabaseSession will fill in details
          setCurrentUser({
            type: 'creator',
            name: '', // Will be filled by checkSupabaseSession
            email: '',
            creatorId: savedCreatorId,
          });
          setLoggedInCreatorId(savedCreatorId);
        }
      }
      // For business users, load saved business data to get the real businessId
      else if (savedUserType === 'business') {
        const savedBusiness = localStorage.getItem(CURRENT_BUSINESS_KEY);
        if (savedBusiness) {
          try {
            const businessData = JSON.parse(savedBusiness);
            setCurrentUser({
              type: 'business',
              name: businessData.companyName || '',
              email: '',
              businessId: businessData.id,
              companyName: businessData.companyName,
              logo: businessData.logo || undefined,
              subscriptionStatus: businessData.subscriptionStatus as 'active' | 'expired' | 'cancelled' | undefined,
              subscriptionPlan: businessData.subscriptionPlan as 'monthly' | 'yearly' | undefined,
              subscriptionExpiresAt: businessData.subscriptionExpiresAt,
            });
            setLoggedInBusiness(businessData);
          } catch (e) {
            // Set minimal user - checkSupabaseSession will fill in details
            setCurrentUser({
              type: 'business',
              name: '',
              email: '',
            });
          }
        } else {
          // Set minimal user - checkSupabaseSession will fill in details
          setCurrentUser({
            type: 'business',
            name: '',
            email: '',
          });
        }
      } else if (savedUserType === 'admin') {
        setCurrentUser(demoUsers.admin);
      } else if (savedUserType === 'guest') {
        setCurrentUser(demoUsers.guest);
      }
      
      // Load creator modifications
      const savedMods = localStorage.getItem(CREATOR_MODS_KEY);
      if (savedMods) {
        try {
          setCreatorModifications(JSON.parse(savedMods));
        } catch (e) {
          console.error('Failed to parse creator modifications:', e);
        }
      }
      
      // Load reviews
      const savedReviews = localStorage.getItem(REVIEWS_KEY);
      if (savedReviews) {
        try {
          setReviews(JSON.parse(savedReviews));
        } catch (e) {
          console.error('Failed to parse reviews:', e);
        }
      }
      
      // Load favorites
      const savedFavorites = localStorage.getItem(FAVORITES_KEY);
      if (savedFavorites) {
        try {
          setFavorites(JSON.parse(savedFavorites));
        } catch (e) {
          console.error('Failed to parse favorites:', e);
        }
      }
      
      // Load recently viewed
      const savedRecentlyViewed = localStorage.getItem(RECENTLY_VIEWED_KEY);
      if (savedRecentlyViewed) {
        try {
          setRecentlyViewed(JSON.parse(savedRecentlyViewed));
        } catch (e) {
          console.error('Failed to parse recently viewed:', e);
        }
      }
      
      // Load settings
      const savedSettings = localStorage.getItem(SETTINGS_KEY);
      if (savedSettings) {
        try {
          setUserSettings(JSON.parse(savedSettings));
        } catch (e) {
          console.error('Failed to parse settings:', e);
        }
      }
      
      // Load new creators
      const savedNewCreators = localStorage.getItem(NEW_CREATORS_KEY);
      if (savedNewCreators) {
        try {
          setNewCreators(JSON.parse(savedNewCreators));
        } catch (e) {
          console.error('Failed to parse new creators:', e);
        }
      }
      
      // Load logged in creator ID
      const savedCreatorId = localStorage.getItem(CURRENT_CREATOR_ID_KEY);
      if (savedCreatorId) {
        setLoggedInCreatorId(savedCreatorId);
      }
      
      // Load logged in business data
      const savedBusiness = localStorage.getItem(CURRENT_BUSINESS_KEY);
      if (savedBusiness) {
        try {
          setLoggedInBusiness(JSON.parse(savedBusiness));
        } catch (e) {
          console.error('Failed to parse business data:', e);
        }
      }
      
      setIsHydrated(true);
      
      // Check Supabase session and restore real user data
      checkSupabaseSession();

      // Listen for auth state changes (login/logout from anywhere in the app)
      const supabase = createClient();
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
        if (event === 'SIGNED_IN') {
          checkSupabaseSession();
        } else if (event === 'SIGNED_OUT') {
          setCurrentUser(demoUsers.guest);
          setLoggedInCreatorId(undefined);
          setLoggedInBusiness(undefined);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  // Check Supabase session and restore user data
  const checkSupabaseSession = async () => {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // Fetch user role from public.users
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .single();
        
        if (userData?.role === 'creator') {
          // Fetch creator profile
          const { data: creatorData } = await supabase
            .from('creators')
            .select('*')
            .eq('user_id', session.user.id)
            .single();
          
          if (creatorData) {
            const creatorUser: DemoUser = {
              type: 'creator',
              name: creatorData.name,
              creatorId: creatorData.id,
              email: creatorData.email || '',
              photo: creatorData.photo || undefined,
            };
            setCurrentUser(creatorUser);
            setLoggedInCreatorId(creatorData.id);
            localStorage.setItem(STORAGE_KEY, 'creator');
            localStorage.setItem(CURRENT_CREATOR_ID_KEY, creatorData.id);
            localStorage.setItem(CURRENT_CREATOR_KEY, JSON.stringify({ id: creatorData.id, name: creatorData.name, email: creatorData.email, photo: creatorData.photo }));
          }
        } else if (userData?.role === 'business') {
          // Fetch business profile
          const { data: businessData } = await supabase
            .from('businesses')
            .select('*')
            .eq('user_id', session.user.id)
            .single();
          
          if (businessData) {
            const businessUser: DemoUser = {
              type: 'business',
              name: businessData.company_name,
              companyName: businessData.company_name,
              businessId: businessData.id,
              email: businessData.email || '',
              logo: businessData.logo || undefined,
              subscriptionStatus: businessData.subscription_status,
              subscriptionPlan: businessData.subscription_type,
              subscriptionExpiresAt: businessData.expires_at,
              website: businessData.website,
              industry: businessData.industry,
              description: businessData.description,
            };
            setCurrentUser(businessUser);
            setLoggedInBusiness({ id: businessData.id, companyName: businessData.company_name });
            localStorage.setItem(STORAGE_KEY, 'business');
            localStorage.setItem(CURRENT_BUSINESS_KEY, JSON.stringify({ 
              id: businessData.id, 
              companyName: businessData.company_name,
              subscriptionStatus: businessData.subscription_status,
              subscriptionPlan: businessData.subscription_type,
              subscriptionExpiresAt: businessData.expires_at,
            }));
          }
        } else if (userData?.role === 'admin') {
          setCurrentUser(demoUsers.admin);
          localStorage.setItem(STORAGE_KEY, 'admin');
        }
      }
    } catch (error) {
      console.error('Error checking Supabase session:', error);
    }
  };

  // Save reviews to localStorage whenever they change
  const saveReviews = (newReviews: Review[]) => {
    setReviews(newReviews);
    if (typeof window !== 'undefined') {
      localStorage.setItem(REVIEWS_KEY, JSON.stringify(newReviews));
    }
  };

  const setUserType = (type: UserType) => {
    setCurrentUser(demoUsers[type]);
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, type);
    }
  };
  
  // Update current user properties (e.g., subscription status)
  const updateCurrentUser = (updates: Partial<DemoUser>) => {
    setCurrentUser(prev => ({ ...prev, ...updates }));
  };

  // Login as a newly registered creator (links user to their creator profile)
  const loginAsNewCreator = (creatorId: string, creatorName?: string, creatorEmail?: string, creatorPhoto?: string) => {
    const creatorUser: DemoUser = {
      type: 'creator',
      name: creatorName || '',
      email: creatorEmail || '',
      creatorId: creatorId,
      photo: creatorPhoto || undefined,
    };
    setCurrentUser(creatorUser);
    setLoggedInCreatorId(creatorId);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, 'creator');
      localStorage.setItem(CURRENT_CREATOR_ID_KEY, creatorId);
      localStorage.setItem(CURRENT_CREATOR_KEY, JSON.stringify({ id: creatorId, name: creatorName, email: creatorEmail, photo: creatorPhoto }));
    }
  };

  // Login as a newly registered business (after successful payment)
  const loginAsNewBusiness = (businessId: string, companyName: string, subscriptionStatus?: string, subscriptionPlan?: string, logo?: string) => {
    const businessUser: DemoUser = {
      type: 'business',
      name: companyName,
      email: '',
      businessId: businessId,
      companyName: companyName,
      logo: logo || undefined,
      subscriptionStatus: (subscriptionStatus || 'active') as 'active' | 'expired' | 'cancelled',
      subscriptionPlan: (subscriptionPlan || 'monthly') as 'monthly' | 'yearly',
    };
    setCurrentUser(businessUser);
    setLoggedInBusiness({ id: businessId, companyName });
    
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, 'business');
      localStorage.setItem(CURRENT_BUSINESS_KEY, JSON.stringify({ id: businessId, companyName, subscriptionStatus, subscriptionPlan, logo }));
    }
  };

  const logout = async () => {
    // Sign out from Supabase
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out from Supabase:', error);
    }
    
    setCurrentUser(demoUsers.guest);
    setLoggedInCreatorId(undefined);
    setLoggedInBusiness(undefined);
    // Remove from localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(CURRENT_CREATOR_ID_KEY);
      localStorage.removeItem(CURRENT_CREATOR_KEY);
      localStorage.removeItem(CURRENT_BUSINESS_KEY);
    }
  };

  const isLoggedIn = currentUser.type !== 'guest';

  // Check if the current user owns a specific creator profile
  const isOwnProfile = (creatorId: string): boolean => {
    if (currentUser.type !== 'creator') return false;
    // Use loggedInCreatorId for newly registered creators, fallback to demo creatorId
    const myCreatorId = loggedInCreatorId || currentUser.creatorId;
    return myCreatorId === creatorId;
  };

  // Get the current user's creator ID (if they are a creator)
  const getOwnCreatorId = (): string | undefined => {
    if (currentUser.type !== 'creator') return undefined;
    // Use loggedInCreatorId for newly registered creators, fallback to demo creatorId
    return loggedInCreatorId || currentUser.creatorId;
  };

  // Get the current user's creator status (if they are a creator)
  const getOwnCreatorStatus = (): { status: CreatorStatus | undefined; rejectionReason?: string } | undefined => {
    if (currentUser.type !== 'creator') return undefined;
    // Use loggedInCreatorId for newly registered creators
    const myCreatorId = loggedInCreatorId || currentUser.creatorId;
    if (!myCreatorId) return undefined;
    const creator = getCreatorById(myCreatorId);
    if (!creator) return undefined;
    return {
      status: creator.status,
      rejectionReason: creator.rejectionReason
    };
  };

  // ============================================
  // FAVORITES MANAGEMENT
  // ============================================

  // Save favorites to localStorage
  const saveFavorites = (newFavorites: string[]) => {
    setFavorites(newFavorites);
    if (typeof window !== 'undefined') {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
    }
  };

  // Add creator to favorites
  const addToFavorites = (creatorId: string) => {
    if (!favorites.includes(creatorId)) {
      saveFavorites([...favorites, creatorId]);
    }
  };

  // Remove creator from favorites
  const removeFromFavorites = (creatorId: string) => {
    saveFavorites(favorites.filter(id => id !== creatorId));
  };

  // Check if creator is in favorites
  const isFavorite = (creatorId: string): boolean => {
    return favorites.includes(creatorId);
  };

  // Get all favorite creators
  const getFavoriteCreators = (): Creator[] => {
    return favorites
      .map(id => getCreatorById(id))
      .filter((c): c is Creator => c !== undefined);
  };

  // ============================================
  // RECENTLY VIEWED MANAGEMENT
  // ============================================

  // Add creator to recently viewed (max 10, most recent first)
  // Using useCallback with functional update to avoid dependency on recentlyViewed
  const addToRecentlyViewed = useCallback((creatorId: string) => {
    setRecentlyViewed(prev => {
      // Remove if already exists, then add to front
      const filtered = prev.filter(id => id !== creatorId);
      const newList = [creatorId, ...filtered].slice(0, 10); // Keep max 10
      
      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(newList));
      }
      
      return newList;
    });
  }, []);

  // Get recently viewed creators (defined after getCreatorById, so no useCallback needed)
  const getRecentlyViewedCreators = (limit: number = 5): Creator[] => {
    return recentlyViewed
      .slice(0, limit)
      .map(id => getCreatorById(id))
      .filter((c): c is Creator => c !== undefined);
  };

  // ============================================
  // PROFILE VIEWS MANAGEMENT
  // ============================================

  // Increment profile views for a creator
  // Using useCallback to make it stable
  const incrementProfileViews = useCallback((creatorId: string) => {
    // Check if we already counted this view in current session
    const viewKey = `profileView_${creatorId}`;
    if (typeof window !== 'undefined' && sessionStorage.getItem(viewKey)) {
      return; // Already counted in this session
    }
    
    // Mark as viewed in this session
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(viewKey, 'true');
    }
    
    // Get current views from modifications and increment
    setCreatorModifications(prev => {
      const currentMod = prev[creatorId] || {};
      const currentViews = currentMod.profileViews || 0;
      const updated = {
        ...prev,
        [creatorId]: {
          ...currentMod,
          profileViews: currentViews + 1,
        },
      };
      
      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(CREATOR_MODS_KEY, JSON.stringify(updated));
      }
      
      return updated;
    });
  }, []);

  // ============================================
  // SETTINGS MANAGEMENT
  // ============================================

  // Update user settings
  const updateSettings = (newSettings: Partial<UserSettings>) => {
    const updated = {
      ...userSettings,
      ...newSettings,
      notifications: {
        ...userSettings.notifications,
        ...(newSettings.notifications || {}),
      },
      profile: {
        ...userSettings.profile,
        ...(newSettings.profile || {}),
      },
    };
    setUserSettings(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    }
  };

  // ============================================
  // CREATOR MANAGEMENT
  // ============================================

  // Combine all creators (base + new)
  const getAllBaseCreators = (): Creator[] => {
    return [...allBaseCreators, ...newCreators];
  };

  // Get all creators with modifications applied
  const getCreators = (includeHidden = false): Creator[] => {
    return getAllBaseCreators()
      .map(creator => {
        const mods = creatorModifications[creator.id];
        if (mods) {
          return { ...creator, ...mods };
        }
        return creator;
      })
      .filter(creator => {
        // Filter out deleted creators
        const mods = creatorModifications[creator.id];
        if (mods?.deleted) return false;
        
        // If includeHidden is false, filter out non-approved creators
        if (!includeHidden) {
          // Check if creator has a status modification
          if (mods?.status) {
            return mods.status === 'approved';
          }
          // Otherwise use the original approved field
          return creator.approved;
        }
        return true;
      });
  };

  // Get a single creator by ID with modifications applied
  const getCreatorById = (id: string): Creator | undefined => {
    const creator = getAllBaseCreators().find(c => c.id === id);
    if (!creator) return undefined;
    
    const mods = creatorModifications[id];
    if (mods?.deleted) return undefined;
    
    if (mods) {
      return { ...creator, ...mods };
    }
    return creator;
  };

  // Add a new creator
  const addCreator = (input: CreateCreatorInput): Creator => {
    const newCreator: Creator = {
      id: `creator-${Date.now()}`,
      name: input.name,
      bio: input.bio,
      photo: input.photo || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
      location: input.location,
      categories: input.categories,
      platforms: input.platforms,
      languages: input.languages,
      priceFrom: input.priceFrom,
      portfolio: input.portfolio || [],
      email: input.email,
      phone: input.phone,
      instagram: input.instagram,
      tiktok: input.tiktok,
      youtube: input.youtube,
      approved: false,
      status: 'pending',
      createdAt: new Date().toISOString().split('T')[0],
    };
    
    const updatedCreators = [...newCreators, newCreator];
    setNewCreators(updatedCreators);
    
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(NEW_CREATORS_KEY, JSON.stringify(updatedCreators));
    }
    
    return newCreator;
  };

  // Add creator from Supabase (sa postojećim ID-jem)
  const addCreatorFromSupabase = (creator: Creator): void => {
    // Proveri da li već postoji
    const exists = newCreators.some(c => c.id === creator.id);
    if (exists) return;
    
    const updatedCreators = [...newCreators, creator];
    setNewCreators(updatedCreators);
    
    // NE čuvamo u localStorage jer su podaci preveliki (slike)
    // Supabase je source of truth
  };

  // Update a creator
  const updateCreator = (id: string, updates: Partial<Creator>) => {
    const newMods = {
      ...creatorModifications,
      [id]: {
        ...creatorModifications[id],
        ...updates,
      },
    };
    setCreatorModifications(newMods);
    
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(CREATOR_MODS_KEY, JSON.stringify(newMods));
    }
  };

  // Delete a creator (soft delete)
  const deleteCreator = (id: string) => {
    const newMods = {
      ...creatorModifications,
      [id]: {
        ...creatorModifications[id],
        deleted: true,
      },
    };
    setCreatorModifications(newMods);
    
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(CREATOR_MODS_KEY, JSON.stringify(newMods));
    }
  };

  // ============================================
  // REVIEW MANAGEMENT FUNCTIONS
  // ============================================

  // Get reviews for a specific creator
  const getReviewsForCreator = (creatorId: string, onlyApproved = true): Review[] => {
    return reviews.filter(r => {
      if (r.creatorId !== creatorId) return false;
      if (onlyApproved) return r.status === 'approved';
      return true;
    });
  };

  // Get reviews left by a specific business
  const getReviewsByBusiness = (businessId: string): Review[] => {
    return reviews.filter(r => r.businessId === businessId);
  };

  // Get all pending reviews (for admin)
  const getPendingReviews = (): Review[] => {
    return reviews.filter(r => r.status === 'pending');
  };

  // Get all reviews (for admin)
  const getAllReviews = (): Review[] => {
    return reviews;
  };

  // Check if business has already reviewed a creator
  const hasBusinessReviewedCreator = (businessId: string, creatorId: string): boolean => {
    return reviews.some(r => r.businessId === businessId && r.creatorId === creatorId);
  };

  // Get the business's review for a creator
  const getBusinessReviewForCreator = (businessId: string, creatorId: string): Review | undefined => {
    return reviews.find(r => r.businessId === businessId && r.creatorId === creatorId);
  };

  // Add a new review
  const addReview = (input: CreateReviewInput): Review => {
    const newReview: Review = {
      id: `rev-${Date.now()}`,
      creatorId: input.creatorId,
      businessId: currentUser.type === 'business' ? (currentUser.businessId || 'b1') : 'unknown', // Uses businessId from user profile
      businessName: currentUser.companyName || currentUser.name,
      rating: input.rating,
      comment: input.comment,
      status: 'pending', // All new reviews start as pending
      createdAt: new Date().toISOString().split('T')[0],
    };
    
    const newReviews = [...reviews, newReview];
    saveReviews(newReviews);
    
    return newReview;
  };

  // Update a review (business can update their own)
  const updateReview = (reviewId: string, updates: { rating?: Rating; comment?: string }) => {
    const newReviews = reviews.map(r => {
      if (r.id === reviewId) {
        return {
          ...r,
          ...updates,
          status: 'pending' as ReviewStatus, // Reset to pending if edited
          updatedAt: new Date().toISOString().split('T')[0],
        };
      }
      return r;
    });
    saveReviews(newReviews);
  };

  // Delete a review (admin only)
  const deleteReview = (reviewId: string) => {
    const newReviews = reviews.filter(r => r.id !== reviewId);
    saveReviews(newReviews);
  };

  // Approve a review (admin only)
  const approveReview = (reviewId: string) => {
    const newReviews = reviews.map(r => {
      if (r.id === reviewId) {
        return {
          ...r,
          status: 'approved' as ReviewStatus,
          updatedAt: new Date().toISOString().split('T')[0],
        };
      }
      return r;
    });
    saveReviews(newReviews);
  };

  // Reject a review (admin only)
  const rejectReview = (reviewId: string, reason?: string) => {
    const newReviews = reviews.map(r => {
      if (r.id === reviewId) {
        return {
          ...r,
          status: 'rejected' as ReviewStatus,
          rejectionReason: reason,
          updatedAt: new Date().toISOString().split('T')[0],
        };
      }
      return r;
    });
    saveReviews(newReviews);
  };

  // Add reply to a review (creator only)
  const addReplyToReview = (reviewId: string, reply: string) => {
    const newReviews = reviews.map(r => {
      if (r.id === reviewId) {
        return {
          ...r,
          creatorReply: reply,
          creatorReplyAt: new Date().toISOString().split('T')[0],
          updatedAt: new Date().toISOString().split('T')[0],
        };
      }
      return r;
    });
    saveReviews(newReviews);
  };

  // Update reply to a review (creator only)
  const updateReplyToReview = (reviewId: string, reply: string) => {
    const newReviews = reviews.map(r => {
      if (r.id === reviewId) {
        return {
          ...r,
          creatorReply: reply,
          updatedAt: new Date().toISOString().split('T')[0],
        };
      }
      return r;
    });
    saveReviews(newReviews);
  };

  // Delete reply from a review (creator only)
  const deleteReplyFromReview = (reviewId: string) => {
    const newReviews = reviews.map(r => {
      if (r.id === reviewId) {
        const { creatorReply, creatorReplyAt, ...rest } = r;
        return {
          ...rest,
          updatedAt: new Date().toISOString().split('T')[0],
        };
      }
      return r;
    });
    saveReviews(newReviews);
  };

  return (
    <DemoContext.Provider value={{ 
      currentUser, 
      setUserType,
      updateCurrentUser,
      loginAsNewCreator,
      loginAsNewBusiness,
      isLoggedIn, 
      logout, 
      isHydrated,
      // Profile ownership
      isOwnProfile,
      getOwnCreatorId,
      getOwnCreatorStatus,
      // Creator management
      getCreators,
      getCreatorById,
      updateCreator,
      deleteCreator,
      addCreator,
      addCreatorFromSupabase,
      creatorModifications,
      // Favorites management
      favorites,
      addToFavorites,
      removeFromFavorites,
      isFavorite,
      getFavoriteCreators,
      // Recently viewed management
      recentlyViewed,
      addToRecentlyViewed,
      getRecentlyViewedCreators,
      // Profile views management
      incrementProfileViews,
      // Settings management
      userSettings,
      updateSettings,
      // Review management
      reviews,
      getReviewsForCreator,
      getReviewsByBusiness,
      getPendingReviews,
      getAllReviews,
      addReview,
      updateReview,
      deleteReview,
      approveReview,
      rejectReview,
      addReplyToReview,
      updateReplyToReview,
      deleteReplyFromReview,
      hasBusinessReviewedCreator,
      getBusinessReviewForCreator,
    }}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (context === undefined) {
    throw new Error('useDemo must be used within a DemoProvider');
  }
  return context;
}
