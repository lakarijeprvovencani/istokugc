'use client';

import { useState, useEffect, useRef } from 'react';
import { useDemo } from '@/context/DemoContext';
import Link from 'next/link';
import Image from 'next/image';
import ReviewCard from '@/components/ReviewCard';
import { AverageRating } from '@/components/StarRating';
import { generateReviewStats, Review } from '@/types/review';
import PortfolioModal, { PortfolioItem } from '@/components/PortfolioModal';
import VideoPlayerModal from '@/components/VideoPlayerModal';

export default function DashboardPage() {
  const { currentUser, updateCreator } = useDemo();

  // Redirect logic would go here in real app
  if (currentUser.type === 'guest') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-medium mb-4">Nisi prijavljen</h1>
          <Link href="/login" className="text-primary hover:underline">
            Prijavi se
          </Link>
        </div>
      </div>
    );
  }

  if (currentUser.type === 'creator') {
    return <CreatorDashboard />;
  }

  // All business users have active subscription (payment required to access)
  return <BusinessDashboard />;
}

function CreatorDashboard() {
  const { getReviewsForCreator, addReplyToReview, updateReplyToReview, deleteReplyFromReview, getOwnCreatorStatus, updateCreator, getOwnCreatorId, getCreatorById, isHydrated, currentUser } = useDemo();
  
  // Get the creator's own profile
  const ownCreatorId = getOwnCreatorId();
  const ownCreator = ownCreatorId ? getCreatorById(ownCreatorId) : null;
  
  // Check if this is a demo user (Marija Petrović - ID "1")
  // Demo users should always work normally for presentation purposes
  const isDemoCreator = currentUser.creatorId === '1' || ownCreatorId === '1';
  
  // Get creator status
  const creatorStatus = getOwnCreatorStatus();
  
  // Wait for hydration
  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted">Učitavanje...</div>
      </div>
    );
  }
  
  // If no creator profile found, show error
  if (!ownCreator) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-medium mb-4">Profil nije pronađen</h1>
          <p className="text-muted mb-6">Nismo pronašli vaš kreator profil.</p>
          <Link href="/" className="text-primary hover:underline">
            Nazad na početnu
          </Link>
        </div>
      </div>
    );
  }
  
  // Use the real creator data
  const creator = ownCreator;
  
  // Skip pending/rejected checks for demo creator (ID "1" - Marija Petrović)
  // This allows demo to work for client presentations
  if (!isDemoCreator) {
    // If creator is pending - show pending screen
    if (creatorStatus?.status === 'pending' || (!creatorStatus?.status && !creator.approved)) {
      return <CreatorPendingScreen />;
    }
    
    // If creator is rejected - show rejection screen
    if (creatorStatus?.status === 'rejected') {
      return <CreatorRejectedScreen rejectionReason={creatorStatus.rejectionReason} />;
    }
  }
  const [activeTab, setActiveTab] = useState<'overview' | 'reviews'>('overview');
  
  // Inline editing states for each section
  const [editingBio, setEditingBio] = useState(false);
  const [editingCategories, setEditingCategories] = useState(false);
  const [editingPlatforms, setEditingPlatforms] = useState(false);
  const [editingLanguages, setEditingLanguages] = useState(false);
  const [editingContact, setEditingContact] = useState(false);
  const [editingPassword, setEditingPassword] = useState(false);
  
  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  
  // Portfolio state
  const [showPortfolioModal, setShowPortfolioModal] = useState(false);
  const [activeVideo, setActiveVideo] = useState<PortfolioItem | null>(null);
  const [activeImage, setActiveImage] = useState<PortfolioItem | null>(null);
  const [detailItem, setDetailItem] = useState<PortfolioItem | null>(null);
  const [deletePortfolioConfirm, setDeletePortfolioConfirm] = useState<PortfolioItem | null>(null);
  
  // Profile photo state
  const [editingPhoto, setEditingPhoto] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>(
    creator.portfolio.map((item, index) => ({
      id: `existing-${index}`,
      type: item.type,
      url: item.url,
      thumbnail: item.thumbnail,
    }))
  );
  
  // Editable form values
  const [bio, setBio] = useState(creator.bio);
  const [categories, setCategories] = useState<string[]>(creator.categories);
  const [platforms, setPlatforms] = useState<string[]>(creator.platforms);
  const [languages, setLanguages] = useState<string[]>(creator.languages);
  const [contactInfo, setContactInfo] = useState({
    email: creator.email,
    phone: creator.phone || '',
    instagram: creator.instagram || '',
    tiktok: creator.tiktok || '',
    youtube: creator.youtube || '',
    priceFrom: creator.priceFrom,
  });
  
  // Portfolio handlers
  const handleAddPortfolioItem = (item: PortfolioItem) => {
    setPortfolioItems([...portfolioItems, item]);
    // In production: API call to save to database
  };
  
  const handleRemovePortfolioItem = (item: PortfolioItem) => {
    setDeletePortfolioConfirm(item);
  };
  
  const confirmDeletePortfolioItem = () => {
    if (deletePortfolioConfirm) {
      setPortfolioItems(portfolioItems.filter(item => item.id !== deletePortfolioConfirm.id));
      setDeletePortfolioConfirm(null);
      // In production: API call to delete from database
    }
  };
  
  // Available options for multi-select
  const availableCategories = ['Beauty', 'Lifestyle', 'Fashion', 'Tech', 'Food', 'Travel', 'Fitness', 'Gaming', 'Music', 'Art'];
  const availablePlatforms = ['Instagram', 'TikTok', 'YouTube'];
  const availableLanguages = ['Srpski', 'Engleski', 'Nemački', 'Francuski', 'Španski', 'Italijanski'];
  
  // Get reviews for this creator
  const allReviews = getReviewsForCreator(creator.id, false); // Include pending
  const approvedReviews = allReviews.filter(r => r.status === 'approved');
  const pendingReviews = allReviews.filter(r => r.status === 'pending');
  const stats = generateReviewStats(allReviews);

  // Pencil icon component
  const PencilButton = ({ onClick, editing }: { onClick: () => void; editing?: boolean }) => (
    <button
      onClick={onClick}
      className={`p-2 rounded-lg transition-colors ${editing ? 'bg-primary text-white' : 'hover:bg-secondary text-muted hover:text-foreground'}`}
      title="Uredi"
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
      </svg>
    </button>
  );

  const handleSaveSection = (section: string) => {
    console.log(`📝 [DEMO] ${section} would be updated`);
    
    // Update creator in demo context
    if (section === 'bio') {
      updateCreator(creator.id, { bio: bio });
      setEditingBio(false);
    } else if (section === 'categories') {
      updateCreator(creator.id, { categories: categories });
      setEditingCategories(false);
    } else if (section === 'platforms') {
      updateCreator(creator.id, { platforms: platforms });
      setEditingPlatforms(false);
    } else if (section === 'languages') {
      updateCreator(creator.id, { languages: languages });
      setEditingLanguages(false);
    } else if (section === 'contact') {
      updateCreator(creator.id, {
        email: contactInfo.email,
        phone: contactInfo.phone || undefined,
        instagram: contactInfo.instagram || undefined,
        tiktok: contactInfo.tiktok || undefined,
        youtube: contactInfo.youtube || undefined,
        priceFrom: contactInfo.priceFrom,
      });
      setEditingContact(false);
    }
  };

  const handleChangePassword = () => {
    setPasswordError('');
    setPasswordSuccess(false);

    // Validation
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError('Sva polja su obavezna');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setPasswordError('Nova lozinka mora imati minimum 8 karaktera');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('Nove lozinke se ne poklapaju');
      return;
    }

    if (passwordForm.currentPassword === passwordForm.newPassword) {
      setPasswordError('Nova lozinka mora biti različita od trenutne');
      return;
    }

    // In production, this would call API endpoint
    // const response = await fetch('/api/settings/password', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     currentPassword: passwordForm.currentPassword,
    //     newPassword: passwordForm.newPassword,
    //   }),
    // });

    // Demo mode: simulate success
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setPasswordSuccess(true);
    setTimeout(() => {
      setPasswordSuccess(false);
      setEditingPassword(false);
    }, 2000);
  };

  const toggleArrayItem = (arr: string[], item: string, setArr: (arr: string[]) => void) => {
    if (arr.includes(item)) {
      setArr(arr.filter(i => i !== item));
    } else {
      setArr([...arr, item]);
    }
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

    setSelectedPhoto(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPhotoPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSavePhoto = () => {
    if (!selectedPhoto) return;

    // In production, this would upload to cloud storage and update creator profile
    // const formData = new FormData();
    // formData.append('photo', selectedPhoto);
    // await fetch('/api/creators/me/photo', { method: 'POST', body: formData });

    // Demo mode: just close edit mode
    setEditingPhoto(false);
    setSelectedPhoto(null);
    setPhotoPreview(null);
    alert('Demo režim: U produkciji bi se slika uploadovala i ažurirala.');
  };

  const tabs = [
    { id: 'overview' as const, label: 'Pregled', count: null },
    { id: 'reviews' as const, label: 'Recenzije', count: allReviews.length },
  ];

  return (
    <div className="min-h-screen bg-secondary/30">
      <div className="max-w-6xl 2xl:max-w-7xl mx-auto px-6 lg:px-12 py-8 lg:py-12">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-light mb-2">Dashboard</h1>
            <p className="text-muted">Dobrodošla nazad, {creator.name}</p>
          </div>
          <Link 
            href={`/kreator/${creator.id}`}
            className="flex items-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-primary text-white rounded-full text-xs sm:text-sm font-medium hover:bg-primary/90 transition-colors whitespace-nowrap"
          >
            <svg className="hidden sm:block w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Pogledaj profil
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white rounded-xl p-1 border border-border w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-primary text-white'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              {tab.label}
              {tab.count !== null && (
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  activeTab === tab.id ? 'bg-white/20' : 'bg-secondary'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Stats - below tabs */}
        <div className="mb-8">
          <h2 className="text-lg font-medium mb-6">Statistika profila</h2>
          <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl p-6 border border-border text-center">
            <div className="text-3xl font-light mb-1">{creator.profileViews || 0}</div>
            <div className="text-sm text-muted">Pregleda profila</div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-border text-center">
            <div className="text-3xl font-light mb-1">{stats.averageRating.toFixed(1)}</div>
            <div className="text-sm text-muted">Prosečna ocena</div>
          </div>
          </div>
        </div>

        {activeTab === 'overview' && (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Profile status */}
              <div className="bg-white rounded-2xl p-6 border border-border">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-medium">Status profila</h2>
                  <span className="px-4 py-1.5 bg-success/10 text-success rounded-full text-sm">
                    Odobren
                  </span>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full overflow-hidden relative border-2 border-border">
                      <Image 
                        src={photoPreview || creator.photo} 
                        alt={creator.name} 
                        fill 
                        className="object-cover"
                        unoptimized={!!photoPreview}
                      />
                    </div>
                    {editingPhoto ? (
                      <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 border-2 border-border">
                        <button
                          onClick={() => {
                            setEditingPhoto(false);
                            setPhotoPreview(null);
                            setSelectedPhoto(null);
                          }}
                          className="p-1 hover:bg-secondary rounded-full transition-colors"
                          title="Otkaži"
                        >
                          <svg className="w-4 h-4 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingPhoto(true);
                          photoInputRef.current?.click();
                        }}
                        className="absolute -bottom-1 -right-1 bg-primary text-white rounded-full p-1.5 hover:bg-primary/90 transition-colors shadow-lg"
                        title="Promeni sliku"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                    )}
                    <input
                      ref={photoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoSelect}
                      className="hidden"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-lg">{creator.name}</h3>
                    <p className="text-sm text-muted">{creator.location}</p>
                    <p className="text-sm text-muted mt-1">Od €{creator.priceFrom} po projektu</p>
                  </div>
                </div>
                
                {editingPhoto && photoPreview && (
                  <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                    <p className="text-sm text-muted">Nova profilna slika</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingPhoto(false);
                          setPhotoPreview(null);
                          setSelectedPhoto(null);
                        }}
                        className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-secondary transition-colors"
                      >
                        Otkaži
                      </button>
                      <button
                        onClick={handleSavePhoto}
                        className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                      >
                        Sačuvaj
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Bio section with inline edit */}
              <div className="bg-white rounded-2xl p-6 border border-border">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium">O meni</h2>
                  <PencilButton onClick={() => setEditingBio(!editingBio)} editing={editingBio} />
                </div>
                
                {editingBio ? (
                  <div className="space-y-4">
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:border-primary resize-none"
                      placeholder="Napiši nešto o sebi..."
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted">{bio.length} karaktera</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setBio(creator.bio); setEditingBio(false); }}
                          className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-secondary transition-colors"
                        >
                          Otkaži
                        </button>
                        <button
                          onClick={() => handleSaveSection('bio')}
                          className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                        >
                          Sačuvaj
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted leading-relaxed">{bio}</p>
                )}
              </div>

              {/* Categories section with inline edit */}
              <div className="bg-white rounded-2xl p-6 border border-border">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium">Kategorije</h2>
                  <PencilButton onClick={() => setEditingCategories(!editingCategories)} editing={editingCategories} />
                </div>
                
                {editingCategories ? (
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {availableCategories.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => toggleArrayItem(categories, cat, setCategories)}
                          className={`px-4 py-2 rounded-full text-sm transition-colors ${
                            categories.includes(cat)
                              ? 'bg-primary text-white'
                              : 'bg-secondary hover:bg-accent'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        onClick={() => { setCategories(creator.categories); setEditingCategories(false); }}
                        className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-secondary transition-colors"
                      >
                        Otkaži
                      </button>
                      <button
                        onClick={() => handleSaveSection('categories')}
                        className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                      >
                        Sačuvaj
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {categories.map((cat, i) => (
                      <span key={i} className="px-4 py-2 bg-secondary rounded-full text-sm">{cat}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* Platforms section with inline edit */}
              <div className="bg-white rounded-2xl p-6 border border-border">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium">Platforme</h2>
                  <PencilButton onClick={() => setEditingPlatforms(!editingPlatforms)} editing={editingPlatforms} />
                </div>
                
                {editingPlatforms ? (
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {availablePlatforms.map((plat) => (
                        <button
                          key={plat}
                          onClick={() => toggleArrayItem(platforms, plat, setPlatforms)}
                          className={`px-4 py-2 rounded-full text-sm transition-colors ${
                            platforms.includes(plat)
                              ? 'bg-primary text-white'
                              : 'bg-secondary hover:bg-accent'
                          }`}
                        >
                          {plat}
                        </button>
                      ))}
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        onClick={() => { setPlatforms(creator.platforms); setEditingPlatforms(false); }}
                        className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-secondary transition-colors"
                      >
                        Otkaži
                      </button>
                      <button
                        onClick={() => handleSaveSection('platforms')}
                        className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                      >
                        Sačuvaj
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {platforms.map((plat, i) => (
                      <span key={i} className="px-4 py-2 bg-secondary rounded-full text-sm">{plat}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* Languages section with inline edit */}
              <div className="bg-white rounded-2xl p-6 border border-border">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium">Jezici</h2>
                  <PencilButton onClick={() => setEditingLanguages(!editingLanguages)} editing={editingLanguages} />
                </div>
                
                {editingLanguages ? (
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {availableLanguages.map((lang) => (
                        <button
                          key={lang}
                          onClick={() => toggleArrayItem(languages, lang, setLanguages)}
                          className={`px-4 py-2 rounded-full text-sm transition-colors ${
                            languages.includes(lang)
                              ? 'bg-primary text-white'
                              : 'bg-secondary hover:bg-accent'
                          }`}
                        >
                          {lang}
                        </button>
                      ))}
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        onClick={() => { setLanguages(creator.languages); setEditingLanguages(false); }}
                        className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-secondary transition-colors"
                      >
                        Otkaži
                      </button>
                      <button
                        onClick={() => handleSaveSection('languages')}
                        className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                      >
                        Sačuvaj
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {languages.map((lang, i) => (
                      <span key={i} className="px-4 py-2 bg-secondary rounded-full text-sm">{lang}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* Portfolio */}
              <div className="bg-white rounded-2xl p-6 border border-border">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-medium">Portfolio</h2>
                  <button 
                    onClick={() => setShowPortfolioModal(true)}
                    className="text-sm text-primary hover:underline"
                  >
                    + Dodaj novu stavku
                  </button>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {portfolioItems.map((item) => {
                    // Get display platform
                    const displayPlatform = item.platform || item.type;
                    const platformLabels: Record<string, string> = {
                      instagram: 'Instagram',
                      tiktok: 'TikTok',
                      youtube: 'YouTube',
                      upload: 'Upload',
                      other: 'Ostalo'
                    };
                    
                    // Check if item is a video or image
                    const isVideo = item.type === 'upload' && item.url.startsWith('data:video') ||
                                   item.type === 'youtube' || 
                                   item.type === 'instagram' || 
                                   item.type === 'tiktok' ||
                                   (item.type === 'upload' && item.url.includes('video'));
                    const isImage = !isVideo;
                    
                    return (
                      <div key={item.id} className="flex flex-col">
                        <div 
                          className={`aspect-[3/4] relative rounded-xl overflow-hidden group cursor-pointer ${isImage ? 'hover:scale-105 transition-transform duration-300' : ''}`}
                          onClick={() => {
                            if (isVideo) {
                              setActiveVideo(item);
                            } else {
                              setActiveImage(item);
                            }
                          }}
                        >
                          {isVideo && item.type === 'upload' && item.url.startsWith('data:video') ? (
                            <video
                              src={item.url}
                              className="w-full h-full object-cover"
                              muted
                            />
                          ) : (
                            <Image 
                              src={item.thumbnail} 
                              alt="" 
                              fill 
                              className={`object-cover ${isImage ? 'group-hover:scale-110 transition-transform duration-300' : ''}`}
                              unoptimized={item.thumbnail.startsWith('data:')}
                            />
                          )}
                          {/* Hover overlay - different for video vs image */}
                          {isVideo ? (
                            // Play button for videos
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center">
                                <svg className="w-6 h-6 text-foreground ml-1" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M8 5v14l11-7z" />
                                </svg>
                              </div>
                            </div>
                          ) : (
                            // Zoom indicator for images
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <div className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center">
                                <svg className="w-5 h-5 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                                </svg>
                              </div>
                            </div>
                          )}
                          {/* Platform badge - text only */}
                          <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-full text-[10px] font-medium">
                            {platformLabels[displayPlatform] || displayPlatform}
                          </div>
                          {/* Delete button on hover */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemovePortfolioItem(item);
                            }}
                            className="absolute bottom-2 right-2 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Obriši"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                        {/* Details button below image */}
                        {item.description && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDetailItem(item);
                            }}
                            className="mt-2 text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1 justify-center"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Detaljnije
                          </button>
                        )}
                      </div>
                    );
                  })}
                  <button 
                    onClick={() => setShowPortfolioModal(true)}
                    className="aspect-[3/4] rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center text-muted hover:border-primary hover:text-primary transition-colors"
                  >
                    <span className="text-3xl mb-2">+</span>
                    <span className="text-xs">Dodaj</span>
                  </button>
                </div>
              </div>
              
              {/* Portfolio Modal */}
              <PortfolioModal
                isOpen={showPortfolioModal}
                onClose={() => setShowPortfolioModal(false)}
                onAdd={handleAddPortfolioItem}
              />

              {/* Video Player Modal */}
              <VideoPlayerModal
                isOpen={!!activeVideo}
                onClose={() => setActiveVideo(null)}
                videoUrl={activeVideo?.url || ''}
                videoType={activeVideo?.type || 'upload'}
                originalUrl={activeVideo?.originalUrl}
                description={activeVideo?.description}
              />

              {/* Image Zoom Modal */}
              {activeImage && (
                <div 
                  className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
                  onClick={() => setActiveImage(null)}
                >
                  <div 
                    className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Image
                      src={activeImage.thumbnail}
                      alt={activeImage.description || 'Portfolio image'}
                      fill
                      className="object-contain"
                      unoptimized={activeImage.thumbnail.startsWith('data:')}
                    />
                    {/* Close button */}
                    <button
                      onClick={() => setActiveImage(null)}
                      className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full transition-colors"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    {/* Description if available */}
                    {activeImage.description && (
                      <div className="absolute bottom-4 left-4 right-4 bg-black/60 text-white p-4 rounded-lg max-w-2xl">
                        <p className="text-sm">{activeImage.description}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Detail Popup Modal */}
              {detailItem && (
                <div 
                  className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                  onClick={() => setDetailItem(null)}
                >
                  <div 
                    className="bg-white rounded-xl max-w-md w-full p-6"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-medium">O projektu</h3>
                      <button 
                        onClick={() => setDetailItem(null)}
                        className="p-1 hover:bg-secondary rounded-full transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    
                    {/* Platform */}
                    <div className="mb-3">
                      <span className="text-xs text-muted uppercase tracking-wider">Platforma</span>
                      <p className="font-medium mt-1">
                        {detailItem.platform === 'instagram' ? 'Instagram' : 
                         detailItem.platform === 'tiktok' ? 'TikTok' : 
                         detailItem.platform === 'youtube' ? 'YouTube' : 
                         detailItem.type === 'upload' ? 'Upload' : 'Ostalo'}
                      </p>
                    </div>
                    
                    {/* Description */}
                    <div>
                      <span className="text-xs text-muted uppercase tracking-wider">Opis projekta</span>
                      <p className="mt-1 text-foreground leading-relaxed">
                        {detailItem.description || 'Nema opisa'}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setDetailItem(null);
                        setActiveVideo(detailItem);
                      }}
                      className="mt-6 w-full py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                      Pusti video
                    </button>
                  </div>
                </div>
              )}

              {/* Delete Portfolio Confirmation Modal */}
              {deletePortfolioConfirm && (
                <div 
                  className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                  onClick={() => setDeletePortfolioConfirm(null)}
                >
                  <div 
                    className="bg-white rounded-xl max-w-sm w-full p-6"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="text-center">
                      {/* Warning Icon */}
                      <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </div>
                      
                      <h3 className="text-lg font-semibold mb-2">Obriši portfolio stavku?</h3>
                      <p className="text-muted text-sm mb-6">
                        Da li ste sigurni da želite da obrišete ovu stavku iz portfolia? Ova akcija se ne može poništiti.
                      </p>
                      
                      {/* Thumbnail preview */}
                      {deletePortfolioConfirm.thumbnail && (
                        <div className="mb-6 rounded-lg overflow-hidden border border-border">
                          <img 
                            src={deletePortfolioConfirm.thumbnail} 
                            alt="Portfolio stavka"
                            className="w-full h-32 object-cover"
                          />
                        </div>
                      )}
                      
                      <div className="flex gap-3">
                        <button
                          onClick={() => setDeletePortfolioConfirm(null)}
                          className="flex-1 py-2.5 border border-border rounded-lg font-medium hover:bg-secondary transition-colors"
                        >
                          Odustani
                        </button>
                        <button
                          onClick={confirmDeletePortfolioItem}
                          className="flex-1 py-2.5 bg-error text-white rounded-lg font-medium hover:bg-error/90 transition-colors"
                        >
                          Obriši
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Contact info with inline edit */}
              <div className="bg-white rounded-2xl p-6 border border-border">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium">Tvoje informacije</h3>
                  <PencilButton onClick={() => setEditingContact(!editingContact)} editing={editingContact} />
                </div>
                
                {editingContact ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs text-muted mb-1">Email</label>
                      <input
                        type="email"
                        value={contactInfo.email}
                        onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-muted mb-1">Telefon</label>
                      <input
                        type="tel"
                        value={contactInfo.phone}
                        onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:border-primary"
                        placeholder="+381..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-muted mb-1">Instagram</label>
                      <input
                        type="text"
                        value={contactInfo.instagram}
                        onChange={(e) => setContactInfo({ ...contactInfo, instagram: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:border-primary"
                        placeholder="@username"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-muted mb-1">TikTok</label>
                      <input
                        type="text"
                        value={contactInfo.tiktok}
                        onChange={(e) => setContactInfo({ ...contactInfo, tiktok: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:border-primary"
                        placeholder="@username"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-muted mb-1">YouTube</label>
                      <input
                        type="text"
                        value={contactInfo.youtube}
                        onChange={(e) => setContactInfo({ ...contactInfo, youtube: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:border-primary"
                        placeholder="@username ili URL kanala"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-muted mb-1">Cena od (€)</label>
                      <input
                        type="number"
                        value={contactInfo.priceFrom}
                        onChange={(e) => setContactInfo({ ...contactInfo, priceFrom: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:border-primary"
                        min="0"
                      />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => { 
                          setContactInfo({ 
                            email: creator.email, 
                            phone: creator.phone || '', 
                            instagram: creator.instagram || '', 
                            tiktok: creator.tiktok || '',
                            youtube: creator.youtube || '',
                            priceFrom: creator.priceFrom 
                          }); 
                          setEditingContact(false); 
                        }}
                        className="flex-1 px-3 py-2 text-xs border border-border rounded-lg hover:bg-secondary transition-colors"
                      >
                        Otkaži
                      </button>
                      <button
                        onClick={() => handleSaveSection('contact')}
                        className="flex-1 px-3 py-2 text-xs bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                      >
                        Sačuvaj
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted">Email</span>
                      <span className="truncate ml-2">{contactInfo.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Telefon</span>
                      <span>{contactInfo.phone || '—'}</span>
                    </div>
                    {contactInfo.instagram && (
                      <div className="flex justify-between">
                        <span className="text-muted">Instagram</span>
                        <span>{contactInfo.instagram}</span>
                      </div>
                    )}
                    {contactInfo.tiktok && (
                      <div className="flex justify-between">
                        <span className="text-muted">TikTok</span>
                        <span>{contactInfo.tiktok}</span>
                      </div>
                    )}
                    {contactInfo.youtube && (
                      <div className="flex justify-between">
                        <span className="text-muted">YouTube</span>
                        <span>{contactInfo.youtube}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted">Cena od</span>
                      <span>€{contactInfo.priceFrom}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Change Password Section */}
              <div className="bg-white rounded-2xl p-6 border border-border">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium">Promena lozinke</h3>
                  <PencilButton onClick={() => setEditingPassword(!editingPassword)} editing={editingPassword} />
                </div>
                
                {editingPassword ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs text-muted mb-1">Trenutna lozinka</label>
                      <input
                        type="password"
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:border-primary"
                        placeholder="••••••••"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-muted mb-1">Nova lozinka</label>
                      <input
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:border-primary"
                        placeholder="••••••••"
                      />
                      <p className="text-xs text-muted mt-1">Minimum 8 karaktera</p>
                    </div>
                    <div>
                      <label className="block text-xs text-muted mb-1">Potvrdi novu lozinku</label>
                      <input
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:border-primary"
                        placeholder="••••••••"
                      />
                    </div>
                    
                    {passwordError && (
                      <div className="bg-error/10 border border-error/20 rounded-lg p-2">
                        <p className="text-xs text-error">{passwordError}</p>
                      </div>
                    )}
                    
                    {passwordSuccess && (
                      <div className="bg-success/10 border border-success/20 rounded-lg p-2">
                        <p className="text-xs text-success">Lozinka je uspešno promenjena!</p>
                      </div>
                    )}
                    
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => {
                          setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                          setPasswordError('');
                          setPasswordSuccess(false);
                          setEditingPassword(false);
                        }}
                        className="flex-1 px-3 py-2 text-xs border border-border rounded-lg hover:bg-secondary transition-colors"
                      >
                        Otkaži
                      </button>
                      <button
                        onClick={handleChangePassword}
                        className="flex-1 px-3 py-2 text-xs bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                      >
                        Sačuvaj
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-muted">
                    <p>Klikni na olovku da promeniš lozinku</p>
                  </div>
                )}
              </div>

              {/* Reviews summary */}
              <div className="bg-white rounded-2xl p-6 border border-border">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium">Recenzije</h3>
                  <button 
                    onClick={() => setActiveTab('reviews')}
                    className="text-sm text-primary hover:underline"
                  >
                    Vidi sve →
                  </button>
                </div>
                {stats.totalReviews > 0 ? (
                  <AverageRating 
                    rating={stats.averageRating} 
                    totalReviews={stats.totalReviews} 
                    size="sm"
                  />
                ) : (
                  <p className="text-sm text-muted">Još uvek nemate recenzija.</p>
                )}
                {pendingReviews.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-sm text-warning flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-warning"></span>
                      {pendingReviews.length} recenzija čeka odobrenje
                    </p>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="space-y-8">
            {/* Reviews header */}
            <div className="bg-white rounded-2xl p-6 border border-border">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center md:text-left">
                  <h2 className="text-lg font-medium mb-2">Tvoje recenzije</h2>
                  <p className="text-sm text-muted">
                    Ocene koje su ti ostavili brendovi
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-light mb-1">{stats.averageRating.toFixed(1)}</div>
                  <AverageRating rating={stats.averageRating} totalReviews={stats.totalReviews} size="sm" />
                </div>
                <div className="text-center md:text-right">
                  <div className="text-2xl font-light mb-1">{allReviews.length}</div>
                  <p className="text-sm text-muted">Ukupno recenzija</p>
                </div>
              </div>
            </div>

            {/* Pending reviews notice */}
            {pendingReviews.length > 0 && (
              <div className="bg-warning/10 border border-warning/20 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-warning">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                  </svg>
                  <p className="text-sm">
                    <strong>{pendingReviews.length} recenzija</strong> čeka odobrenje od strane administratora. 
                    Ove recenzije još uvek nisu vidljive na tvom profilu.
                  </p>
                </div>
              </div>
            )}

            {/* Reviews list */}
            {allReviews.length > 0 ? (
              <div className="space-y-4">
                {allReviews.map((review) => (
                  <ReviewCard
                    key={review.id}
                    review={review}
                    showStatus={true}
                    canReply={review.status === 'approved' && !review.creatorReply}
                    canEditReply={!!review.creatorReply}
                    canDeleteReply={!!review.creatorReply}
                    onReply={(reviewId, reply) => {
                      addReplyToReview(reviewId, reply);
                    }}
                    onEditReply={(reviewId, reply) => {
                      updateReplyToReview(reviewId, reply);
                    }}
                    onDeleteReply={(reviewId) => {
                      deleteReplyFromReview(reviewId);
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-2xl border border-border">
                <div className="text-5xl mb-4">📝</div>
                <h3 className="text-lg font-medium mb-2">Još uvek nemaš recenzija</h3>
                <p className="text-muted">
                  Kada brendovi ostave recenzije za tvoj rad, one će se pojaviti ovde.
                </p>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Delete Account Section - Full Width */}
      <div className="mt-16 bg-gradient-to-b from-secondary/50 to-secondary/80 border-t border-border">
        <div className="max-w-7xl 2xl:max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 py-12">
          <div className="bg-white rounded-2xl p-8 border border-error/20 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-error/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-error mb-1">Opasna zona</h3>
                  <p className="text-muted">
                    Brisanje naloga je trajno i ne može se poništiti. Svi vaši podaci, portfolio i recenzije će biti obrisani.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (confirm('Da li si siguran da želiš da obrišeš svoj nalog? Ova akcija je trajna i ne može se poništiti.')) {
                    alert('Demo režim: U produkciji bi se nalog obrisao i korisnik bi bio odjavljen.');
                  }
                }}
                className="px-6 py-3 bg-error text-white rounded-xl font-medium hover:bg-error/90 transition-colors flex-shrink-0"
              >
                Obriši nalog
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Note: All business users must have active subscription to access the app
// Pricing/payment page will be shown during registration (via Stripe integration)
function BusinessDashboard() {
  const { currentUser } = useDemo();
  const [showPortalMessage, setShowPortalMessage] = useState(false);
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
  const [visibleReviews, setVisibleReviews] = useState(3);
  const [viewingReview, setViewingReview] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Real business data from Supabase
  const [businessData, setBusinessData] = useState<any>(null);
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  
  // Real data from Supabase
  const [recentCreators, setRecentCreators] = useState<any[]>([]);
  const [myReviews, setMyReviews] = useState<any[]>([]);
  
  // Company info editing state
  const [editingCompany, setEditingCompany] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [website, setWebsite] = useState('');
  const [industry, setIndustry] = useState('');
  const [description, setDescription] = useState('');

  // Fetch real business data from Supabase
  useEffect(() => {
    const fetchBusinessData = async () => {
      if (!currentUser.businessId) {
        setIsLoading(false);
        return;
      }
      
      try {
        // Fetch business profile with cache-busting
        const profileRes = await fetch(`/api/business/profile?businessId=${currentUser.businessId}&t=${Date.now()}`);
        if (profileRes.ok) {
          const profile = await profileRes.json();
          setBusinessData(profile);
          setCompanyName(profile.company_name || '');
          setWebsite(profile.website || '');
          setIndustry(profile.industry || '');
          setDescription(profile.description || '');
        }
        
        // Fetch subscription status from Stripe
        const subRes = await fetch(`/api/stripe/subscription-status?businessId=${currentUser.businessId}&t=${Date.now()}`);
        if (subRes.ok) {
          const subData = await subRes.json();
          setSubscriptionData(subData);
        }
        
        // Fetch recently viewed creators
        const viewsRes = await fetch(`/api/creator-views?businessId=${currentUser.businessId}&limit=3`);
        if (viewsRes.ok) {
          const viewsData = await viewsRes.json();
          setRecentCreators(viewsData.creators || []);
        }
        
        // Fetch business reviews
        const reviewsRes = await fetch(`/api/reviews?businessId=${currentUser.businessId}`);
        if (reviewsRes.ok) {
          const reviewsData = await reviewsRes.json();
          setMyReviews(reviewsData.reviews || []);
        }
      } catch (error) {
        console.error('Error fetching business data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchBusinessData();
  }, [currentUser.businessId, currentUser.subscriptionStatus]);
  
  // Handle review delete
  const handleDeleteReview = async (reviewId: string) => {
    try {
      const res = await fetch(`/api/reviews?reviewId=${reviewId}`, { method: 'DELETE' });
      if (res.ok) {
        setMyReviews(prev => prev.filter(r => r.id !== reviewId));
        setShowDeleteSuccess(true);
        setTimeout(() => setShowDeleteSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Error deleting review:', error);
    }
  };
  
  // Handle show more reviews
  const handleShowMoreReviews = () => {
    setVisibleReviews(prev => Math.min(prev + 3, myReviews.length));
  };
  
  const hasMoreReviews = visibleReviews < myReviews.length;
  
  // Real subscription data from Supabase/Stripe
  // Prioritet: Supabase (businessData) jer se odmah ažurira pri obnovi
  const subscription = {
    plan: businessData?.subscription_type || subscriptionData?.plan || 'monthly',
    status: businessData?.subscription_status || subscriptionData?.status || 'active',
    expiresAt: businessData?.expires_at || subscriptionData?.currentPeriodEnd || new Date().toISOString(),
    price: (businessData?.subscription_type || subscriptionData?.plan) === 'monthly' ? '€49/mesec' : '€490/godina',
    cancelAtPeriodEnd: subscriptionData?.cancelAtPeriodEnd || false,
  };

  const handleManageSubscription = async () => {
    if (!currentUser.businessId) {
      setShowPortalMessage(true);
      setTimeout(() => setShowPortalMessage(false), 3000);
      return;
    }
    
    try {
      const response = await fetch('/api/stripe/create-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId: currentUser.businessId }),
      });
      
      if (response.ok) {
        const { url } = await response.json();
        window.location.href = url;
      } else {
        // Fallback to message if no Stripe customer
        setShowPortalMessage(true);
        setTimeout(() => setShowPortalMessage(false), 3000);
      }
    } catch (error) {
      console.error('Error opening portal:', error);
      setShowPortalMessage(true);
      setTimeout(() => setShowPortalMessage(false), 3000);
    }
  };

  // Pencil icon component for editing
  const PencilButton = ({ onClick, editing }: { onClick: () => void; editing?: boolean }) => (
    <button
      onClick={onClick}
      className={`p-2 rounded-lg transition-colors ${editing ? 'bg-primary text-white' : 'hover:bg-secondary text-muted hover:text-foreground'}`}
      title="Uredi"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      </svg>
    </button>
  );

  // Handle save company info - saves to Supabase
  const handleSaveCompanyInfo = async () => {
    if (!currentUser.businessId) {
      setEditingCompany(false);
      return;
    }
    
    setIsSaving(true);
    try {
      const response = await fetch('/api/business/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: currentUser.businessId,
          companyName,
          website,
          industry,
          description,
        }),
      });
      
      if (response.ok) {
        const { business } = await response.json();
        setBusinessData(business);
      }
    } catch (error) {
      console.error('Error saving company info:', error);
    } finally {
      setIsSaving(false);
      setEditingCompany(false);
    }
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted">Učitavanje podataka...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/30">
      <div className="max-w-6xl 2xl:max-w-7xl mx-auto px-6 lg:px-12 py-8 lg:py-12">
        <h1 className="text-3xl font-light mb-2">Dashboard</h1>
        <p className="text-muted mb-10">Dobrodošao nazad, {businessData?.company_name || companyName || currentUser.companyName}</p>

        {/* Demo portal message */}
        {showPortalMessage && (
          <div className="mb-6 bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-center gap-3">
            <span className="text-primary">ℹ️</span>
            <p className="text-sm">
              <strong>Demo režim:</strong> U produkciji, ovde bi se otvorio Stripe Customer Portal za upravljanje pretplatom.
            </p>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Subscription status */}
            <div className={`rounded-2xl p-6 border ${
              subscription.status === 'active' 
                ? 'bg-white border-border' 
                : 'bg-error/5 border-error/20'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-medium mb-1">Tvoja pretplata</h2>
                  <p className="text-sm text-muted">
                    {subscription.plan === 'yearly' ? 'Godišnji' : 'Mesečni'} plan • {subscription.price}
                  </p>
                </div>
                <span className={`px-4 py-1.5 rounded-full text-sm flex items-center gap-2 ${
                  subscription.status === 'active' 
                    ? 'bg-success/10 text-success' 
                    : 'bg-error/10 text-error'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${
                    subscription.status === 'active' ? 'bg-success' : 'bg-error'
                  }`}></span>
                  {subscription.status === 'active' ? 'Aktivna' : 'Istekla'}
                </span>
              </div>
              
              {/* Show warning and renew button if subscription is not active */}
              {subscription.status !== 'active' && (
                <div className="mt-4 p-4 bg-error/10 rounded-xl">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-error flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-error">Pretplata nije aktivna</p>
                      <p className="text-sm text-error/80 mt-1">
                        Nemate pristup kreatorima i njihovim kontakt informacijama. Obnovite pretplatu da nastavite sa korišćenjem platforme.
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/pricing"
                    className="mt-4 w-full py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Obnovi pretplatu
                  </Link>
                </div>
              )}
              
              {/* Show normal info if subscription is active */}
              {subscription.status === 'active' && (
                <div className="mt-6 pt-6 border-t border-border grid sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted">
                      {subscription.cancelAtPeriodEnd ? 'Pretplata ističe' : 'Sledeće plaćanje'}
                    </p>
                    <p className="font-medium">
                      {new Date(subscription.expiresAt).toLocaleDateString('sr-RS', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                    {subscription.cancelAtPeriodEnd && (
                      <p className="text-xs text-warning mt-1">Otkazano - neće se obnoviti</p>
                    )}
                  </div>
                  <div className="sm:text-right">
                    <button 
                      onClick={handleManageSubscription}
                      className="text-sm text-primary hover:underline"
                    >
                      Upravljaj pretplatom →
                    </button>
                  </div>
                </div>
              )}

            </div>

            {/* Company Information */}
            <div className="bg-white rounded-2xl p-6 border border-border">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium">Informacije o kompaniji</h2>
                <PencilButton onClick={() => setEditingCompany(!editingCompany)} editing={editingCompany} />
              </div>
              
              {editingCompany ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-muted mb-2 block">Ime kompanije</label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:border-primary"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm text-muted mb-2 block">Website</label>
                    <input
                      type="url"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://www.example.com"
                      className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:border-primary"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm text-muted mb-2 block">Industrija</label>
                    <select
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:border-primary bg-white"
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
                    <label className="text-sm text-muted mb-2 block">O kompaniji</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:border-primary resize-none"
                      placeholder="Napiši nešto o svojoj kompaniji..."
                    />
                    <p className="text-xs text-muted mt-1 text-right">{description.length} karaktera</p>
                  </div>
                  
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={() => {
                        setCompanyName(currentUser.companyName || '');
                        setWebsite(currentUser.website || '');
                        setIndustry(currentUser.industry || '');
                        setDescription(currentUser.description || '');
                        setEditingCompany(false);
                      }}
                      className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-secondary transition-colors"
                    >
                      Otkaži
                    </button>
                    <button
                      onClick={handleSaveCompanyInfo}
                      disabled={isSaving}
                      className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {isSaving ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Čuvam...
                        </>
                      ) : (
                        'Sačuvaj'
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted">Ime kompanije</p>
                    <p className="font-medium">{companyName || currentUser.companyName || 'Nije uneto'}</p>
                  </div>
                  
                  {(website || currentUser.website) && (
                    <div>
                      <p className="text-sm text-muted">Website</p>
                      <a 
                        href={website || currentUser.website || '#'} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-primary hover:underline"
                      >
                        {website || currentUser.website}
                      </a>
                    </div>
                  )}
                  
                  {(industry || currentUser.industry) && (
                    <div>
                      <p className="text-sm text-muted">Industrija</p>
                      <p className="font-medium capitalize">
                        {industry || currentUser.industry}
                      </p>
                    </div>
                  )}
                  
                  {(description || currentUser.description) && (
                    <div>
                      <p className="text-sm text-muted mb-2">O kompaniji</p>
                      <p className="text-muted leading-relaxed">{description || currentUser.description}</p>
                    </div>
                  )}
                  
                  {!description && !currentUser.description && !website && !currentUser.website && !industry && !currentUser.industry && (
                    <p className="text-muted text-sm italic">Nema dodatnih informacija o kompaniji.</p>
                  )}
                </div>
              )}
            </div>

            {/* Recent creators */}
            <div className="bg-white rounded-2xl p-6 border border-border">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-medium">Nedavno pregledani</h2>
                <Link href="/kreatori" className="text-sm text-muted hover:text-foreground">
                  Vidi sve →
                </Link>
              </div>
              
              {recentCreators.length > 0 ? (
                <div className="space-y-4">
                  {recentCreators.map((creator) => (
                    <Link 
                      key={creator.id} 
                      href={`/kreator/${creator.id}`}
                      className="flex items-center gap-4 p-4 rounded-xl hover:bg-secondary transition-colors"
                    >
                      <div className="w-14 h-14 rounded-full overflow-hidden relative flex-shrink-0 bg-secondary">
                        {creator.profileImage ? (
                          <Image src={creator.profileImage} alt={creator.name || ''} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xl">
                            {creator.name?.charAt(0) || '?'}
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">{creator.name}</h3>
                        <p className="text-sm text-muted">
                          {creator.categories?.length > 0 ? creator.categories.join(', ') : creator.niches?.join(', ') || 'Kreator'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted">{creator.city || 'Srbija'}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted">
                  <div className="text-3xl mb-2">👀</div>
                  <p className="text-sm">Još uvek nisi pregledao nijednog kreatora.</p>
                  <Link href="/kreatori" className="text-sm text-primary hover:underline mt-2 inline-block">
                    Pretraži kreatore →
                  </Link>
                </div>
              )}
            </div>

            {/* My Reviews Section */}
            <div className="bg-white rounded-2xl p-4 sm:p-6 border border-border">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-lg font-medium">Moje recenzije</h2>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted">{myReviews.length} recenzija</span>
                  {myReviews.length > 3 && (
                    <Link 
                      href="/dashboard/reviews"
                      scroll={true}
                      className="text-xs text-primary hover:underline hidden sm:inline"
                    >
                      Vidi sve →
                    </Link>
                  )}
                </div>
              </div>
              
              {/* Delete success message */}
              {showDeleteSuccess && (
                <div className="mb-4 bg-success/10 text-success rounded-lg p-3 text-sm flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 flex-shrink-0">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                  Recenzija je uspešno obrisana.
                </div>
              )}
              
              {myReviews.length > 0 ? (
                <div className="space-y-3">
                  {/* Scrollable container with max height for many reviews */}
                  <div className={`space-y-3 ${visibleReviews > 6 ? 'max-h-[600px] overflow-y-auto pr-2 scrollbar-thin' : ''}`}>
                    {myReviews.slice(0, visibleReviews).map((review) => {
                      return (
                        <div key={review.id} className="p-3 sm:p-4 border border-border rounded-xl">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="min-w-0 flex-1">
                              <Link 
                                href={`/kreator/${review.creator?.id}`}
                                className="font-medium text-primary hover:underline text-sm sm:text-base truncate block"
                              >
                                {review.creator?.name || 'Nepoznat kreator'}
                              </Link>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <div className="flex">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <svg
                                      key={star}
                                      viewBox="0 0 24 24"
                                      fill={star <= review.rating ? '#f59e0b' : 'none'}
                                      stroke={star <= review.rating ? '#f59e0b' : '#e5e5e5'}
                                      strokeWidth={2}
                                      className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                                      />
                                    </svg>
                                  ))}
                                </div>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                  review.status === 'approved' 
                                    ? 'bg-success/10 text-success' 
                                    : review.status === 'pending'
                                    ? 'bg-warning/10 text-warning'
                                    : 'bg-error/10 text-error'
                                }`}>
                                  {review.status === 'approved' ? 'Odobrena' : review.status === 'pending' ? 'Na čekanju' : 'Odbijena'}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => setViewingReview(review)}
                                className="text-muted hover:text-primary transition-colors p-1 flex-shrink-0"
                                title="Pogledaj celu recenziju"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 sm:w-5 sm:h-5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDeleteReview(review.id)}
                                className="text-muted hover:text-error transition-colors p-1 flex-shrink-0"
                                title="Obriši recenziju"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 sm:w-5 sm:h-5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                </svg>
                              </button>
                            </div>
                          </div>
                          <p className="text-xs sm:text-sm text-muted line-clamp-2 break-words">{review.comment}</p>
                          <p className="text-xs text-muted mt-2">
                            {new Date(review.createdAt).toLocaleDateString('sr-RS', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Show more / Show all actions */}
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2 border-t border-border">
                    {hasMoreReviews && (
                      <button
                        onClick={handleShowMoreReviews}
                        className="text-sm text-muted hover:text-foreground transition-colors py-2"
                      >
                        Prikaži još ({Math.min(3, myReviews.length - visibleReviews)})
                      </button>
                    )}
                    {myReviews.length > 3 && (
                      <Link 
                        href="/dashboard/reviews"
                        scroll={true}
                        className="text-sm text-primary hover:underline py-2"
                      >
                        Vidi sve recenzije ({myReviews.length}) →
                      </Link>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted">
                  <div className="text-3xl mb-2">⭐</div>
                  <p className="text-sm">Još uvek nisi ostavio nijednu recenziju.</p>
                  <Link href="/kreatori" className="text-sm text-primary hover:underline mt-2 inline-block">
                    Pretraži kreatore i ostavi recenziju →
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick actions */}
            <div className="bg-white rounded-2xl p-6 border border-border">
              <h3 className="font-medium mb-4">Brze akcije</h3>
              <div className="space-y-3">
                <Link 
                  href="/kreatori"
                  className="block w-full text-left px-4 py-3 rounded-xl bg-secondary hover:bg-accent transition-colors text-sm"
                >
                  Pretraži kreatore
                </Link>
                <Link 
                  href="/dashboard/favorites"
                  className="block w-full text-left px-4 py-3 rounded-xl bg-secondary hover:bg-accent transition-colors text-sm"
                >
                  Sačuvani kreatori
                </Link>
                <Link 
                  href="/dashboard/settings"
                  className="block w-full text-left px-4 py-3 rounded-xl bg-secondary hover:bg-accent transition-colors text-sm"
                >
                  Podešavanja naloga
                </Link>
              </div>
            </div>

            {/* Support */}
            <div className="bg-primary text-white rounded-2xl p-6">
              <h3 className="font-medium mb-2">Treba ti pomoć?</h3>
              <p className="text-sm text-white/70 mb-4">
                Naš tim je tu da ti pomogne da pronađeš savršene kreatore.
              </p>
              <button className="w-full py-3 bg-white text-primary rounded-xl text-sm font-medium hover:bg-white/90 transition-colors">
                Kontaktiraj podršku
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Review Detail Modal */}
      {viewingReview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-lg font-medium mb-1">Tvoja recenzija</h3>
                  <Link 
                    href={`/kreator/${viewingReview.creator?.id}`}
                    className="text-sm text-primary hover:underline"
                    onClick={() => setViewingReview(null)}
                  >
                    {viewingReview.creator?.name || 'Kreator'}
                  </Link>
                </div>
                <button
                  onClick={() => setViewingReview(null)}
                  className="p-2 hover:bg-secondary rounded-xl transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Rating and Status */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      viewBox="0 0 24 24"
                      fill={star <= viewingReview.rating ? '#f59e0b' : 'none'}
                      stroke={star <= viewingReview.rating ? '#f59e0b' : '#e5e5e5'}
                      strokeWidth={2}
                      className="w-5 h-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                      />
                    </svg>
                  ))}
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  viewingReview.status === 'approved' 
                    ? 'bg-success/10 text-success' 
                    : viewingReview.status === 'pending'
                    ? 'bg-warning/10 text-warning'
                    : 'bg-error/10 text-error'
                }`}>
                  {viewingReview.status === 'approved' ? 'Odobrena' : viewingReview.status === 'pending' ? 'Na čekanju' : 'Odbijena'}
                </span>
              </div>

              {/* Full Comment */}
              <div className="bg-secondary/50 rounded-xl p-4 mb-4 overflow-hidden">
                <p className="text-foreground leading-relaxed whitespace-pre-wrap break-words">{viewingReview.comment}</p>
              </div>

              {/* Creator Reply */}
              {viewingReview.creatorReply && (
                <div className="border-l-4 border-primary/30 pl-4 mb-4">
                  <p className="text-sm font-medium text-primary mb-1">Odgovor kreatora</p>
                  <p className="text-sm text-muted">{viewingReview.creatorReply}</p>
                  {viewingReview.creatorReplyAt && (
                    <p className="text-xs text-muted mt-1">
                      {new Date(viewingReview.creatorReplyAt).toLocaleDateString('sr-RS', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  )}
                </div>
              )}

              {/* Date */}
              <p className="text-xs text-muted">
                Objavljeno: {new Date(viewingReview.createdAt).toLocaleDateString('sr-RS', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>

              {/* Actions */}
              <div className="flex gap-3 mt-6 pt-4 border-t border-border">
                <Link
                  href={`/kreator/${viewingReview.creatorId}`}
                  onClick={() => setViewingReview(null)}
                  className="flex-1 py-3 text-center border border-border rounded-xl font-medium hover:bg-secondary transition-colors text-sm"
                >
                  Pogledaj profil kreatora
                </Link>
                <button
                  onClick={() => {
                    handleDeleteReview(viewingReview.id);
                    setViewingReview(null);
                  }}
                  className="py-3 px-4 text-error border border-error/20 rounded-xl font-medium hover:bg-error/10 transition-colors text-sm"
                >
                  Obriši
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Section - Full Width */}
      <div className="mt-16 bg-gradient-to-b from-secondary/50 to-secondary/80 border-t border-border">
        <div className="max-w-7xl 2xl:max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 py-12">
          <div className="bg-white rounded-2xl p-8 border border-error/20 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-error/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-error mb-1">Opasna zona</h3>
                  <p className="text-muted">
                    Brisanje naloga je trajno i ne može se poništiti. Svi vaši podaci i recenzije će biti obrisani.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (confirm('Da li si siguran da želiš da obrišeš svoj nalog? Ova akcija je trajna i ne može se poništiti.')) {
                    alert('Demo režim: U produkciji bi se nalog obrisao i korisnik bi bio odjavljen.');
                  }
                }}
                className="px-6 py-3 bg-error text-white rounded-xl font-medium hover:bg-error/90 transition-colors flex-shrink-0"
              >
                Obriši nalog
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// CREATOR PENDING SCREEN
// ============================================
function CreatorPendingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/50 to-white flex items-center justify-center p-4">
      <div className="max-w-lg w-full text-center">
        {/* Icon */}
        <div className="relative mb-8">
          <div className="w-32 h-32 mx-auto bg-amber-100 rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-16 h-16 text-amber-600">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          {/* Animated pulse ring */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 bg-amber-200/50 rounded-full animate-ping" style={{ animationDuration: '2s' }}></div>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-light mb-4 text-foreground">
          Vaš profil čeka odobrenje
        </h1>

        {/* Description */}
        <p className="text-muted text-lg mb-8 leading-relaxed">
          Hvala vam što ste se registrovali na UGC Select! <br />
          Naš tim trenutno pregleda vaš profil i uskoro ćete dobiti obaveštenje.
        </p>

        {/* Info box */}
        <div className="bg-white rounded-2xl border border-amber-200 p-6 mb-8">
          <h3 className="font-medium text-foreground mb-3 flex items-center justify-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-amber-600">
              <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
            </svg>
            Šta dalje?
          </h3>
          <ul className="text-sm text-muted space-y-2 text-left">
            <li className="flex items-start gap-2">
              <span className="text-amber-600 mt-0.5">✓</span>
              <span>Admin će pregledati vaš profil u najkraćem roku</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-600 mt-0.5">✓</span>
              <span>Dobićete email obaveštenje o statusu profila</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-600 mt-0.5">✓</span>
              <span>Proces odobrenja obično traje do 24 sata</span>
            </li>
          </ul>
        </div>

        {/* Status badge */}
        <div className="inline-flex items-center gap-2 px-5 py-3 bg-amber-100 text-amber-800 rounded-full text-sm font-medium">
          <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
          Na čekanju
        </div>

        {/* Home link */}
        <div className="mt-8">
          <Link href="/" className="text-muted hover:text-foreground transition-colors text-sm">
            ← Nazad na početnu
          </Link>
        </div>
      </div>
    </div>
  );
}

// ============================================
// CREATOR REJECTED SCREEN
// ============================================
function CreatorRejectedScreen({ rejectionReason }: { rejectionReason?: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50/50 to-white flex items-center justify-center p-4">
      <div className="max-w-lg w-full text-center">
        {/* Icon */}
        <div className="w-32 h-32 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-8">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-16 h-16 text-red-600">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
          </svg>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-light mb-4 text-foreground">
          Vaš profil nije odobren
        </h1>

        {/* Description */}
        <p className="text-muted text-lg mb-6 leading-relaxed">
          Nažalost, vaš profil nije prošao proces verifikacije.
        </p>

        {/* Rejection reason box */}
        {rejectionReason && (
          <div className="bg-white rounded-2xl border border-red-200 p-6 mb-8 text-left">
            <h3 className="font-medium text-foreground mb-3 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-red-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
              Razlog odbijanja
            </h3>
            <p className="text-muted text-sm leading-relaxed">
              {rejectionReason}
            </p>
          </div>
        )}

        {/* What to do next */}
        <div className="bg-white rounded-2xl border border-border p-6 mb-8">
          <h3 className="font-medium text-foreground mb-3">Šta možete uraditi?</h3>
          <ul className="text-sm text-muted space-y-2 text-left">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">→</span>
              <span>Pročitajte pažljivo razlog odbijanja</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">→</span>
              <span>Kreirajte novi profil sa ispravnim podacima</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">→</span>
              <span>Kontaktirajte podršku ako imate pitanja</span>
            </li>
          </ul>
        </div>

        {/* Status badge */}
        <div className="inline-flex items-center gap-2 px-5 py-3 bg-red-100 text-red-800 rounded-full text-sm font-medium mb-8">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
          Odbijeno
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link 
            href="/register/kreator" 
            className="px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
          >
            Registruj se ponovo
          </Link>
          <Link 
            href="/" 
            className="px-6 py-3 border border-border rounded-xl font-medium hover:bg-secondary transition-colors"
          >
            Nazad na početnu
          </Link>
        </div>
      </div>
    </div>
  );
}

