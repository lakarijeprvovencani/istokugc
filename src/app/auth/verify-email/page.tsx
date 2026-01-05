'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function VerifyEmailPage() {
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <span className="text-3xl font-bold text-white">
              UGC<span className="text-amber-500">Select</span>
            </span>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 shadow-xl">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-white text-center mb-2">
            Potvrdi email adresu
          </h1>
          
          <p className="text-gray-400 text-center mb-6">
            Poslali smo ti email sa linkom za verifikaciju. 
            Proveri inbox i <span className="text-amber-500">spam folder</span>.
          </p>

          {/* Email input */}
          {!email && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email adresa
              </label>
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="tvoj@email.com"
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
          )}

          {email && (
            <div className="mb-4 p-3 bg-gray-700/30 rounded-lg">
              <p className="text-sm text-gray-400">Email poslat na:</p>
              <p className="text-white font-medium">{email}</p>
            </div>
          )}

          {/* Messages */}
          {message && (
            <div className="mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg">
              <p className="text-green-400 text-sm flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {message}
              </p>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
              <p className="text-red-400 text-sm flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
              isLoading || countdown > 0 || !emailInput
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-amber-500 text-black hover:bg-amber-400'
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
          <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <h3 className="text-blue-400 font-medium mb-2 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Nije stigao email?
            </h3>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>• Proveri <span className="text-white">spam/junk</span> folder</li>
              <li>• Proveri da li je email adresa tačna</li>
              <li>• Sačekaj par minuta pre ponovnog slanja</li>
              <li>• Kontaktiraj podršku ako problem potraje</li>
            </ul>
          </div>

          {/* Links */}
          <div className="mt-6 flex flex-col gap-2 text-center">
            <Link
              href="/login"
              className="text-amber-500 hover:text-amber-400 text-sm font-medium transition-colors"
            >
              ← Nazad na prijavu
            </Link>
            <p className="text-gray-500 text-sm">
              Nemaš nalog?{' '}
              <Link href="/register/kreator" className="text-amber-500 hover:text-amber-400">
                Registruj se
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

