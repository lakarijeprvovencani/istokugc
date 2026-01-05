'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { platforms, languages } from '@/lib/mockData';
import Image from 'next/image';
import ImageCropper from '@/components/ImageCropper';

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
  
  // API state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
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
  const [originalPhoto, setOriginalPhoto] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const portfolioInputRef = useRef<HTMLInputElement>(null);
  
  // Portfolio state
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [portfolioDescription, setPortfolioDescription] = useState('');
  const [portfolioError, setPortfolioError] = useState('');
  const [showAddPortfolio, setShowAddPortfolio] = useState(true);
  
  // Categories from database
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  
  // Fetch categories from database
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        if (response.ok) {
          const data = await response.json();
          setCategories(data.categories || []);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setIsLoadingCategories(false);
      }
    };
    
    fetchCategories();
  }, []);

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

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Slika je prevelika. Maksimalna veličina je 10MB.');
      return;
    }

    // Store original and open cropper
    const imageUrl = URL.createObjectURL(file);
    setOriginalPhoto(imageUrl);
    setShowCropper(true);
    
    // Reset file input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCropComplete = (croppedImage: string) => {
    setPhotoPreview(croppedImage);
    setShowCropper(false);
    // Clean up original URL
    if (originalPhoto) {
      URL.revokeObjectURL(originalPhoto);
      setOriginalPhoto(null);
    }
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    // Clean up original URL
    if (originalPhoto) {
      URL.revokeObjectURL(originalPhoto);
      setOriginalPhoto(null);
    }
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
      setShowAddPortfolio(false);
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
    setShowAddPortfolio(false);
  };

  // Remove portfolio item
  const handleRemovePortfolioItem = (id: string) => {
    setPortfolioItems(portfolioItems.filter(item => item.id !== id));
  };

  // Drag and drop state for profile photo
  const [isDraggingPhoto, setIsDraggingPhoto] = useState(false);

  const handlePhotoDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingPhoto(false);
    
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      alert('Molimo prevucite sliku');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      alert('Slika je prevelika. Maksimalna veličina je 5MB.');
      return;
    }
    
    setFormData(prev => ({ ...prev, photo: file }));
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handlePhotoDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingPhoto(true);
  };

  const handlePhotoDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingPhoto(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    
    // Validate step 1: Basic info
    if (step === 1) {
      if (!formData.email.trim()) {
        alert('Molimo unesite email adresu');
        return;
      }
      if (!formData.email.includes('@')) {
        alert('Molimo unesite validnu email adresu');
        return;
      }
      if (!formData.password || formData.password.length < 6) {
        alert('Lozinka mora imati najmanje 6 karaktera');
        return;
      }
      if (!formData.name.trim()) {
        alert('Molimo unesite ime i prezime');
        return;
      }
    }
    
    // Validate step 2: Bio, categories, platforms, languages
    if (step === 2) {
      if (!formData.bio.trim()) {
        alert('Molimo unesite kratki opis');
        return;
      }
      if (formData.categories.length === 0) {
        alert('Molimo izaberite bar jednu kategoriju');
        return;
      }
      if (formData.platforms.length === 0) {
        alert('Molimo izaberite bar jednu platformu');
        return;
      }
      if (formData.languages.length === 0) {
        alert('Molimo izaberite bar jedan jezik');
        return;
      }
    }
    
    // Validate step 3: Price, location, phone
    if (step === 3) {
      if (!formData.priceFrom || parseInt(formData.priceFrom) < 1) {
        alert('Molimo unesite početnu cenu');
        return;
      }
      if (!formData.location.trim()) {
        alert('Molimo unesite lokaciju');
        return;
      }
      if (!formData.phone.trim()) {
        alert('Molimo unesite broj telefona');
        return;
      }
    }
    
    // Validate step 4: Photo and portfolio
    if (step === 4) {
      if (!photoPreview) {
        alert('Molimo dodajte profilnu sliku');
        return;
      }
      if (portfolioItems.length === 0) {
        setPortfolioError('Molimo dodajte bar jednu stavku u portfolio');
        return;
      }
    }
    
    if (step < 4) {
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Final submit - pozovi API
      setIsSubmitting(true);
      
      try {
        const response = await fetch('/api/auth/register/creator', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            name: formData.name,
            bio: formData.bio,
            location: formData.location,
            priceFrom: formData.priceFrom,
            categories: formData.categories,
            platforms: formData.platforms,
            languages: formData.languages,
            instagram: formData.instagram || null,
            tiktok: formData.tiktok || null,
            youtube: formData.youtube || null,
            phone: formData.phone || null,
            photo: photoPreview || null,
            portfolio: portfolioItems.map(item => ({
              id: item.id,
              type: item.type,
              url: item.url,
              thumbnail: item.thumbnail,
              description: item.description,
            })),
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Greška pri registraciji');
        }

        // API uspešan! Podaci su sačuvani u Supabase bazi.
        // Ne koristimo DemoContext za čuvanje jer može prekoračiti localStorage limit
        // (slike su prevelike za localStorage)
        
        console.log('Registration successful:', data);
        
        // Prikaži success modal
        setShowSuccessModal(true);
        
      } catch (error) {
        console.error('Registration error:', error);
        setApiError(error instanceof Error ? error.message : 'Greška pri registraciji');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] py-12 lg:py-16">
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

        <form onSubmit={handleSubmit} noValidate className="bg-white border border-border rounded-3xl p-8">
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
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Minimum 8 karaktera"
                    className="w-full px-5 py-4 pr-12 border border-border rounded-xl focus:outline-none focus:border-muted"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
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
                {isLoadingCategories ? (
                  <div className="flex items-center gap-2 text-muted text-sm">
                    <div className="w-4 h-4 border-2 border-muted/30 border-t-muted rounded-full animate-spin"></div>
                    Učitavanje kategorija...
                  </div>
                ) : (
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
                )}
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
                <label className="text-sm text-muted mb-2 block">Instagram</label>
                <input
                  type="text"
                  value={formData.instagram}
                  onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                  placeholder="@"
                  className="w-full px-5 py-4 border border-border rounded-xl focus:outline-none focus:border-muted"
                />
              </div>

              <div>
                <label className="text-sm text-muted mb-2 block">TikTok</label>
                <input
                  type="text"
                  value={formData.tiktok}
                  onChange={(e) => setFormData({ ...formData, tiktok: e.target.value })}
                  placeholder="@"
                  className="w-full px-5 py-4 border border-border rounded-xl focus:outline-none focus:border-muted"
                />
              </div>

              <div>
                <label className="text-sm text-muted mb-2 block">YouTube</label>
                <input
                  type="text"
                  value={formData.youtube}
                  onChange={(e) => setFormData({ ...formData, youtube: e.target.value })}
                  placeholder="@"
                  className="w-full px-5 py-4 border border-border rounded-xl focus:outline-none focus:border-muted"
                />
              </div>

              <div>
                <label className="text-sm text-muted mb-2 block">Broj telefona *</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+381 61 123 4567"
                  className="w-full px-5 py-4 border border-border rounded-xl focus:outline-none focus:border-muted"
                  required
                />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-xl font-medium mb-2">Profilna slika i portfolio</h2>
              <p className="text-sm text-muted mb-6">
                Dodaj profilnu sliku i bar jednu stavku u portfolio.
              </p>

              {/* Profile Photo Upload with Drag & Drop */}
              <div className="mb-8">
                <label className="text-sm text-muted mb-3 block">Profilna slika *</label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handlePhotoDrop}
                  onDragOver={handlePhotoDragOver}
                  onDragLeave={handlePhotoDragLeave}
                  className={`relative w-32 h-32 mx-auto rounded-full overflow-hidden border-3 transition-all duration-200 cursor-pointer ${
                    isDraggingPhoto 
                      ? 'border-primary border-dashed scale-105 bg-primary/5' 
                      : photoPreview 
                        ? 'border-success border-solid' 
                        : 'border-border border-dashed hover:border-primary hover:bg-secondary/50'
                  }`}
                >
                  {photoPreview ? (
                    <>
                      <Image
                        src={photoPreview}
                        alt="Preview"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-xs font-medium">Promeni</span>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full bg-secondary/50 flex flex-col items-center justify-center text-muted gap-2">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                      </svg>
                      <span className="text-xs">Dodaj sliku</span>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
                <div className="mt-4 text-center">
                  <p className="text-xs text-muted">
                    Klikni ili prevuci sliku • Max 10MB
                  </p>
                  <p className="text-xs text-primary/70 mt-1">
                    💡 Nakon izbora slike moći ćeš da je crop-uješ
                  </p>
                </div>
              </div>

              <div className="border-t border-border pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium">Portfolio radovi</h3>
                  <span className="text-xs text-muted">odaberi jednu od opcija</span>
                </div>
              </div>

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

              {/* Portfolio add section - show when no items or accordion is open */}
              {(portfolioItems.length === 0 || showAddPortfolio) && (
                <div className="space-y-5">
                  {/* Option 1: Add from URL */}
                  <div>
                    <p className="text-sm text-muted mb-3">Dodaj link sa društvenih mreža</p>
                    <div className="bg-white border border-border rounded-xl p-5">
                      <div className="space-y-3">
                        <input
                          type="url"
                          value={portfolioUrl}
                          onChange={(e) => setPortfolioUrl(e.target.value)}
                          placeholder="https://youtube.com/watch?v=... ili tiktok.com/..."
                          className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:border-primary bg-white text-sm"
                        />
                        <input
                          type="text"
                          value={portfolioDescription}
                          onChange={(e) => setPortfolioDescription(e.target.value)}
                          placeholder="Opis projekta (opciono)"
                          className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:border-primary bg-white text-sm"
                        />
                        <button
                          type="button"
                          onClick={handleAddPortfolioUrl}
                          className="w-full py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors text-sm"
                        >
                          + Dodaj link
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="flex items-center gap-4">
                    <div className="flex-1 h-px bg-border"></div>
                    <span className="text-sm text-muted">Ili dodaj svoj fajl</span>
                    <div className="flex-1 h-px bg-border"></div>
                  </div>

                  {/* Option 2: Upload file */}
                  <div 
                    className="flex flex-col items-center justify-center min-h-[140px] border-2 border-dashed border-border rounded-xl hover:border-primary hover:bg-secondary/30 transition-colors cursor-pointer bg-white"
                    onClick={() => portfolioInputRef.current?.click()}
                  >
                    <svg className="w-10 h-10 text-muted mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    <span className="text-sm font-medium">Klikni za upload</span>
                    <span className="text-xs text-muted mt-1">Slika ili video • Max 50MB</span>
                  </div>
                  <input
                    ref={portfolioInputRef}
                    type="file"
                    accept="image/*,video/*"
                    onChange={handlePortfolioUpload}
                    className="hidden"
                  />
                </div>
              )}

              {/* Error message */}
              {portfolioError && (
                <div className="bg-error/10 border border-error/20 rounded-xl p-4 text-sm text-error">
                  {portfolioError}
                </div>
              )}

              {/* Success indicator with accordion */}
              {portfolioItems.length > 0 && !showAddPortfolio && (
                <div className="space-y-3">
                  <div className="bg-success/10 border border-success/20 rounded-xl p-4 flex items-center gap-3">
                    <svg className="w-5 h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-success">
                      {portfolioItems.length} {portfolioItems.length === 1 ? 'stavka dodana' : 'stavke dodane'} u portfolio
                    </span>
                  </div>
                  
                  {/* Add more button */}
                  <button
                    type="button"
                    onClick={() => setShowAddPortfolio(true)}
                    className="w-full py-3 border border-border rounded-xl text-sm font-medium hover:bg-secondary transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Dodaj još
                  </button>
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

          {/* API Error */}
          {apiError && (
            <div className="bg-error/10 border border-error/20 rounded-xl p-4 mt-6">
              <p className="text-sm text-error">{apiError}</p>
            </div>
          )}

          <div className="flex justify-between mt-10">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => { setStep(step - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="px-6 py-3 text-sm text-muted hover:text-foreground"
                disabled={isSubmitting}
              >
                ← Nazad
              </button>
            ) : (
              <div />
            )}
            
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-4 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Registracija...
                </>
              ) : step < 4 ? 'Nastavi' : 'Završi registraciju'}
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

      {/* Image Cropper Modal */}
      {showCropper && originalPhoto && (
        <ImageCropper
          image={originalPhoto}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
          aspectRatio={3/4}
        />
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h2 className="text-2xl font-light mb-4">Registracija uspešna!</h2>
            
            <p className="text-muted mb-6">
              Poslali smo ti verifikacioni email na <strong>{formData.email}</strong>.
              <br /><br />
              Klikni na link u emailu da potvrdite svoju adresu, a zatim se prijavite.
            </p>
            
            <div className="bg-secondary rounded-xl p-4 mb-6">
              <p className="text-sm text-muted">
                <strong>Napomena:</strong> Nakon verifikacije, tvoj profil će biti na čekanju dok naš tim ne pregleda i odobri tvoju prijavu.
              </p>
            </div>
            
            <button
              onClick={() => router.push('/login')}
              className="w-full px-6 py-4 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
            >
              Idi na prijavu
            </button>
            
            <button
              onClick={() => router.push(`/auth/verify-email?email=${encodeURIComponent(formData.email)}`)}
              className="w-full mt-3 px-6 py-3 text-muted hover:text-foreground transition-colors text-sm"
            >
              Nije stigao email? Pošalji ponovo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

