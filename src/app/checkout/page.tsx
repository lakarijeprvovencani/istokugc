'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = searchParams.get('plan') as 'monthly' | 'yearly' | null;
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [registrationData, setRegistrationData] = useState<{
    companyName: string;
    email: string;
    plan: string;
  } | null>(null);
  
  const [cardData, setCardData] = useState({
    number: '',
    expiry: '',
    cvc: '',
    name: '',
  });

  useEffect(() => {
    // Get registration data from sessionStorage
    const savedData = sessionStorage.getItem('businessRegistration');
    if (savedData) {
      setRegistrationData(JSON.parse(savedData));
    }
  }, []);

  const planDetails = {
    monthly: {
      name: 'Mesečni plan',
      price: 49,
      period: 'mesec',
      billing: 'Naplata svaki mesec',
    },
    yearly: {
      name: 'Godišnji plan',
      price: 490,
      period: 'godina',
      billing: 'Naplata jednom godišnje',
      savings: 98,
    },
  };

  const selectedPlan = plan ? planDetails[plan] : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    // Simulate Stripe payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // In demo mode, redirect to success
    // In production, this would be handled by Stripe redirect
    router.push('/checkout/success?plan=' + plan);
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(' ') : value;
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  if (!plan || !selectedPlan) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-light mb-4">Neispravan plan</h1>
          <Link href="/register/biznis" className="text-primary hover:underline">
            Vrati se na registraciju
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12">
      <div className="max-w-5xl mx-auto px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/register/biznis" className="text-white/60 hover:text-white flex items-center gap-2 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
            Nazad
          </Link>
          <div className="flex items-center gap-2 text-white/60">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
            Sigurna konekcija
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Left: Payment Form */}
          <div>
            <div className="bg-white rounded-3xl p-8 shadow-2xl">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-primary">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
                  </svg>
                </div>
                <div>
                  <h2 className="font-medium">Podaci za plaćanje</h2>
                  <p className="text-sm text-muted">Unesite podatke vaše kartice</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="text-sm text-muted mb-2 block">Broj kartice</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={cardData.number}
                      onChange={(e) => setCardData({ ...cardData, number: formatCardNumber(e.target.value) })}
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                      className="w-full px-5 py-4 border border-border rounded-xl focus:outline-none focus:border-primary transition-colors pr-20"
                      required
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-1">
                      <div className="w-8 h-5 bg-[#1A1F71] rounded flex items-center justify-center">
                        <span className="text-white text-[8px] font-bold">VISA</span>
                      </div>
                      <div className="w-8 h-5 bg-gradient-to-r from-[#EB001B] to-[#F79E1B] rounded flex items-center justify-center">
                        <div className="w-3 h-3 bg-[#EB001B] rounded-full opacity-80"></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted mb-2 block">Datum isteka</label>
                    <input
                      type="text"
                      value={cardData.expiry}
                      onChange={(e) => setCardData({ ...cardData, expiry: formatExpiry(e.target.value) })}
                      placeholder="MM/YY"
                      maxLength={5}
                      className="w-full px-5 py-4 border border-border rounded-xl focus:outline-none focus:border-primary transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted mb-2 block">CVC</label>
                    <input
                      type="text"
                      value={cardData.cvc}
                      onChange={(e) => setCardData({ ...cardData, cvc: e.target.value.replace(/\D/g, '').substring(0, 4) })}
                      placeholder="123"
                      maxLength={4}
                      className="w-full px-5 py-4 border border-border rounded-xl focus:outline-none focus:border-primary transition-colors"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm text-muted mb-2 block">Ime na kartici</label>
                  <input
                    type="text"
                    value={cardData.name}
                    onChange={(e) => setCardData({ ...cardData, name: e.target.value })}
                    placeholder="Ime i prezime"
                    className="w-full px-5 py-4 border border-border rounded-xl focus:outline-none focus:border-primary transition-colors"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full py-4 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Obrađujem plaćanje...
                    </>
                  ) : (
                    <>
                      Plati €{selectedPlan.price}
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                      </svg>
                    </>
                  )}
                </button>
              </form>

              {/* Security badges */}
              <div className="mt-8 pt-6 border-t border-border">
                <div className="flex items-center justify-center gap-6">
                  <div className="flex items-center gap-2 text-sm text-muted">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-success">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                    </svg>
                    SSL Zaštita
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted">
                    <span className="font-semibold text-[#635BFF]">stripe</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-success">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                    PCI DSS
                  </div>
                </div>
              </div>
            </div>

            {/* Demo notice */}
            <div className="mt-6 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <span className="text-amber-500">⚠️</span>
                <div>
                  <p className="text-sm text-amber-200 font-medium">Demo režim</p>
                  <p className="text-sm text-amber-200/70">
                    Ovo je demo verzija. Možete uneti bilo koje podatke za testiranje. U produkciji, plaćanje će se obraditi preko Stripe-a.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Order Summary */}
          <div>
            <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10 sticky top-8">
              <h3 className="text-white text-lg font-medium mb-6">Pregled narudžbine</h3>
              
              {registrationData && (
                <div className="bg-white/5 rounded-xl p-4 mb-6">
                  <p className="text-white/60 text-sm">Kompanija</p>
                  <p className="text-white font-medium">{registrationData.companyName}</p>
                  <p className="text-white/60 text-sm mt-2">{registrationData.email}</p>
                </div>
              )}

              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-white font-medium">{selectedPlan.name}</p>
                    <p className="text-white/60 text-sm">{selectedPlan.billing}</p>
                  </div>
                  <p className="text-white font-medium">€{selectedPlan.price}</p>
                </div>
                
                {'savings' in selectedPlan && (
                  <div className="flex justify-between items-center text-success">
                    <p className="text-sm">Ušteda</p>
                    <p className="text-sm font-medium">-€{selectedPlan.savings}</p>
                  </div>
                )}
              </div>

              <div className="border-t border-white/10 pt-4 mb-6">
                <div className="flex justify-between items-center">
                  <p className="text-white font-medium">Ukupno</p>
                  <div className="text-right">
                    <p className="text-white text-2xl font-medium">€{selectedPlan.price}</p>
                    <p className="text-white/60 text-sm">/{selectedPlan.period}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-white/80 text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-success">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                  Pristup svim kreatorima
                </div>
                <div className="flex items-center gap-3 text-white/80 text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-success">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                  Kontakt informacije kreatora
                </div>
                <div className="flex items-center gap-3 text-white/80 text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-success">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                  Neograničena pretraga
                </div>
                <div className="flex items-center gap-3 text-white/80 text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-success">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                  Otkaži kad želiš
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-white/10">
                <p className="text-white/60 text-xs text-center">
                  Klikom na &quot;Plati&quot; prihvatate naše{' '}
                  <Link href="#" className="underline hover:text-white">uslove korišćenja</Link>
                  {' '}i{' '}
                  <Link href="#" className="underline hover:text-white">politiku privatnosti</Link>.
                  Pretplata se automatski obnavlja. Možete otkazati u bilo kom trenutku.
                </p>
              </div>
            </div>
          </div>
        </div>
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

