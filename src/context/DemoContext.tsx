'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserType, DemoUser, demoUsers } from '@/lib/mockData';

interface DemoContextType {
  currentUser: DemoUser;
  setUserType: (type: UserType | 'businessUnpaid') => void;
  isLoggedIn: boolean;
  logout: () => void;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

const STORAGE_KEY = 'demoUserType';

export function DemoProvider({ children }: { children: ReactNode }) {
  // Initialize with guest, will be updated by useEffect if localStorage has saved value
  const [currentUser, setCurrentUser] = useState<DemoUser>(demoUsers.guest);

  // Load saved user type from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedUserType = localStorage.getItem(STORAGE_KEY);
      if (savedUserType && (savedUserType in demoUsers)) {
        setCurrentUser(demoUsers[savedUserType as UserType | 'businessUnpaid']);
      }
    }
  }, []);

  const setUserType = (type: UserType | 'businessUnpaid') => {
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

  return (
    <DemoContext.Provider value={{ currentUser, setUserType, isLoggedIn, logout }}>
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
