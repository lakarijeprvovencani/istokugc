'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDemo } from '@/context/DemoContext';

export default function PricingPage() {
  const router = useRouter();
  const { currentUser, isLoggedIn } = useDemo();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly' | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectPlan = async (plan: 'monthly' | 'yearly') => {
    setSelectedPlan(plan);
    setIsLoading(true);

    try {
      // Kreiraj Stripe checkout sesiju
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });

      if (response.ok) {
        const { url } = await response.json();
        // Sačuvaj business ID za aktivaciju/obnovu pretplate
        // Ovo pokriva i slučaj kad biznis nikad nije platio
        if (currentUser.businessId) {
          sessionStorage.setItem('renewBusinessId', currentUser.businessId);
        }
        window.location.href = url;
      } else {
        throw new Error('Failed to create checkout session');
      }
    } catch (error) {
      console.error('Error:', error);
      setIsLoading(false);
      setSelectedPlan(null);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-gradient-to-b from-secondary/50 to-white py-12 lg:py-20">
      <div className="max-w-5xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl lg:text-5xl font-light mb-4">
            Izaberi plan
          </h1>
          <p className="text-muted text-lg max-w-2xl mx-auto">
            Pristupite svim kreatorima, njihovim kontakt informacijama i mogućnosti direktne saradnje.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {/* Monthly Plan */}
          <div 
            className={`bg-white rounded-3xl border-2 p-8 transition-all cursor-pointer hover:shadow-lg ${
              selectedPlan === 'monthly' ? 'border-primary shadow-lg' : 'border-border'
            }`}
            onClick={() => !isLoading && setSelectedPlan('monthly')}
          >
            <div className="text-center mb-6">
              <h3 className="text-xl font-medium mb-2">Mesečni plan</h3>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-4xl font-light">€49</span>
                <span className="text-muted">/mesec</span>
              </div>
            </div>
            
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-3 text-sm">
                <svg className="w-5 h-5 text-success flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Pristup svim kreatorima
              </li>
              <li className="flex items-center gap-3 text-sm">
                <svg className="w-5 h-5 text-success flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Kontakt informacije kreatora
              </li>
              <li className="flex items-center gap-3 text-sm">
                <svg className="w-5 h-5 text-success flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Neograničena pretraga
              </li>
              <li className="flex items-center gap-3 text-sm">
                <svg className="w-5 h-5 text-success flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Otkaži kad želiš
              </li>
            </ul>
            
            <button
              onClick={() => handleSelectPlan('monthly')}
              disabled={isLoading}
              className={`w-full py-3.5 rounded-xl font-medium transition-colors ${
                selectedPlan === 'monthly'
                  ? 'bg-primary text-white hover:bg-primary/90'
                  : 'border border-border hover:bg-secondary'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isLoading && selectedPlan === 'monthly' ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Učitavanje...
                </span>
              ) : (
                'Izaberi mesečni'
              )}
            </button>
          </div>

          {/* Yearly Plan */}
          <div 
            className={`bg-white rounded-3xl border-2 p-8 transition-all cursor-pointer hover:shadow-lg relative ${
              selectedPlan === 'yearly' ? 'border-primary shadow-lg' : 'border-border'
            }`}
            onClick={() => !isLoading && setSelectedPlan('yearly')}
          >
            {/* Popular badge */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-success text-white text-xs font-medium px-3 py-1 rounded-full">
                Uštedi 17%
              </span>
            </div>
            
            <div className="text-center mb-6">
              <h3 className="text-xl font-medium mb-2">Godišnji plan</h3>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-4xl font-light">€490</span>
                <span className="text-muted">/godina</span>
              </div>
              <p className="text-sm text-success mt-1">Ušteda €98 godišnje</p>
            </div>
            
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-3 text-sm">
                <svg className="w-5 h-5 text-success flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Sve iz mesečnog plana
              </li>
              <li className="flex items-center gap-3 text-sm">
                <svg className="w-5 h-5 text-success flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                2 meseca gratis
              </li>
              <li className="flex items-center gap-3 text-sm">
                <svg className="w-5 h-5 text-success flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Prioritetna podrška
              </li>
              <li className="flex items-center gap-3 text-sm">
                <svg className="w-5 h-5 text-success flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Najbolja vrednost
              </li>
            </ul>
            
            <button
              onClick={() => handleSelectPlan('yearly')}
              disabled={isLoading}
              className={`w-full py-3.5 rounded-xl font-medium transition-colors ${
                selectedPlan === 'yearly'
                  ? 'bg-primary text-white hover:bg-primary/90'
                  : 'border border-border hover:bg-secondary'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isLoading && selectedPlan === 'yearly' ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Učitavanje...
                </span>
              ) : (
                'Izaberi godišnji'
              )}
            </button>
          </div>
        </div>

        {/* Back link */}
        <div className="text-center mt-12">
          <Link 
            href={currentUser.type === 'business' ? '/dashboard' : '/'} 
            className="text-muted hover:text-foreground transition-colors"
          >
            ← {currentUser.type === 'business' ? 'Nazad na Dashboard' : 'Nazad na početnu'}
          </Link>
        </div>

        {/* Trust badges */}
        <div className="mt-16 pt-8 border-t border-border">
          <div className="flex flex-wrap justify-center items-center gap-8 text-muted text-sm">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Sigurno plaćanje
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#635BFF]">stripe</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Otkaži bilo kad
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

