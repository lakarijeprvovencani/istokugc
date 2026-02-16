'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = searchParams.get('plan') as 'monthly' | 'yearly' | null;
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const redirectToStripe = async () => {
      if (!plan || !['monthly', 'yearly'].includes(plan)) {
        setError('Neispravan plan');
        setIsLoading(false);
        return;
      }

      // Dohvati email iz localStorage (sačuvan prilikom registracije)
      let email = '';
      try {
        const savedData = localStorage.getItem('businessRegistration');
        if (savedData) {
          const registrationData = JSON.parse(savedData);
          email = registrationData.email || '';
        }
      } catch (e) {
        console.error('Error reading registration data:', e);
      }

      try {
        // Pozovi API da kreira Stripe Checkout Session sa email-om
        const response = await fetch('/api/stripe/create-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan, email }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Greška pri kreiranju checkout sesije');
        }

        // Redirect na Stripe Checkout
        if (data.url) {
          window.location.href = data.url;
        } else {
          throw new Error('Stripe URL nije dobijen');
        }

      } catch (err) {
        console.error('Checkout error:', err);
        setError(err instanceof Error ? err.message : 'Greška pri učitavanju');
        setIsLoading(false);
      }
    };

    redirectToStripe();
  }, [plan]);

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="max-w-md mx-auto px-6 text-center">
          <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-light text-white mb-4">Greška</h1>
          <p className="text-white/60 mb-8">{error}</p>
          <Link
            href="/register/biznis"
            className="inline-block px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors"
          >
            Vrati se nazad
          </Link>
        </div>
      </div>
    );
  }

  // Loading state - redirecting to Stripe
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
        <h2 className="text-white text-xl font-light mb-2">Preusmeravanje na plaćanje...</h2>
        <p className="text-white/60">Bićete preusmereni na sigurnu Stripe stranicu</p>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white">Učitavanje...</div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
