'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDemo } from '@/context/DemoContext';

export default function Header() {
  const router = useRouter();
  const { currentUser, isLoggedIn, logout, isHydrated } = useDemo();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hasNotifications, setHasNotifications] = useState(false);
  
  // Fetch notification status for logged in users
  useEffect(() => {
    const checkNotifications = async () => {
      if (!isHydrated || !isLoggedIn) {
        setHasNotifications(false);
        return;
      }
      
      try {
        let hasNew = false;
        
        if (currentUser.type === 'creator' && currentUser.creatorId) {
          // Get last viewed timestamp for invitations
          const lastViewedInvitations = localStorage.getItem(`lastViewed_invitations_${currentUser.creatorId}`);
          const lastViewedInvDate = lastViewedInvitations ? new Date(lastViewedInvitations) : null;
          
          // Check for NEW pending invitations (created after last view)
          const invRes = await fetch(`/api/job-invitations?creatorId=${currentUser.creatorId}`);
          if (invRes.ok) {
            const invData = await invRes.json();
            const pendingInvitations = (invData.invitations || []).filter((inv: any) => inv.status === 'pending');
            
            // Only show notification for invitations created AFTER last viewed
            const newInvitations = lastViewedInvDate 
              ? pendingInvitations.filter((inv: any) => new Date(inv.createdAt) > lastViewedInvDate)
              : pendingInvitations;
            
            if (newInvitations.length > 0) hasNew = true;
          }
          
          // Check for unread messages
          if (!hasNew) {
            const msgRes = await fetch(`/api/job-messages?countUnread=true&recipientType=creator&recipientId=${currentUser.creatorId}`);
            if (msgRes.ok) {
              const msgData = await msgRes.json();
              if (msgData.unreadCount > 0) hasNew = true;
            }
          }
        } else if (currentUser.type === 'business' && currentUser.businessId) {
          // Get last viewed timestamp for applications
          const lastViewedApps = localStorage.getItem(`lastViewed_jobs_${currentUser.businessId}`);
          const lastViewedAppsDate = lastViewedApps ? new Date(lastViewedApps) : null;
          
          // Check for NEW pending applications (created after last view)
          const appsRes = await fetch(`/api/job-applications?businessId=${currentUser.businessId}`);
          if (appsRes.ok) {
            const appsData = await appsRes.json();
            const pendingApps = (appsData.applications || []).filter((app: any) => app.status === 'pending');
            
            // Only show notification for applications created AFTER last viewed
            const newApps = lastViewedAppsDate 
              ? pendingApps.filter((app: any) => new Date(app.createdAt) > lastViewedAppsDate)
              : pendingApps;
            
            if (newApps.length > 0) hasNew = true;
          }
          
          // Check for unread messages
          if (!hasNew) {
            const msgRes = await fetch(`/api/job-messages?countUnread=true&recipientType=business&recipientId=${currentUser.businessId}`);
            if (msgRes.ok) {
              const msgData = await msgRes.json();
              if (msgData.unreadCount > 0) hasNew = true;
            }
          }
        }
        
        setHasNotifications(hasNew);
      } catch (error) {
        console.error('Error checking notifications:', error);
      }
    };
    
    checkNotifications();
    
    // Re-check only when tab becomes visible (not every 30 seconds)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkNotifications();
      }
    };
    
    // Listen for custom event when notifications are cleared (e.g. messages read)
    const handleNotificationsCleared = () => {
      checkNotifications();
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('notificationsCleared', handleNotificationsCleared);
    
    // Also check every 60 seconds as backup (reduced from 30)
    const interval = setInterval(checkNotifications, 60000);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('notificationsCleared', handleNotificationsCleared);
      clearInterval(interval);
    };
  }, [isHydrated, isLoggedIn, currentUser.type, currentUser.creatorId, currentUser.businessId]);
  
  // Logout i redirect na početnu
  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  // Dohvati pravo ime korisnika (sada dolazi direktno iz currentUser koji se popunjava iz Supabase)
  const getUserDisplayName = () => {
    // Za business, koristi companyName ako postoji
    if (currentUser.type === 'business' && currentUser.companyName) {
      return currentUser.companyName;
    }
    // Za creator, admin i ostale - koristi name iz currentUser (dolazi iz Supabase)
    return currentUser.name || 'Korisnik';
  };

  const displayName = isLoggedIn ? getUserDisplayName() : '';

  return (
    <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-50 border-b border-border">
      <div className="max-w-7xl 2xl:max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <Link href="/" className="text-xl sm:text-2xl font-medium tracking-tight">
            UGC Select
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link 
              href="/kreatori" 
              className="relative text-muted hover:text-foreground transition-colors text-sm font-medium group"
            >
              Kreatori
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
            </Link>
            <Link 
              href="/poslovi" 
              className="relative text-muted hover:text-foreground transition-colors text-sm font-medium group"
            >
              Poslovi
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
            </Link>
          </nav>

          {/* Desktop Auth buttons */}
          <div className="hidden md:flex items-center">
            {!isHydrated ? (
              <div className="flex items-center gap-3">
                <Link 
                  href="/login" 
                  className="text-sm text-muted hover:text-foreground transition-colors font-medium"
                >
                  Prijava
                </Link>
                <Link 
                  href="/register" 
                  className="text-sm px-5 py-2.5 bg-primary text-white rounded-full hover:bg-primary/90 transition-colors font-medium"
                >
                  Registracija
                </Link>
              </div>
            ) : !isLoggedIn ? (
              <div className="flex items-center gap-3">
                <Link 
                  href="/login" 
                  className="text-sm text-muted hover:text-foreground transition-colors font-medium"
                >
                  Prijava
                </Link>
                <Link 
                  href="/register" 
                  className="text-sm px-5 py-2.5 bg-primary text-white rounded-full hover:bg-primary/90 transition-colors font-medium"
                >
                  Registracija
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {/* User profile link with avatar */}
                <Link 
                  href={currentUser.type === 'admin' ? '/admin' : '/dashboard'}
                  className="flex items-center gap-3 px-3 py-2 rounded-full hover:bg-secondary transition-colors group"
                >
                  {/* Avatar with initials and notification dot */}
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary">
                        {displayName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </span>
                    </div>
                    {/* Red notification dot */}
                    {hasNotifications && (
                      <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse" />
                    )}
                  </div>
                  <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                    {displayName}
                  </span>
                </Link>
                
                {/* Divider */}
                <div className="w-px h-6 bg-border mx-1" />
                
                {/* Logout button */}
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-sm px-4 py-2 text-muted hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Odjava
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 -mr-2 text-muted hover:text-foreground transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border">
            {/* Navigation section */}
            <div className="py-3 px-2">
              <p className="px-3 py-2 text-xs font-medium text-muted uppercase tracking-wider">Navigacija</p>
              <Link 
                href="/kreatori"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-3 text-foreground hover:bg-secondary rounded-xl transition-colors"
              >
                <span className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </span>
                <span className="font-medium">Kreatori</span>
              </Link>
              <Link 
                href="/poslovi"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-3 text-foreground hover:bg-secondary rounded-xl transition-colors"
              >
                <span className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </span>
                <span className="font-medium">Poslovi</span>
              </Link>
            </div>
            
            {/* Divider */}
            <div className="h-px bg-border mx-4" />
            
            {!isHydrated ? (
              <div className="py-3 px-2">
                <p className="px-3 py-2 text-xs font-medium text-muted uppercase tracking-wider">Nalog</p>
                <Link 
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 text-foreground hover:bg-secondary rounded-xl transition-colors"
                >
                  <span className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                  </span>
                  <span className="font-medium">Prijava</span>
                </Link>
                <Link 
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 mx-3 mt-2 py-3 bg-primary text-white rounded-xl font-medium"
                >
                  Registracija
                </Link>
              </div>
            ) : !isLoggedIn ? (
              <div className="py-3 px-2">
                <p className="px-3 py-2 text-xs font-medium text-muted uppercase tracking-wider">Nalog</p>
                <Link 
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 text-foreground hover:bg-secondary rounded-xl transition-colors"
                >
                  <span className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                  </span>
                  <span className="font-medium">Prijava</span>
                </Link>
                <Link 
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 mx-3 mt-2 py-3 bg-primary text-white rounded-xl font-medium"
                >
                  Registracija
                </Link>
              </div>
            ) : (
              <div className="py-3 px-2">
                <p className="px-3 py-2 text-xs font-medium text-muted uppercase tracking-wider">Tvoj nalog</p>
                <Link 
                  href={currentUser.type === 'admin' ? '/admin' : '/dashboard'}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 hover:bg-secondary rounded-xl transition-colors"
                >
                  <span className="relative w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    {/* Red notification dot */}
                    {hasNotifications && (
                      <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white animate-pulse" />
                    )}
                  </span>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{displayName}</p>
                    <p className="text-xs text-muted">Pogledaj dashboard</p>
                  </div>
                  {hasNotifications && (
                    <span className="px-2 py-0.5 bg-red-500 text-white text-[10px] font-medium rounded-full">
                      Novo
                    </span>
                  )}
                </Link>
                
                <div className="mt-2 pt-2 border-t border-border mx-3">
                  <button 
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                  >
                    <span className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                    </span>
                    <span className="font-medium">Odjava</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
