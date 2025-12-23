'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserType, DemoUser, demoUsers, Creator, mockCreators, pendingCreators, CreatorStatus } from '@/lib/mockData';

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
  // Creator management
  getCreators: (includeHidden?: boolean) => Creator[];
  getCreatorById: (id: string) => Creator | undefined;
  updateCreator: (id: string, updates: Partial<Creator>) => void;
  deleteCreator: (id: string) => void;
  creatorModifications: Record<string, CreatorModification>;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

const STORAGE_KEY = 'demoUserType';
const CREATOR_MODS_KEY = 'creatorModifications';

export function DemoProvider({ children }: { children: ReactNode }) {
  // Initialize with guest, will be updated by useEffect if localStorage has saved value
  const [currentUser, setCurrentUser] = useState<DemoUser>(demoUsers.guest);
  const [isHydrated, setIsHydrated] = useState(false);
  const [creatorModifications, setCreatorModifications] = useState<Record<string, CreatorModification>>({});

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
      
      setIsHydrated(true);
    }
  }, []);

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

  return (
    <DemoContext.Provider value={{ 
      currentUser, 
      setUserType, 
      isLoggedIn, 
      logout, 
      isHydrated,
      getCreators,
      getCreatorById,
      updateCreator,
      deleteCreator,
      creatorModifications,
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
