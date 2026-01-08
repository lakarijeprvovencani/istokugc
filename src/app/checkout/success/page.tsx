'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useDemo } from '@/context/DemoContext';
import { createClient } from '@/lib/supabase/client';
import confetti from 'canvas-confetti';

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = searchParams.get('plan') as 'monthly' | 'yearly' | null;
  const sessionId = searchParams.get('session_id');
  const { loginAsNewBusiness, updateCurrentUser } = useDemo();
  
  const [isCreating, setIsCreating] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRenewal, setIsRenewal] = useState(false);
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;
    
    const processPayment = async () => {
      try {
        // Proveri da li je obnova pretplate (postojeći korisnik)
        const renewBusinessId = sessionStorage.getItem('renewBusinessId');
        
        if (renewBusinessId) {
          // OBNOVA PRETPLATE za postojećeg korisnika
          setIsRenewal(true);
          
          // Dohvati Stripe session podatke
          let stripeCustomerId = null;
          let stripeSubscriptionId = null;

          if (sessionId) {
            try {
              const stripeResponse = await fetch(`/api/stripe/session/${sessionId}`);
              if (stripeResponse.ok) {
                const stripeData = await stripeResponse.json();
                stripeCustomerId = stripeData.customer;
                stripeSubscriptionId = stripeData.subscription;
              }
            } catch (stripeError) {
              console.error('Error fetching Stripe session:', stripeError);
            }
          }
          
          // Ažuriraj pretplatu u bazi
          const response = await fetch('/api/subscription/renew', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              businessId: renewBusinessId,
              plan: plan || 'monthly',
              stripeCustomerId,
              stripeSubscriptionId,
            }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Greška pri obnovi pretplate');
          }

          // Ažuriraj lokalni state
          updateCurrentUser({ 
            subscriptionStatus: 'active',
            subscriptionPlan: plan || 'monthly'
          });
          
          // Očisti sessionStorage
          sessionStorage.removeItem('renewBusinessId');
          
          setIsCreating(false);
          showConfetti();
          return;
        }
        
        // NOVA REGISTRACIJA
        const savedData = localStorage.getItem('businessRegistration');
        if (!savedData) {
          setError('Podaci za registraciju nisu pronađeni. Molimo registrujte se ponovo.');
          setIsCreating(false);
          return;
        }
        
        const registrationData = JSON.parse(savedData);

        // Dohvati Stripe session podatke ako postoji session_id
        let stripeCustomerId = null;
        let stripeSubscriptionId = null;

        if (sessionId) {
          try {
            const stripeResponse = await fetch(`/api/stripe/session/${sessionId}`);
            if (stripeResponse.ok) {
              const stripeData = await stripeResponse.json();
              stripeCustomerId = stripeData.customerId;  // Fixed: was 'customer'
              stripeSubscriptionId = stripeData.subscriptionId;  // Fixed: was 'subscription'
              console.log('Stripe data:', { stripeCustomerId, stripeSubscriptionId });
            }
          } catch (stripeError) {
            console.error('Error fetching Stripe session:', stripeError);
          }
        }
        
        // Call API to create business in Supabase
        const response = await fetch('/api/auth/register/business', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: registrationData.email,
            password: registrationData.password,
            companyName: registrationData.companyName,
            website: registrationData.website || null,
            industry: registrationData.industry || null,
            description: registrationData.description || null,
            plan: plan || 'monthly',
            stripeCustomerId,
            stripeSubscriptionId,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Greška pri kreiranju naloga');
        }

        // Success! Log in to Supabase Auth
        const supabase = createClient();
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email: registrationData.email,
          password: registrationData.password,
        });
        
        if (loginError) {
          console.error('Auto-login error:', loginError);
          // Not critical - user can log in manually
        }
        
        // Upload logo if provided
        if (registrationData.logo && data.businessId) {
          try {
            await fetch(`/api/business/${data.businessId}/logo`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ logo: registrationData.logo }),
            });
          } catch (logoError) {
            console.error('Error uploading logo:', logoError);
            // Not critical - user can add logo later
          }
        }
        
        // Update local state
        loginAsNewBusiness(data.businessId, data.companyName, 'active', plan || 'monthly');
        
        // Clear registration data
        localStorage.removeItem('businessRegistration');
        
        setIsCreating(false);
        showConfetti();

      } catch (err) {
        console.error('Payment processing error:', err);
        setError(err instanceof Error ? err.message : 'Greška pri obradi plaćanja');
        setIsCreating(false);
      }
    };
    
    const showConfetti = () => {
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
    };

    processPayment();
  }, [loginAsNewBusiness, updateCurrentUser, plan, sessionId]);

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

  // Loading state
  if (isCreating) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted">{isRenewal ? 'Aktiviram pretplatu...' : 'Kreiram vaš nalog...'}</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center py-12">
        <div className="max-w-md mx-auto px-6 text-center">
          <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-light mb-4">Greška</h1>
          <p className="text-muted mb-8">{error}</p>
          <Link
            href={isRenewal ? "/pricing" : "/register/biznis"}
            className="inline-block px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors"
          >
            Pokušaj ponovo
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-gradient-to-b from-success/5 to-white py-12 lg:py-16">
      <div className="max-w-2xl mx-auto px-6 text-center">
        {/* Success Icon */}
        <div className="mb-8">
          <div className="w-24 h-24 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-12 h-12 text-success">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          </div>
          <h1 className="text-4xl font-light mb-4">
            {isRenewal ? 'Pretplata obnovljena!' : 'Plaćanje uspešno!'}
          </h1>
          <p className="text-muted text-lg">
            {isRenewal 
              ? 'Vaša pretplata je ponovo aktivna. Možete nastaviti sa korišćenjem platforme.'
              : 'Dobrodošli u UGC Select. Vaš nalog je aktiviran.'
            }
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
