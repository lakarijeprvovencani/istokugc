'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDemo } from '@/context/DemoContext';
import { categories, platforms, languages } from '@/lib/mockData';

type UserTab = 'kreator' | 'biznis';

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUserType } = useDemo();
  
  const initialTab = searchParams.get('tab') as UserTab || 'kreator';
  const [activeTab, setActiveTab] = useState<UserTab>(initialTab);
  const [step, setStep] = useState(1);

  // Kreator form
  const [kreatorData, setKreatorData] = useState({
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
    tiktok: '',
    youtube: '',
    phone: '',
  });

  // Biznis form
  const [biznisData, setBiznisData] = useState({
    companyName: '',
    email: '',
    password: '',
    website: '',
    industry: '',
  });

  useEffect(() => {
    const tab = searchParams.get('tab') as UserTab;
    if (tab === 'kreator' || tab === 'biznis') {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleCategoryToggle = (category: string) => {
    setKreatorData(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  };

  const handlePlatformToggle = (platform: string) => {
    setKreatorData(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter(p => p !== platform)
        : [...prev.platforms, platform]
    }));
  };

  const handleLanguageToggle = (language: string) => {
    setKreatorData(prev => ({
      ...prev,
      languages: prev.languages.includes(language)
        ? prev.languages.filter(l => l !== language)
        : [...prev.languages, language]
    }));
  };

  const handleKreatorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 3) {
      setStep(step + 1);
    } else {
      setUserType('creator');
      router.push('/dashboard');
    }
  };

  const handleBiznisSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUserType('businessUnpaid');
    router.push('/dashboard');
  };


  const handleTabChange = (tab: UserTab) => {
    setActiveTab(tab);
    setStep(1);
  };

  return (
    <div className="min-h-screen py-20 bg-secondary/30">
      <div className="max-w-xl mx-auto px-6">
        <div className="bg-white rounded-3xl border border-border shadow-sm overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-border">
            <button
              onClick={() => handleTabChange('kreator')}
              className={`flex-1 py-4 text-sm font-medium transition-colors ${
                activeTab === 'kreator'
                  ? 'bg-white text-foreground border-b-2 border-primary'
                  : 'bg-secondary/50 text-muted hover:text-foreground'
              }`}
            >
              🎨 UGC Kreator
            </button>
            <button
              onClick={() => handleTabChange('biznis')}
              className={`flex-1 py-4 text-sm font-medium transition-colors ${
                activeTab === 'biznis'
                  ? 'bg-white text-foreground border-b-2 border-primary'
                  : 'bg-secondary/50 text-muted hover:text-foreground'
              }`}
            >
              🏢 Firma / Brend
            </button>
          </div>

          <div className="p-8">
            {/* KREATOR REGISTRATION */}
            {activeTab === 'kreator' && (
              <>
                <div className="text-center mb-8">
                  <h1 className="text-2xl font-light mb-2">Postani UGC kreator</h1>
                  <p className="text-muted text-sm">Registracija je besplatna</p>
                </div>

                {/* Progress */}
                <div className="flex items-center justify-center gap-2 mb-8">
                  {[1, 2, 3].map((s) => (
                    <div key={s} className="flex items-center gap-2">
                      <div 
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          s <= step ? 'bg-primary text-white' : 'bg-secondary text-muted'
                        }`}
                      >
                        {s < step ? '✓' : s}
                      </div>
                      {s < 3 && (
                        <div className={`w-8 h-0.5 ${s < step ? 'bg-primary' : 'bg-border'}`} />
                      )}
                    </div>
                  ))}
                </div>

                <form onSubmit={handleKreatorSubmit} className="space-y-5">
                  {step === 1 && (
                    <>
                      <div>
                        <label className="text-sm text-muted mb-2 block">Ime i prezime *</label>
                        <input
                          type="text"
                          value={kreatorData.name}
                          onChange={(e) => setKreatorData({ ...kreatorData, name: e.target.value })}
                          placeholder="Tvoje ime"
                          className="w-full px-4 py-3.5 border border-border rounded-xl focus:outline-none focus:border-muted"
                          required
                        />
                      </div>

                      <div>
                        <label className="text-sm text-muted mb-2 block">Email adresa *</label>
                        <input
                          type="email"
                          value={kreatorData.email}
                          onChange={(e) => setKreatorData({ ...kreatorData, email: e.target.value })}
                          placeholder="tvoj@email.com"
                          className="w-full px-4 py-3.5 border border-border rounded-xl focus:outline-none focus:border-muted"
                          required
                        />
                        <p className="text-xs text-muted mt-1.5">Poslat ćemo ti verifikacioni email</p>
                      </div>

                      <div>
                        <label className="text-sm text-muted mb-2 block">Lozinka *</label>
                        <input
                          type="password"
                          value={kreatorData.password}
                          onChange={(e) => setKreatorData({ ...kreatorData, password: e.target.value })}
                          placeholder="Minimum 8 karaktera"
                          className="w-full px-4 py-3.5 border border-border rounded-xl focus:outline-none focus:border-muted"
                          required
                          minLength={8}
                        />
                      </div>

                      <div>
                        <label className="text-sm text-muted mb-2 block">Lokacija *</label>
                        <input
                          type="text"
                          value={kreatorData.location}
                          onChange={(e) => setKreatorData({ ...kreatorData, location: e.target.value })}
                          placeholder="Beograd, Srbija"
                          className="w-full px-4 py-3.5 border border-border rounded-xl focus:outline-none focus:border-muted"
                          required
                        />
                      </div>
                    </>
                  )}

                  {step === 2 && (
                    <>
                      <div>
                        <label className="text-sm text-muted mb-2 block">O tebi (bio) *</label>
                        <textarea
                          value={kreatorData.bio}
                          onChange={(e) => setKreatorData({ ...kreatorData, bio: e.target.value })}
                          placeholder="Opiši sebe i svoje iskustvo..."
                          rows={3}
                          className="w-full px-4 py-3.5 border border-border rounded-xl focus:outline-none focus:border-muted resize-none"
                          required
                        />
                      </div>

                      <div>
                        <label className="text-sm text-muted mb-2 block">Kategorije *</label>
                        <div className="flex flex-wrap gap-2">
                          {categories.map((category) => (
                            <button
                              key={category}
                              type="button"
                              onClick={() => handleCategoryToggle(category)}
                              className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                                kreatorData.categories.includes(category)
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
                        <label className="text-sm text-muted mb-2 block">Platforme *</label>
                        <div className="flex flex-wrap gap-2">
                          {platforms.map((platform) => (
                            <button
                              key={platform}
                              type="button"
                              onClick={() => handlePlatformToggle(platform)}
                              className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                                kreatorData.platforms.includes(platform)
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
                        <label className="text-sm text-muted mb-2 block">Jezici *</label>
                        <div className="flex flex-wrap gap-2">
                          {languages.map((language) => (
                            <button
                              key={language}
                              type="button"
                              onClick={() => handleLanguageToggle(language)}
                              className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                                kreatorData.languages.includes(language)
                                  ? 'bg-primary text-white'
                                  : 'bg-secondary hover:bg-accent'
                              }`}
                            >
                              {language}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {step === 3 && (
                    <>
                      <div>
                        <label className="text-sm text-muted mb-2 block">Početna cena po videu (€) *</label>
                        <input
                          type="number"
                          value={kreatorData.priceFrom}
                          onChange={(e) => setKreatorData({ ...kreatorData, priceFrom: e.target.value })}
                          placeholder="100"
                          className="w-full px-4 py-3.5 border border-border rounded-xl focus:outline-none focus:border-muted"
                          required
                          min={1}
                        />
                      </div>

                      <div>
                        <label className="text-sm text-muted mb-2 block">Instagram handle</label>
                        <input
                          type="text"
                          value={kreatorData.instagram}
                          onChange={(e) => setKreatorData({ ...kreatorData, instagram: e.target.value })}
                          placeholder="@tvojhandle"
                          className="w-full px-4 py-3.5 border border-border rounded-xl focus:outline-none focus:border-muted"
                        />
                      </div>

                      <div>
                        <label className="text-sm text-muted mb-2 block">TikTok handle</label>
                        <input
                          type="text"
                          value={kreatorData.tiktok}
                          onChange={(e) => setKreatorData({ ...kreatorData, tiktok: e.target.value })}
                          placeholder="@tvojhandle"
                          className="w-full px-4 py-3.5 border border-border rounded-xl focus:outline-none focus:border-muted"
                        />
                      </div>

                      <div>
                        <label className="text-sm text-muted mb-2 block">YouTube kanal</label>
                        <input
                          type="text"
                          value={kreatorData.youtube}
                          onChange={(e) => setKreatorData({ ...kreatorData, youtube: e.target.value })}
                          placeholder="@tvojkanal ili URL kanala"
                          className="w-full px-4 py-3.5 border border-border rounded-xl focus:outline-none focus:border-muted"
                        />
                      </div>

                      <div>
                        <label className="text-sm text-muted mb-2 block">Broj telefona</label>
                        <input
                          type="tel"
                          value={kreatorData.phone}
                          onChange={(e) => setKreatorData({ ...kreatorData, phone: e.target.value })}
                          placeholder="+381 61 123 4567"
                          className="w-full px-4 py-3.5 border border-border rounded-xl focus:outline-none focus:border-muted"
                        />
                      </div>

                      <div className="bg-secondary/50 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                          <span className="text-lg">ℹ️</span>
                          <p className="text-sm text-muted">
                            Nakon registracije, naš tim će pregledati tvoj profil. 
                            Kada bude odobren, postaće vidljiv brendovima.
                          </p>
                        </div>
                      </div>

                      <label className="flex items-start gap-3">
                        <input type="checkbox" required className="mt-1" />
                        <span className="text-sm text-muted">
                          Slažem se sa{' '}
                          <Link href="#" className="underline">uslovima korišćenja</Link>
                          {' '}i{' '}
                          <Link href="#" className="underline">politikom privatnosti</Link>
                        </span>
                      </label>
                    </>
                  )}

                  <div className="flex justify-between pt-4">
                    {step > 1 ? (
                      <button
                        type="button"
                        onClick={() => setStep(step - 1)}
                        className="px-4 py-2 text-sm text-muted hover:text-foreground"
                      >
                        ← Nazad
                      </button>
                    ) : (
                      <div />
                    )}
                    
                    <button
                      type="submit"
                      className="px-8 py-3.5 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
                    >
                      {step < 3 ? 'Nastavi' : 'Završi registraciju'}
                    </button>
                  </div>
                </form>

              </>
            )}

            {/* BIZNIS REGISTRATION */}
            {activeTab === 'biznis' && (
              <>
                <div className="text-center mb-8">
                  <h1 className="text-2xl font-light mb-2">Registruj svoju firmu</h1>
                  <p className="text-muted text-sm">Pronađi savršene UGC kreatore</p>
                </div>

                <form onSubmit={handleBiznisSubmit} className="space-y-5">
                  <div>
                    <label className="text-sm text-muted mb-2 block">Ime kompanije *</label>
                    <input
                      type="text"
                      value={biznisData.companyName}
                      onChange={(e) => setBiznisData({ ...biznisData, companyName: e.target.value })}
                      placeholder="Ime tvoje firme"
                      className="w-full px-4 py-3.5 border border-border rounded-xl focus:outline-none focus:border-muted"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm text-muted mb-2 block">Email adresa *</label>
                    <input
                      type="email"
                      value={biznisData.email}
                      onChange={(e) => setBiznisData({ ...biznisData, email: e.target.value })}
                      placeholder="firma@email.com"
                      className="w-full px-4 py-3.5 border border-border rounded-xl focus:outline-none focus:border-muted"
                      required
                    />
                    <p className="text-xs text-muted mt-1.5">Poslat ćemo ti verifikacioni email</p>
                  </div>

                  <div>
                    <label className="text-sm text-muted mb-2 block">Lozinka *</label>
                    <input
                      type="password"
                      value={biznisData.password}
                      onChange={(e) => setBiznisData({ ...biznisData, password: e.target.value })}
                      placeholder="Minimum 8 karaktera"
                      className="w-full px-4 py-3.5 border border-border rounded-xl focus:outline-none focus:border-muted"
                      required
                      minLength={8}
                    />
                  </div>

                  <div>
                    <label className="text-sm text-muted mb-2 block">Website</label>
                    <input
                      type="url"
                      value={biznisData.website}
                      onChange={(e) => setBiznisData({ ...biznisData, website: e.target.value })}
                      placeholder="https://www.tvojsajt.com"
                      className="w-full px-4 py-3.5 border border-border rounded-xl focus:outline-none focus:border-muted"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-muted mb-2 block">Industrija</label>
                    <select
                      value={biznisData.industry}
                      onChange={(e) => setBiznisData({ ...biznisData, industry: e.target.value })}
                      className="w-full px-4 py-3.5 border border-border rounded-xl focus:outline-none focus:border-muted bg-white"
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

                  {/* Pricing info */}
                  <div className="bg-secondary/50 rounded-xl p-4">
                    <div className="text-xs uppercase tracking-wider text-muted mb-3">Planovi pretplate</div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white rounded-lg p-3 border border-border">
                        <div className="font-medium">€49</div>
                        <div className="text-xs text-muted">mesečno</div>
                      </div>
                      <div className="bg-white rounded-lg p-3 border-2 border-primary relative">
                        <div className="absolute -top-2 right-2 bg-primary text-white text-[10px] px-2 py-0.5 rounded-full">
                          -17%
                        </div>
                        <div className="font-medium">€490</div>
                        <div className="text-xs text-muted">godišnje</div>
                      </div>
                    </div>
                    <p className="text-xs text-muted mt-3 text-center">
                      Plan izabereš nakon registracije
                    </p>
                  </div>

                  <label className="flex items-start gap-3">
                    <input type="checkbox" required className="mt-1" />
                    <span className="text-sm text-muted">
                      Slažem se sa{' '}
                      <Link href="#" className="underline">uslovima korišćenja</Link>
                      {' '}i{' '}
                      <Link href="#" className="underline">politikom privatnosti</Link>
                    </span>
                  </label>

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
                  >
                    Registruj se
                  </button>
                </form>

              </>
            )}

            <p className="text-center text-sm text-muted mt-8">
              Već imaš nalog?{' '}
              <Link href="/login" className="text-foreground hover:underline font-medium">
                Prijavi se
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Učitavanje...</div>}>
      <RegisterContent />
    </Suspense>
  );
}

