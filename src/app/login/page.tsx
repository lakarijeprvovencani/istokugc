'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDemo } from '@/context/DemoContext';
import { createClient } from '@/lib/supabase/client';
import type { Creator } from '@/lib/mockData';

export default function LoginPage() {
  const router = useRouter();
  const { setUserType, loginAsNewCreator, loginAsNewBusiness, addCreatorFromSupabase } = useDemo();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Za ponovno slanje verifikacionog emaila
  const [showResendOption, setShowResendOption] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  const handleResendVerification = async () => {
    if (resendCountdown > 0 || !email) return;
    
    setIsResending(true);
    setResendSuccess(false);
    
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });
      
      if (!error) {
        setResendSuccess(true);
        setResendCountdown(60);
      }
    } catch {
      // Ignore errors
    } finally {
      setIsResending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const supabase = createClient();
      
      // Supabase login
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        if (authError.message.includes('Invalid login credentials')) {
          setError('Pogrešan email ili lozinka');
          setShowResendOption(false);
        } else if (authError.message.includes('Email not confirmed')) {
          setError('Molimo potvrdite email adresu pre prijave.');
          setShowResendOption(true);
        } else {
          setError(authError.message);
          setShowResendOption(false);
        }
        setIsLoading(false);
        return;
      }

      if (!authData.user) {
        setError('Greška pri prijavi');
        setIsLoading(false);
        return;
      }

      // Dohvati user role iz baze
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', authData.user.id)
        .single();

      if (userError) {
        console.error('User data fetch error:', userError);
        setError('Greška pri učitavanju korisničkih podataka');
        setIsLoading(false);
        return;
      }

      // Postavi DemoContext prema roli i navigiraj
      if (userData.role === 'admin') {
        setUserType('admin');
        router.push('/admin');
      } else if (userData.role === 'creator') {
        // Dohvati creator profil iz Supabase
        const { data: creatorData, error: creatorError } = await supabase
          .from('creators')
          .select('*')
          .eq('user_id', authData.user.id)
          .single();
        
        if (creatorError || !creatorData) {
          console.error('Creator fetch error:', creatorError);
          setError('Kreator profil nije pronađen');
          setIsLoading(false);
          return;
        }

        // Konvertuj Supabase format u DemoContext format
        const creator: Creator = {
          id: creatorData.id,
          name: creatorData.name,
          email: creatorData.email,
          bio: creatorData.bio,
          photo: creatorData.photo || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
          location: creatorData.location,
          categories: creatorData.categories || [],
          platforms: creatorData.platforms || [],
          languages: creatorData.languages || [],
          priceFrom: creatorData.price_from,
          portfolio: creatorData.portfolio || [],
          phone: creatorData.phone || undefined,
          instagram: creatorData.instagram || undefined,
          tiktok: creatorData.tiktok || undefined,
          youtube: creatorData.youtube || undefined,
          approved: creatorData.status === 'approved',
          status: creatorData.status,
          rejectionReason: creatorData.rejection_reason || undefined,
          profileViews: creatorData.profile_views || 0,
          createdAt: creatorData.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
        };

        // Proveri status kreatora
        if (creatorData.status === 'deactivated') {
          setError('Vaš nalog je deaktiviran. Kontaktirajte podršku za više informacija.');
          setIsLoading(false);
          return;
        }

        // Dodaj kreatora u DemoContext
        addCreatorFromSupabase(creator);
        
        // Login kao kreator
        loginAsNewCreator(creatorData.id);
        
        // Ako je pending, idi na pending stranicu
        if (creatorData.status === 'pending') {
          router.push('/register/kreator/cekanje');
        } else {
          router.push('/dashboard');
        }
        
      } else if (userData.role === 'business') {
        // Dohvati business podatke
        const { data: businessData, error: businessError } = await supabase
          .from('businesses')
          .select('*')
          .eq('user_id', authData.user.id)
          .single();
        
        if (businessError || !businessData) {
          console.error('Business fetch error:', businessError);
          setError('Poslovni profil nije pronađen');
          setIsLoading(false);
          return;
        }

        // Proveri da li je nalog deaktiviran od strane admina
        if (businessData.subscription_status === 'deactivated') {
          setError('Vaš nalog je deaktiviran. Kontaktirajte podršku za više informacija.');
          setIsLoading(false);
          return;
        }

        // Dozvoli login bez obzira na status pretplate (expired je OK)
        // Dashboard će prikazati opciju za obnovu ako je pretplata istekla
        loginAsNewBusiness(businessData.id, businessData.company_name, businessData.subscription_status, businessData.subscription_type);
        router.push('/dashboard');
      }

    } catch (err) {
      console.error('Login error:', err);
      setError('Greška pri prijavi. Pokušajte ponovo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center py-12 lg:py-16 bg-secondary/30">
      <div className="w-full max-w-md px-6">
        <div className="bg-white rounded-3xl border border-border shadow-sm p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-light mb-2">Dobrodošao nazad</h1>
            <p className="text-muted text-sm">Prijavi se na svoj nalog</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-error/10 border border-error/20 rounded-xl p-4">
                <p className="text-sm text-error">{error}</p>
                
                {/* Opcija za ponovno slanje verifikacionog emaila */}
                {showResendOption && (
                  <div className="mt-3 pt-3 border-t border-error/20">
                    {resendSuccess ? (
                      <p className="text-sm text-green-600">
                        ✓ Email je ponovo poslat! Proverite inbox i spam folder.
                      </p>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendVerification}
                        disabled={isResending || resendCountdown > 0}
                        className="text-sm text-primary hover:underline disabled:opacity-50 disabled:no-underline flex items-center gap-2"
                      >
                        {isResending ? (
                          <>
                            <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Šaljem...
                          </>
                        ) : resendCountdown > 0 ? (
                          `Pošalji ponovo za ${resendCountdown}s`
                        ) : (
                          'Nije stigao email? Pošalji ponovo'
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="text-sm text-muted mb-2 block">Email adresa</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tvoj@email.com"
                className="w-full px-4 py-3.5 border border-border rounded-xl focus:outline-none focus:border-muted"
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="text-sm text-muted mb-2 block">Lozinka</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3.5 pr-12 border border-border rounded-xl focus:outline-none focus:border-muted"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="rounded" />
                Zapamti me
              </label>
              <Link href="/auth/forgot-password" className="text-sm text-muted hover:text-foreground">
                Zaboravljena lozinka?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Prijava...
                </>
              ) : 'Prijavi se'}
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
