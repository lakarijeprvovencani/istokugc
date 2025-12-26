'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDemo } from '@/context/DemoContext';
import { categories, platforms, languages } from '@/lib/mockData';
import Image from 'next/image';

interface PortfolioItem {
  id: string;
  type: 'youtube' | 'tiktok' | 'instagram' | 'upload';
  url: string;
  thumbnail: string;
  description?: string;
  platform?: 'instagram' | 'tiktok' | 'youtube' | 'other';
}

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
    tiktok: '',
    youtube: '',
    phone: '',
    photo: null as File | null,
  });
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const portfolioInputRef = useRef<HTMLInputElement>(null);
  
  // Portfolio state
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [portfolioDescription, setPortfolioDescription] = useState('');
  const [portfolioError, setPortfolioError] = useState('');

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

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      alert('Molimo izaberite sliku');
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Slika je prevelika. Maksimalna veličina je 5MB.');
      return;
    }

    setFormData(prev => ({ ...prev, photo: file }));

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPhotoPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handle portfolio file upload
  const handlePortfolioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type (image or video)
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      setPortfolioError('Molimo izaberite sliku ili video');
      return;
    }

    // Check file size (max 50MB for videos, 10MB for images)
    const maxSize = file.type.startsWith('video/') ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setPortfolioError(`Fajl je prevelik. Maksimalna veličina: ${file.type.startsWith('video/') ? '50MB' : '10MB'}`);
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const newItem: PortfolioItem = {
        id: `upload-${Date.now()}`,
        type: 'upload',
        url: dataUrl,
        thumbnail: file.type.startsWith('video/') ? '/video-thumbnail.jpg' : dataUrl,
        description: portfolioDescription,
        platform: 'other',
      };
      setPortfolioItems([...portfolioItems, newItem]);
      setPortfolioDescription('');
      setPortfolioError('');
    };
    reader.readAsDataURL(file);
  };

  // Handle portfolio URL add
  const handleAddPortfolioUrl = () => {
    if (!portfolioUrl.trim()) {
      setPortfolioError('Molimo unesite URL');
      return;
    }

    let type: 'youtube' | 'tiktok' | 'instagram' = 'youtube';
    let platform: 'instagram' | 'tiktok' | 'youtube' = 'youtube';
    
    if (portfolioUrl.includes('youtube.com') || portfolioUrl.includes('youtu.be')) {
      type = 'youtube';
      platform = 'youtube';
    } else if (portfolioUrl.includes('tiktok.com')) {
      type = 'tiktok';
      platform = 'tiktok';
    } else if (portfolioUrl.includes('instagram.com')) {
      type = 'instagram';
      platform = 'instagram';
    } else {
      setPortfolioError('URL mora biti sa YouTube, TikTok ili Instagram');
      return;
    }

    const newItem: PortfolioItem = {
      id: `url-${Date.now()}`,
      type,
      url: portfolioUrl,
      thumbnail: 'https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=300&h=400&fit=crop',
      description: portfolioDescription,
      platform,
    };
    
    setPortfolioItems([...portfolioItems, newItem]);
    setPortfolioUrl('');
    setPortfolioDescription('');
    setPortfolioError('');
  };

  // Remove portfolio item
  const handleRemovePortfolioItem = (id: string) => {
    setPortfolioItems(portfolioItems.filter(item => item.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate photo on step 1
    if (step === 1 && !formData.photo) {
      alert('Molimo izaberite profilnu sliku');
      return;
    }
    
    // Validate portfolio on step 4
    if (step === 4 && portfolioItems.length === 0) {
      setPortfolioError('Molimo dodajte bar jednu stavku u portfolio');
      return;
    }
    
    if (step < 4) {
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
        <div className="flex items-center justify-center gap-2 mb-12">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div 
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-medium text-sm sm:text-base ${
                  s <= step ? 'bg-primary text-white' : 'bg-secondary text-muted'
                }`}
              >
                {s < step ? '✓' : s}
              </div>
              {s < 4 && (
                <div className={`w-8 sm:w-12 h-0.5 ${s < step ? 'bg-primary' : 'bg-border'}`} />
              )}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-border rounded-3xl p-8">
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-medium mb-6">Osnovne informacije</h2>
              
              {/* Profile Photo Upload */}
              <div>
                <label className="text-sm text-muted mb-2 block">Profilna slika *</label>
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 rounded-full overflow-hidden relative border-2 border-border flex-shrink-0">
                    {photoPreview ? (
                      <Image
                        src={photoPreview}
                        alt="Preview"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full bg-secondary flex items-center justify-center text-muted">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 border border-border rounded-xl text-sm hover:bg-secondary transition-colors"
                    >
                      {photoPreview ? 'Promeni sliku' : 'Izaberi sliku'}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoSelect}
                      className="hidden"
                    />
                    <p className="text-xs text-muted mt-2">
                      Kvadratna slika, preporučeno 400x400px. Maksimalna veličina: 5MB
                    </p>
                  </div>
                </div>
              </div>
              
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
                <label className="text-sm text-muted mb-2 block">TikTok handle</label>
                <input
                  type="text"
                  value={formData.tiktok}
                  onChange={(e) => setFormData({ ...formData, tiktok: e.target.value })}
                  placeholder="@tvojhandle"
                  className="w-full px-5 py-4 border border-border rounded-xl focus:outline-none focus:border-muted"
                />
              </div>

              <div>
                <label className="text-sm text-muted mb-2 block">YouTube kanal</label>
                <input
                  type="text"
                  value={formData.youtube}
                  onChange={(e) => setFormData({ ...formData, youtube: e.target.value })}
                  placeholder="@tvojkanal ili URL kanala"
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
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-xl font-medium mb-2">Tvoj portfolio</h2>
              <p className="text-sm text-muted mb-6">
                Dodaj bar jednu stavku u portfolio kako bi brendovi mogli da vide tvoj rad.
              </p>

              {/* Portfolio items display */}
              {portfolioItems.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                  {portfolioItems.map((item) => (
                    <div key={item.id} className="relative group">
                      <div className="aspect-[3/4] rounded-xl overflow-hidden bg-secondary">
                        {item.type === 'upload' && item.url.startsWith('data:video') ? (
                          <video src={item.url} className="w-full h-full object-cover" muted />
                        ) : (
                          <Image
                            src={item.thumbnail}
                            alt="Portfolio"
                            fill
                            className="object-cover"
                            unoptimized={item.thumbnail.startsWith('data:')}
                          />
                        )}
                      </div>
                      <div className="absolute top-2 right-2 bg-white/90 px-2 py-0.5 rounded-full text-[10px] font-medium">
                        {item.platform === 'instagram' ? 'Instagram' : 
                         item.platform === 'tiktok' ? 'TikTok' : 
                         item.platform === 'youtube' ? 'YouTube' : 'Upload'}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemovePortfolioItem(item.id)}
                        className="absolute bottom-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add from URL */}
              <div className="bg-secondary/50 rounded-xl p-5">
                <h3 className="font-medium mb-3">Dodaj link</h3>
                <div className="space-y-3">
                  <input
                    type="url"
                    value={portfolioUrl}
                    onChange={(e) => setPortfolioUrl(e.target.value)}
                    placeholder="https://youtube.com/watch?v=... ili tiktok.com/..."
                    className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:border-primary bg-white"
                  />
                  <input
                    type="text"
                    value={portfolioDescription}
                    onChange={(e) => setPortfolioDescription(e.target.value)}
                    placeholder="Kratak opis projekta (opciono)"
                    className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:border-primary bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddPortfolioUrl}
                    className="w-full py-3 border border-primary text-primary rounded-xl font-medium hover:bg-primary hover:text-white transition-colors"
                  >
                    Dodaj link
                  </button>
                </div>
              </div>

              {/* Or upload file */}
              <div className="text-center">
                <div className="text-sm text-muted mb-3">ili</div>
                <button
                  type="button"
                  onClick={() => portfolioInputRef.current?.click()}
                  className="px-6 py-3 border border-border rounded-xl text-sm hover:bg-secondary transition-colors"
                >
                  Uploaduj fajl (sliku ili video)
                </button>
                <input
                  ref={portfolioInputRef}
                  type="file"
                  accept="image/*,video/*"
                  onChange={handlePortfolioUpload}
                  className="hidden"
                />
              </div>

              {/* Error message */}
              {portfolioError && (
                <div className="bg-error/10 border border-error/20 rounded-xl p-4 text-sm text-error">
                  {portfolioError}
                </div>
              )}

              {/* Success indicator */}
              {portfolioItems.length > 0 && (
                <div className="bg-success/10 border border-success/20 rounded-xl p-4 flex items-center gap-3">
                  <svg className="w-5 h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-success">
                    {portfolioItems.length} {portfolioItems.length === 1 ? 'stavka dodana' : 'stavke dodane'} u portfolio
                  </span>
                </div>
              )}

              <div className="bg-secondary rounded-xl p-5 mt-4">
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
              {step < 4 ? 'Nastavi' : 'Završi registraciju'}
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

