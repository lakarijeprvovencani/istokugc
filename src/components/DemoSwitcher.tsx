'use client';

import { useState } from 'react';
import { useDemo } from '@/context/DemoContext';
import { UserType } from '@/lib/mockData';

export default function DemoSwitcher() {
  const { currentUser, setUserType } = useDemo();
  const [isOpen, setIsOpen] = useState(true);

  // Note: No unpaid business option - all businesses must have active subscription
  const options: { value: UserType; label: string; description: string }[] = [
    { value: 'guest', label: '👤 Gost', description: 'Nije ulogovan' },
    { value: 'creator', label: '🎨 Kreator', description: 'Ulogovan kreator' },
    { value: 'business', label: '🏢 Biznis', description: 'Aktivna pretplata' },
    { value: 'admin', label: '⚙️ Admin', description: 'Pun pristup' },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen ? (
        <div className="bg-white border border-border rounded-2xl shadow-lg p-4 min-w-[280px]">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs uppercase tracking-wider text-muted font-medium">
              Demo Mode
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-muted hover:text-foreground transition-colors p-1"
              title="Sakrij"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          <div className="space-y-2">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => setUserType(option.value)}
                className={`w-full text-left px-4 py-3 rounded-xl transition-all ${
                  currentUser.type === option.value
                    ? 'bg-primary text-white'
                    : 'bg-secondary hover:bg-accent'
                }`}
              >
                <div className="font-medium text-sm">{option.label}</div>
                <div className={`text-xs mt-0.5 ${
                  currentUser.type === option.value
                    ? 'text-white/70'
                    : 'text-muted'
                }`}>
                  {option.description}
                </div>
              </button>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-border">
            <div className="text-xs text-muted">
              Trenutno: <span className="font-medium text-foreground">{currentUser.name}</span>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-primary text-white px-4 py-3 rounded-full shadow-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
          title="Prikaži Demo Mode"
        >
          <span className="text-sm font-medium">Demo</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="18 15 12 9 6 15"></polyline>
          </svg>
        </button>
      )}
    </div>
  );
}
