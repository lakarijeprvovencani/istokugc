'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const supabase = createClient();

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
      });

      if (error) {
        throw error;
      }

      setIsSuccess(true);
    } catch (err) {
      console.error('Reset password error:', err);

      const anyErr = err as { status?: number; code?: string; message?: string };
      const status = anyErr?.status;
      const code = anyErr?.code ?? '';
      const message = anyErr?.message ?? '';

      // Rate limit (Supabase vraca 429 + poruku "after X seconds")
      if (status === 429 || code.includes('rate_limit') || message.toLowerCase().includes('rate')) {
        const match = message.match(/after\s+(\d+)\s+second/i);
        const seconds = match ? match[1] : null;
        setError(
          seconds
            ? `Previše puta ste zatražili reset lozinke. Sačekajte ${seconds} sekundi pa pokušajte ponovo.`
            : 'Previše puta ste zatražili reset lozinke. Sačekajte minut pa pokušajte ponovo.'
        );
      } else if (status === 422 || code.includes('email')) {
        setError('Email adresa nije validna. Proverite i pokušajte ponovo.');
      } else {
        setError('Trenutno ne možemo da pošaljemo email. Pokušajte ponovo za par minuta.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center py-12 lg:py-16 bg-secondary/30">
        <div className="w-full max-w-md px-6">
          <div className="bg-white rounded-3xl border border-border shadow-sm p-8 text-center">
            <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            
            <h1 className="text-2xl font-light mb-4">Proveri email</h1>
            <p className="text-muted mb-8">
              Ako postoji nalog sa emailom <strong>{email}</strong>, poslali smo ti link za resetovanje lozinke.
            </p>
            
            <Link
              href="/login"
              className="inline-block w-full py-3.5 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
            >
              Nazad na prijavu
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center py-12 lg:py-16 bg-secondary/30">
      <div className="w-full max-w-md px-6">
        <div className="bg-white rounded-3xl border border-border shadow-sm p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-light mb-2">Zaboravljena lozinka?</h1>
            <p className="text-muted text-sm">Unesite email i poslaćemo vam link za reset</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-error/10 border border-error/20 rounded-xl p-4">
                <p className="text-sm text-error">{error}</p>
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
                  Slanje...
                </>
              ) : 'Pošalji link za reset'}
            </button>
          </form>

          <p className="text-center text-sm text-muted mt-8">
            Setiš se lozinke?{' '}
            <Link href="/login" className="text-foreground hover:underline font-medium">
              Prijavi se
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
