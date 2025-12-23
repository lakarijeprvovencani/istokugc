'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDemo } from '@/context/DemoContext';
import { categories, platforms, languages } from '@/lib/mockData';

export default function RegisterCreatorPage() {
  const router = useRouter();
  const { setUserType } = useDemo();
  
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    bio: '',
    location: '',
    priceFrom: '',
    categories: [] as string[],
    platforms: [] as string[],
    languages: [] as string[],
    instagram: '',
    phone: '',
  });

  const handleCategoryToggle = (category: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  };

  const handlePlatformToggle = (platform: string) => {
    setFormData(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter(p => p !== platform)
        : [...prev.platforms, platform]
    }));
  };

  const handleLanguageToggle = (language: string) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.includes(language)
        ? prev.languages.filter(l => l !== language)
        : [...prev.languages, language]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 3) {
      setStep(step + 1);
    } else {
      // Demo: just log in as creator
      setUserType('creator');
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen py-20">
      <div className="max-w-2xl mx-auto px-6">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-light mb-3">Postani UGC kreator</h1>
          <p className="text-muted">Registracija je besplatna</p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-3 mb-12">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-3">
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
                  s <= step ? 'bg-primary text-white' : 'bg-secondary text-muted'
                }`}
              >
                {s < step ? '✓' : s}
              </div>
              {s < 3 && (
                <div className={`w-16 h-0.5 ${s < step ? 'bg-primary' : 'bg-border'}`} />
              )}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-border rounded-3xl p-8">
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-medium mb-6">Osnovne informacije</h2>
              
              <div>
                <label className="text-sm text-muted mb-2 block">Ime i prezime *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Tvoje ime"
                  className="w-full px-5 py-4 border border-border rounded-xl focus:outline-none focus:border-muted"
                  required
                />
              </div>

              <div>
                <label className="text-sm text-muted mb-2 block">Email adresa *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="tvoj@email.com"
                  className="w-full px-5 py-4 border border-border rounded-xl focus:outline-none focus:border-muted"
                  required
                />
                <p className="text-xs text-muted mt-2">Poslat ćemo ti verifikacioni email</p>
              </div>

              <div>
                <label className="text-sm text-muted mb-2 block">Lozinka *</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Minimum 8 karaktera"
                  className="w-full px-5 py-4 border border-border rounded-xl focus:outline-none focus:border-muted"
                  required
                  minLength={8}
                />
              </div>

              <div>
                <label className="text-sm text-muted mb-2 block">Lokacija *</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Beograd, Srbija"
                  className="w-full px-5 py-4 border border-border rounded-xl focus:outline-none focus:border-muted"
                  required
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8">
              <h2 className="text-xl font-medium mb-6">Tvoj profil</h2>
              
              <div>
                <label className="text-sm text-muted mb-2 block">O tebi (bio) *</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Opiši sebe i svoje iskustvo..."
                  rows={4}
                  className="w-full px-5 py-4 border border-border rounded-xl focus:outline-none focus:border-muted resize-none"
                  required
                />
              </div>

              <div>
                <label className="text-sm text-muted mb-3 block">Kategorije (izaberi do 5) *</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => handleCategoryToggle(category)}
                      className={`px-4 py-2 rounded-full text-sm transition-colors ${
                        formData.categories.includes(category)
                          ? 'bg-primary text-white'
                          : 'bg-secondary hover:bg-accent'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm text-muted mb-3 block">Platforme *</label>
                <div className="flex flex-wrap gap-2">
                  {platforms.map((platform) => (
                    <button
                      key={platform}
                      type="button"
                      onClick={() => handlePlatformToggle(platform)}
                      className={`px-4 py-2 rounded-full text-sm transition-colors ${
                        formData.platforms.includes(platform)
                          ? 'bg-primary text-white'
                          : 'bg-secondary hover:bg-accent'
                      }`}
                    >
                      {platform}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm text-muted mb-3 block">Jezici *</label>
                <div className="flex flex-wrap gap-2">
                  {languages.map((language) => (
                    <button
                      key={language}
                      type="button"
                      onClick={() => handleLanguageToggle(language)}
                      className={`px-4 py-2 rounded-full text-sm transition-colors ${
                        formData.languages.includes(language)
                          ? 'bg-primary text-white'
                          : 'bg-secondary hover:bg-accent'
                      }`}
                    >
                      {language}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-medium mb-6">Kontakt i cene</h2>
              
              <div>
                <label className="text-sm text-muted mb-2 block">Početna cena po videu (€) *</label>
                <input
                  type="number"
                  value={formData.priceFrom}
                  onChange={(e) => setFormData({ ...formData, priceFrom: e.target.value })}
                  placeholder="100"
                  className="w-full px-5 py-4 border border-border rounded-xl focus:outline-none focus:border-muted"
                  required
                  min={1}
                />
              </div>

              <div>
                <label className="text-sm text-muted mb-2 block">Instagram handle</label>
                <input
                  type="text"
                  value={formData.instagram}
                  onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                  placeholder="@tvojhandle"
                  className="w-full px-5 py-4 border border-border rounded-xl focus:outline-none focus:border-muted"
                />
              </div>

              <div>
                <label className="text-sm text-muted mb-2 block">Broj telefona</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+381 61 123 4567"
                  className="w-full px-5 py-4 border border-border rounded-xl focus:outline-none focus:border-muted"
                />
              </div>

              <div className="bg-secondary rounded-xl p-5 mt-8">
                <div className="flex items-start gap-3">
                  <span className="text-xl">ℹ️</span>
                  <div>
                    <h4 className="font-medium mb-1">Šta sledi?</h4>
                    <p className="text-sm text-muted">
                      Nakon registracije, naš tim će pregledati tvoj profil. 
                      Kada bude odobren, postaće vidljiv brendovima na platformi.
                    </p>
                  </div>
                </div>
              </div>

              <label className="flex items-start gap-3 mt-6">
                <input type="checkbox" required className="mt-1" />
                <span className="text-sm text-muted">
                  Slažem se sa{' '}
                  <Link href="#" className="underline">uslovima korišćenja</Link>
                  {' '}i{' '}
                  <Link href="#" className="underline">politikom privatnosti</Link>
                </span>
              </label>
            </div>
          )}

          <div className="flex justify-between mt-10">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="px-6 py-3 text-sm text-muted hover:text-foreground"
              >
                ← Nazad
              </button>
            ) : (
              <div />
            )}
            
            <button
              type="submit"
              className="px-8 py-4 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
            >
              {step < 3 ? 'Nastavi' : 'Završi registraciju'}
            </button>
          </div>
        </form>

        <p className="text-center text-sm text-muted mt-10">
          Već imaš nalog?{' '}
          <Link href="/login" className="text-foreground hover:underline">
            Prijavi se
          </Link>
        </p>

        <p className="text-center text-sm text-muted mt-4">
          Registruješ brend?{' '}
          <Link href="/register/biznis" className="text-foreground hover:underline">
            Registruj se kao brend
          </Link>
        </p>
      </div>
    </div>
  );
}

