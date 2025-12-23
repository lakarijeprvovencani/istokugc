'use client';

import Link from 'next/link';
import { useDemo } from '@/context/DemoContext';

export default function Header() {
  const { currentUser, isLoggedIn, logout } = useDemo();

  return (
    <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-50 border-b border-border">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="text-2xl font-medium tracking-tight">
            UGC Select
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-10">
            <Link 
              href="/kreatori" 
              className="text-muted hover:text-foreground transition-colors text-sm tracking-wide"
            >
              Kreatori
            </Link>
          </nav>

          {/* Auth buttons */}
          <div className="flex items-center gap-4">
            {!isLoggedIn ? (
              <>
                <Link 
                  href="/login" 
                  className="text-sm text-muted hover:text-foreground transition-colors"
                >
                  Prijava
                </Link>
                <Link 
                  href="/register" 
                  className="text-sm px-5 py-2.5 bg-primary text-white rounded-full hover:bg-primary/90 transition-colors"
                >
                  Registracija
                </Link>
              </>
            ) : (
              <div className="flex items-center gap-4">
                <Link 
                  href={currentUser.type === 'admin' ? '/admin' : '/dashboard'}
                  className="text-sm text-muted hover:text-foreground transition-colors"
                >
                  {currentUser.name}
                </Link>
                <button 
                  onClick={logout}
                  className="text-sm px-5 py-2.5 border border-border rounded-full hover:bg-secondary transition-colors"
                >
                  Odjava
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
