'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function RegisterBusinessPage() {
  const router = useRouter();
  const [step, setStep] = useState<'info' | 'plan'>('info');
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly' | null>(null);
  
  const [formData, setFormData] = useState({
    companyName: '',
    email: '',
    password: '',
    website: '',
    industry: '',
    description: '',
  });

  const handleInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('plan');
  };

  const handlePlanSelect = (plan: 'monthly' | 'yearly') => {
    setSelectedPlan(plan);
    // Store form data in sessionStorage for checkout
    sessionStorage.setItem('businessRegistration', JSON.stringify({
      ...formData,
      plan,
    }));
    router.push(`/checkout?plan=${plan}`);
  };

  if (step === 'plan') {
    return (
      <div className="min-h-screen py-20 bg-gradient-to-b from-secondary/30 to-white">
        <div className="max-w-4xl mx-auto px-6">
          {/* Back button */}
          <button 
            onClick={() => setStep('info')}
            className="flex items-center gap-2 text-muted hover:text-foreground mb-8 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
            Nazad
          </button>

          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm mb-6">
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
              Korak 2 od 2
            </div>
            <h1 className="text-4xl font-light mb-4">Izaberi svoj plan</h1>
            <p className="text-muted text-lg max-w-xl mx-auto">
              Dobij pristup svim kreatorima i kontakt informacijama. Otkaži kad god želiš.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Monthly Plan */}
            <div 
              onClick={() => handlePlanSelect('monthly')}
              className={`bg-white rounded-3xl p-8 border-2 cursor-pointer transition-all hover:shadow-lg ${
                selectedPlan === 'monthly' ? 'border-primary shadow-lg' : 'border-border hover:border-muted'
              }`}
            >
              <div className="text-sm uppercase tracking-wider text-muted mb-4">Mesečno</div>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-5xl font-light">€49</span>
                <span className="text-muted">/mesec</span>
              </div>
              <p className="text-muted mb-8">Fleksibilno, bez obaveza</p>
              
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3 text-sm">
                  <span className="w-5 h-5 rounded-full bg-success/10 text-success flex items-center justify-center text-xs">✓</span>
                  Pristup svim kreatorima
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <span className="w-5 h-5 rounded-full bg-success/10 text-success flex items-center justify-center text-xs">✓</span>
                  Kontakt informacije
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <span className="w-5 h-5 rounded-full bg-success/10 text-success flex items-center justify-center text-xs">✓</span>
                  Neograničena pretraga
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <span className="w-5 h-5 rounded-full bg-success/10 text-success flex items-center justify-center text-xs">✓</span>
                  Email podrška
                </li>
              </ul>

              <button 
                className="w-full py-4 border-2 border-border rounded-xl font-medium hover:bg-secondary transition-colors"
              >
                Izaberi mesečno
              </button>
            </div>

            {/* Yearly Plan */}
            <div 
              onClick={() => handlePlanSelect('yearly')}
              className={`bg-white rounded-3xl p-8 border-2 cursor-pointer transition-all hover:shadow-lg relative ${
                selectedPlan === 'yearly' ? 'border-primary shadow-lg' : 'border-primary'
              }`}
            >
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white text-sm px-4 py-1.5 rounded-full font-medium">
                🔥 Najpopularnije
              </div>
              
              <div className="text-sm uppercase tracking-wider text-muted mb-4">Godišnje</div>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-5xl font-light">€490</span>
                <span className="text-muted">/godina</span>
              </div>
              <div className="flex items-center gap-2 mb-8">
                <span className="text-sm line-through text-muted">€588</span>
                <span className="text-sm text-success font-medium">Uštedi €98</span>
              </div>
              
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3 text-sm">
                  <span className="w-5 h-5 rounded-full bg-success/10 text-success flex items-center justify-center text-xs">✓</span>
                  Sve od mesečnog plana
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <span className="w-5 h-5 rounded-full bg-success/10 text-success flex items-center justify-center text-xs">✓</span>
                  <strong>2 meseca besplatno</strong>
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <span className="w-5 h-5 rounded-full bg-success/10 text-success flex items-center justify-center text-xs">✓</span>
                  Prioritetna podrška
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <span className="w-5 h-5 rounded-full bg-success/10 text-success flex items-center justify-center text-xs">✓</span>
                  Rani pristup novim funkcijama
                </li>
              </ul>

              <button 
                className="w-full py-4 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
              >
                Izaberi godišnje
              </button>
            </div>
          </div>

          <div className="text-center mt-12 space-y-4">
            <div className="flex items-center justify-center gap-6 text-sm text-muted">
              <span className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                </svg>
                Sigurno plaćanje
              </span>
              <span className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
                </svg>
                Stripe zaštita
              </span>
              <span className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
                Otkaži kad želiš
              </span>
            </div>
            <p className="text-sm text-muted">
              Prihvatamo Visa, Mastercard, American Express i druge kartice
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-20">
      <div className="max-w-xl mx-auto px-6">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm mb-6">
            <span className="w-2 h-2 bg-primary rounded-full"></span>
            Korak 1 od 2
          </div>
          <h1 className="text-3xl font-light mb-3">Registruj se kao brend</h1>
          <p className="text-muted">Pronađi savršene UGC kreatore za tvoj brend</p>
        </div>

        <form onSubmit={handleInfoSubmit} className="bg-white border border-border rounded-3xl p-8 space-y-6">
          <div>
            <label className="text-sm text-muted mb-2 block">Ime kompanije *</label>
            <input
              type="text"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              placeholder="Ime tvoje firme"
              className="w-full px-5 py-4 border border-border rounded-xl focus:outline-none focus:border-primary transition-colors"
              required
            />
          </div>

          <div>
            <label className="text-sm text-muted mb-2 block">Email adresa *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="firma@email.com"
              className="w-full px-5 py-4 border border-border rounded-xl focus:outline-none focus:border-primary transition-colors"
              required
            />
          </div>

          <div>
            <label className="text-sm text-muted mb-2 block">Lozinka *</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Minimum 8 karaktera"
              className="w-full px-5 py-4 border border-border rounded-xl focus:outline-none focus:border-primary transition-colors"
              required
              minLength={8}
            />
          </div>

          <div>
            <label className="text-sm text-muted mb-2 block">Website</label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              placeholder="https://www.tvojsajt.com"
              className="w-full px-5 py-4 border border-border rounded-xl focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          <div>
            <label className="text-sm text-muted mb-2 block">Industrija</label>
            <select
              value={formData.industry}
              onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
              className="w-full px-5 py-4 border border-border rounded-xl focus:outline-none focus:border-primary transition-colors bg-white"
            >
              <option value="">Izaberi industriju</option>
              <option value="beauty">Beauty & Kozmetika</option>
              <option value="fashion">Moda</option>
              <option value="tech">Tehnologija</option>
              <option value="food">Hrana & Piće</option>
              <option value="fitness">Fitness & Zdravlje</option>
              <option value="travel">Putovanja</option>
              <option value="finance">Finansije</option>
              <option value="other">Drugo</option>
            </select>
          </div>

          <div>
            <label className="text-sm text-muted mb-2 block">O kompaniji <span className="text-muted font-normal">(opciono)</span></label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Napiši nešto o svojoj kompaniji..."
              rows={4}
              className="w-full px-5 py-4 border border-border rounded-xl focus:outline-none focus:border-primary transition-colors resize-none"
            />
            <p className="text-xs text-muted mt-1 text-right">{formData.description.length} karaktera</p>
          </div>

          <label className="flex items-start gap-3 mt-6">
            <input type="checkbox" required className="mt-1 w-4 h-4 rounded border-border" />
            <span className="text-sm text-muted">
              Slažem se sa{' '}
              <Link href="#" className="underline hover:text-foreground">uslovima korišćenja</Link>
              {' '}i{' '}
              <Link href="#" className="underline hover:text-foreground">politikom privatnosti</Link>
            </span>
          </label>

          <button
            type="submit"
            className="w-full py-4 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
          >
            Nastavi na izbor plana
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </button>
        </form>

        <p className="text-center text-sm text-muted mt-10">
          Već imaš nalog?{' '}
          <Link href="/login" className="text-foreground hover:underline font-medium">
            Prijavi se
          </Link>
        </p>

        <p className="text-center text-sm text-muted mt-4">
          Želiš da se registruješ kao kreator?{' '}
          <Link href="/register/kreator" className="text-foreground hover:underline font-medium">
            Registruj se kao kreator
          </Link>
        </p>
      </div>
    </div>
  );
}
