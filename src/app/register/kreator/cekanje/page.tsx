'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';

export default function CreatorPendingPage() {
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [emailVerified, setEmailVerified] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    // Proveri status korisnika
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || null);
        setEmailVerified(user.email_confirmed_at !== null);
      }
    };
    checkUser();
  }, []);

  useEffect(() => {
    // Countdown timer
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleResendEmail = async () => {
    if (countdown > 0 || !userEmail) return;
    
    setIsResending(true);
    setResendError('');
    setResendSuccess(false);

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: userEmail,
      });

      if (error) {
        setResendError('Greška pri slanju. Pokušajte ponovo.');
      } else {
        setResendSuccess(true);
        setCountdown(60); // 60 sekundi do sledećeg slanja
      }
    } catch {
      setResendError('Greška pri slanju. Pokušajte ponovo.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <main className="pt-20 min-h-screen">
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          {/* Icon */}
          <div className="w-20 h-20 mx-auto mb-6 bg-amber-100 rounded-full flex items-center justify-center">
            {emailVerified ? (
              <svg className="w-10 h-10 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-10 h-10 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            )}
          </div>

          {!emailVerified ? (
            // Email nije verifikovan
            <>
              <h1 className="text-2xl font-bold mb-3">Potvrdite vašu email adresu</h1>
              <p className="text-muted mb-6">
                Poslali smo vam email za verifikaciju na{' '}
                <span className="font-medium text-foreground">{userEmail}</span>.
                Kliknite na link u emailu da biste potvrdili vašu adresu.
              </p>

              {/* Resend email section */}
              <div className="bg-secondary/50 rounded-xl p-4 mb-6">
                <p className="text-sm text-muted mb-3">Nije vam stigao email?</p>
                
                {resendSuccess && (
                  <div className="bg-green-100 text-green-700 rounded-lg p-3 mb-3 text-sm">
                    ✓ Email je ponovo poslat! Proverite inbox.
                  </div>
                )}
                
                {resendError && (
                  <div className="bg-red-100 text-red-700 rounded-lg p-3 mb-3 text-sm">
                    {resendError}
                  </div>
                )}

                <button
                  onClick={handleResendEmail}
                  disabled={isResending || countdown > 0}
                  className="w-full py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isResending ? (
                    <>
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Šaljem...
                    </>
                  ) : countdown > 0 ? (
                    `Pošalji ponovo za ${countdown}s`
                  ) : (
                    'Pošalji ponovo'
                  )}
                </button>
              </div>

              <p className="text-xs text-muted">
                Proverite i spam/junk folder. Email može potrajati do par minuta.
              </p>
            </>
          ) : (
            // Email verifikovan, čeka odobrenje
            <>
              <h1 className="text-2xl font-bold mb-3">Vaš profil čeka odobrenje</h1>
              <p className="text-muted mb-6">
                Vaša email adresa je potvrđena! Vaš profil je uspešno kreiran i trenutno čeka odobrenje od strane administratora.
              </p>

              <div className="bg-secondary/50 rounded-xl p-4 mb-6">
                <p className="text-sm text-muted">
                  Ovo obično traje do <span className="font-medium text-foreground">24 sata</span>. 
                  Obavestićemo vas putem emaila kada vaš profil bude odobren.
                </p>
              </div>

              <div className="space-y-3">
                <Link 
                  href="/"
                  className="block w-full py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors text-center"
                >
                  Nazad na početnu
                </Link>
                <Link
                  href="/login"
                  className="block w-full py-3 border border-border rounded-xl font-medium hover:bg-secondary transition-colors text-center"
                >
                  Prijavi se
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

