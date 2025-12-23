'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  UserType, 
  DemoUser, 
  demoUsers, 
  Creator, 
  mockCreators, 
  pendingCreators, 
  CreatorStatus,
  Review,
  ReviewStatus,
  mockReviews,
} from '@/lib/mockData';
import type { Rating, CreateReviewInput } from '@/types/review';

// Combine all creators into one source of truth
const allBaseCreators: Creator[] = [...mockCreators, ...pendingCreators];

// Type for creator modifications stored in localStorage
interface CreatorModification {
  status?: CreatorStatus;
  approved?: boolean;
  deleted?: boolean;
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

interface DemoContextType {
  currentUser: DemoUser;
  setUserType: (type: UserType) => void;
  isLoggedIn: boolean;
  logout: () => void;
  isHydrated: boolean;
  // Profile ownership
  isOwnProfile: (creatorId: string) => boolean;
  getOwnCreatorId: () => string | undefined;
  // Creator management
  getCreators: (includeHidden?: boolean) => Creator[];
  getCreatorById: (id: string) => Creator | undefined;
  updateCreator: (id: string, updates: Partial<Creator>) => void;
  deleteCreator: (id: string) => void;
  creatorModifications: Record<string, CreatorModification>;
  // Favorites management
  favorites: string[];
  addToFavorites: (creatorId: string) => void;
  removeFromFavorites: (creatorId: string) => void;
  isFavorite: (creatorId: string) => boolean;
  getFavoriteCreators: () => Creator[];
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
  hasBusinessReviewedCreator: (businessId: string, creatorId: string) => boolean;
  getBusinessReviewForCreator: (businessId: string, creatorId: string) => Review | undefined;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

const STORAGE_KEY = 'demoUserType';
const CREATOR_MODS_KEY = 'creatorModifications';
const REVIEWS_KEY = 'reviews';
const FAVORITES_KEY = 'favoriteCreators';
const SETTINGS_KEY = 'userSettings';

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
  const [reviews, setReviews] = useState<Review[]>(mockReviews);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [userSettings, setUserSettings] = useState<UserSettings>(defaultSettings);

  // Load saved data from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Load user type
      const savedUserType = localStorage.getItem(STORAGE_KEY);
      if (savedUserType && (savedUserType in demoUsers)) {
        setCurrentUser(demoUsers[savedUserType as UserType]);
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
      
      // Load settings
      const savedSettings = localStorage.getItem(SETTINGS_KEY);
      if (savedSettings) {
        try {
          setUserSettings(JSON.parse(savedSettings));
        } catch (e) {
          console.error('Failed to parse settings:', e);
        }
      }
      
      setIsHydrated(true);
    }
  }, []);

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

  const logout = () => {
    setCurrentUser(demoUsers.guest);
    // Remove from localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const isLoggedIn = currentUser.type !== 'guest';

  // Check if the current user owns a specific creator profile
  const isOwnProfile = (creatorId: string): boolean => {
    if (currentUser.type !== 'creator') return false;
    return currentUser.creatorId === creatorId;
  };

  // Get the current user's creator ID (if they are a creator)
  const getOwnCreatorId = (): string | undefined => {
    if (currentUser.type !== 'creator') return undefined;
    return currentUser.creatorId;
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

  // Get all creators with modifications applied
  const getCreators = (includeHidden = false): Creator[] => {
    return allBaseCreators
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
    const creator = allBaseCreators.find(c => c.id === id);
    if (!creator) return undefined;
    
    const mods = creatorModifications[id];
    if (mods?.deleted) return undefined;
    
    if (mods) {
      return { ...creator, ...mods };
    }
    return creator;
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
      businessId: currentUser.type === 'business' ? 'b1' : 'unknown', // Demo business ID
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

  return (
    <DemoContext.Provider value={{ 
      currentUser, 
      setUserType, 
      isLoggedIn, 
      logout, 
      isHydrated,
      // Profile ownership
      isOwnProfile,
      getOwnCreatorId,
      // Creator management
      getCreators,
      getCreatorById,
      updateCreator,
      deleteCreator,
      creatorModifications,
      // Favorites management
      favorites,
      addToFavorites,
      removeFromFavorites,
      isFavorite,
      getFavoriteCreators,
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
