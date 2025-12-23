'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDemo } from '@/context/DemoContext';

export default function LoginPage() {
  const router = useRouter();
  const { setUserType } = useDemo();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Demo: Determine user type based on email
    // In production, Supabase will return user role from database
    if (email.includes('admin')) {
      setUserType('admin');
      router.push('/admin');
    } else if (email.includes('kreator') || email.includes('creator')) {
      setUserType('creator');
      router.push('/dashboard');
    } else {
      // Default to business for demo
      setUserType('business');
      router.push('/dashboard');
    }
  };

  const handleGoogleLogin = () => {
    // Demo: default to business
    // In production, Google OAuth will return user from database with their role
    setUserType('business');
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-20 bg-secondary/30">
      <div className="w-full max-w-md px-6">
        <div className="bg-white rounded-3xl border border-border shadow-sm p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-light mb-2">Dobrodošao nazad</h1>
            <p className="text-muted text-sm">Prijavi se na svoj nalog</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-sm text-muted mb-2 block">Email adresa</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tvoj@email.com"
                className="w-full px-4 py-3.5 border border-border rounded-xl focus:outline-none focus:border-muted"
                required
              />
            </div>

            <div>
              <label className="text-sm text-muted mb-2 block">Lozinka</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3.5 border border-border rounded-xl focus:outline-none focus:border-muted"
                required
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="rounded" />
                Zapamti me
              </label>
              <Link href="#" className="text-sm text-muted hover:text-foreground">
                Zaboravljena lozinka?
              </Link>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
            >
              Prijavi se
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-muted">ili</span>
            </div>
          </div>

          <button
            onClick={handleGoogleLogin}
            className="w-full py-3.5 border border-border rounded-xl font-medium hover:bg-secondary transition-colors flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Nastavi sa Google-om
          </button>

          <p className="text-center text-sm text-muted mt-8">
            Nemaš nalog?{' '}
            <Link href="/register" className="text-foreground hover:underline font-medium">
              Registruj se
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
