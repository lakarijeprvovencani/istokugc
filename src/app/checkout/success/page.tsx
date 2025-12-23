'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useDemo } from '@/context/DemoContext';
import confetti from 'canvas-confetti';

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = searchParams.get('plan') as 'monthly' | 'yearly' | null;
  const { setUserType } = useDemo();

  useEffect(() => {
    // Set user as logged in business
    setUserType('business');
    
    // Clear registration data
    sessionStorage.removeItem('businessRegistration');

    // Confetti effect
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval: ReturnType<typeof setInterval> = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);

    return () => clearInterval(interval);
  }, [setUserType]);

  const planDetails = {
    monthly: {
      name: 'Mesečni plan',
      price: '€49/mesec',
      nextBilling: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('sr-RS'),
    },
    yearly: {
      name: 'Godišnji plan',
      price: '€490/godina',
      nextBilling: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString('sr-RS'),
    },
  };

  const selectedPlan = plan ? planDetails[plan] : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-success/5 to-white py-20">
      <div className="max-w-2xl mx-auto px-6 text-center">
        {/* Success Icon */}
        <div className="mb-8">
          <div className="w-24 h-24 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-12 h-12 text-success">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          </div>
          <h1 className="text-4xl font-light mb-4">Plaćanje uspešno!</h1>
          <p className="text-muted text-lg">
            Dobrodošli u UGC Select. Vaš nalog je aktiviran.
          </p>
        </div>

        {/* Order confirmation */}
        <div className="bg-white border border-border rounded-3xl p-8 mb-8 text-left">
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-border">
            <div className="w-10 h-10 bg-success/10 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-success">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </div>
            <div>
              <p className="font-medium">Potvrda narudžbine</p>
              <p className="text-sm text-muted">Račun je poslat na vaš email</p>
            </div>
          </div>

          {selectedPlan && (
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted">Plan</span>
                <span className="font-medium">{selectedPlan.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Cena</span>
                <span className="font-medium">{selectedPlan.price}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Sledeće plaćanje</span>
                <span className="font-medium">{selectedPlan.nextBilling}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Status</span>
                <span className="text-success font-medium flex items-center gap-2">
                  <span className="w-2 h-2 bg-success rounded-full"></span>
                  Aktivna pretplata
                </span>
              </div>
            </div>
          )}
        </div>

        {/* What's next */}
        <div className="bg-white border border-border rounded-3xl p-8 mb-8">
          <h2 className="text-lg font-medium mb-6">Šta dalje?</h2>
          <div className="grid md:grid-cols-3 gap-6 text-left">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <span className="text-xl">🔍</span>
              </div>
              <h3 className="font-medium mb-2">Pretraži kreatore</h3>
              <p className="text-sm text-muted">Filtriraj po kategoriji, lokaciji i ceni</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <span className="text-xl">📧</span>
              </div>
              <h3 className="font-medium mb-2">Kontaktiraj kreatore</h3>
              <p className="text-sm text-muted">Pristupi email i telefonu svakog kreatora</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <span className="text-xl">🤝</span>
              </div>
              <h3 className="font-medium mb-2">Započni saradnju</h3>
              <p className="text-sm text-muted">Dogovori uslove direktno sa kreatorom</p>
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/kreatori"
            className="px-8 py-4 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
          >
            Pretraži kreatore
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </Link>
          <Link
            href="/dashboard"
            className="px-8 py-4 border border-border rounded-xl font-medium hover:bg-secondary transition-colors"
          >
            Idi na Dashboard
          </Link>
        </div>

        {/* Support note */}
        <p className="text-sm text-muted mt-12">
          Imate pitanja? Kontaktirajte nas na{' '}
          <a href="mailto:support@ugcselect.com" className="text-primary hover:underline">
            support@ugcselect.com
          </a>
        </p>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted">Potvrđujem plaćanje...</p>
        </div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}

