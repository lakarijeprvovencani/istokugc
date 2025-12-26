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
