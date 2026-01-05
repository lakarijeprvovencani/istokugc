'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get('email') || '';
  
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [emailInput, setEmailInput] = useState(email);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleResendEmail = async () => {
    if (countdown > 0 || !emailInput) return;

    setIsLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Greška pri slanju email-a');
        return;
      }

      setMessage(data.message);
      setCountdown(60); // 60 sekundi čekanja pre ponovnog slanja

    } catch (err) {
      setError('Greška pri komunikaciji sa serverom');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center py-12 lg:py-16 bg-secondary/30">
      <div className="w-full max-w-md px-6">
        <div className="bg-white rounded-3xl border border-border shadow-sm p-8">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
          </div>

          <div className="text-center mb-6">
            <h1 className="text-2xl font-light mb-2">Potvrdi email adresu</h1>
            <p className="text-muted text-sm">
              Poslali smo ti email sa linkom za verifikaciju. 
              Proveri inbox i <span className="text-primary font-medium">spam folder</span>.
            </p>
          </div>

          {/* Email input */}
          {!email && (
            <div className="mb-4">
              <label className="text-sm text-muted mb-2 block">
                Email adresa
              </label>
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="tvoj@email.com"
                className="w-full px-4 py-3.5 border border-border rounded-xl focus:outline-none focus:border-muted"
              />
            </div>
          )}

          {email && (
            <div className="mb-4 p-4 bg-secondary rounded-xl">
              <p className="text-xs text-muted mb-1">Email poslat na:</p>
              <p className="text-foreground font-medium">{email}</p>
            </div>
          )}

          {/* Messages */}
          {message && (
            <div className="mb-4 p-4 bg-success/10 border border-success/20 rounded-xl">
              <p className="text-success text-sm flex items-center gap-2">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {message}
              </p>
            </div>
          )}

          {error && (
            <div className="mb-4 p-4 bg-error/10 border border-error/20 rounded-xl">
              <p className="text-error text-sm flex items-center gap-2">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </p>
            </div>
          )}

          {/* Resend button */}
          <button
            onClick={handleResendEmail}
            disabled={isLoading || countdown > 0 || !emailInput}
            className={`w-full py-3.5 rounded-xl font-medium transition-all ${
              isLoading || countdown > 0 || !emailInput
                ? 'bg-secondary text-muted cursor-not-allowed'
                : 'bg-primary text-white hover:bg-primary/90'
            }`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Šaljem...
              </span>
            ) : countdown > 0 ? (
              `Pošalji ponovo za ${countdown}s`
            ) : (
              'Pošalji email ponovo'
            )}
          </button>

          {/* Info box */}
          <div className="mt-6 p-4 bg-secondary rounded-xl">
            <h3 className="text-foreground font-medium mb-2 flex items-center gap-2 text-sm">
              <svg className="w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Nije stigao email?
            </h3>
            <ul className="text-sm text-muted space-y-1">
              <li>• Proveri <span className="text-foreground">spam/junk</span> folder</li>
              <li>• Proveri da li je email adresa tačna</li>
              <li>• Sačekaj par minuta pre ponovnog slanja</li>
              <li>• Kontaktiraj podršku ako problem potraje</li>
            </ul>
          </div>

          {/* Links */}
          <div className="mt-6 flex flex-col gap-2 text-center">
            <Link
              href="/login"
              className="text-primary hover:underline text-sm font-medium transition-colors"
            >
              ← Nazad na prijavu
            </Link>
            <p className="text-muted text-sm">
              Nemaš nalog?{' '}
              <Link href="/register/kreator" className="text-foreground hover:underline">
                Registruj se
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Loading fallback
function LoadingFallback() {
  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-secondary/30">
      <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
