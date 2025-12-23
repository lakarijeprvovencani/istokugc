'use client';

import { useState } from 'react';
import { useDemo } from '@/context/DemoContext';
import Link from 'next/link';
import Image from 'next/image';
import { mockCreators } from '@/lib/mockData';
import ReviewCard from '@/components/ReviewCard';
import { AverageRating } from '@/components/StarRating';
import { generateReviewStats, Review } from '@/types/review';
import PortfolioModal, { PortfolioItem } from '@/components/PortfolioModal';
import VideoPlayerModal from '@/components/VideoPlayerModal';

export default function DashboardPage() {
  const { currentUser } = useDemo();

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
  const creator = mockCreators[0]; // Demo: use first creator
  const { getReviewsForCreator, addReplyToReview, updateReplyToReview, deleteReplyFromReview } = useDemo();
  const [activeTab, setActiveTab] = useState<'overview' | 'reviews'>('overview');
  
  // Inline editing states for each section
  const [editingBio, setEditingBio] = useState(false);
  const [editingCategories, setEditingCategories] = useState(false);
  const [editingPlatforms, setEditingPlatforms] = useState(false);
  const [editingLanguages, setEditingLanguages] = useState(false);
  const [editingContact, setEditingContact] = useState(false);
  
  // Portfolio state
  const [showPortfolioModal, setShowPortfolioModal] = useState(false);
  const [activeVideo, setActiveVideo] = useState<PortfolioItem | null>(null);
  const [detailItem, setDetailItem] = useState<PortfolioItem | null>(null);
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
    priceFrom: creator.priceFrom,
  });
  
  // Portfolio handlers
  const handleAddPortfolioItem = (item: PortfolioItem) => {
    setPortfolioItems([...portfolioItems, item]);
    // In production: API call to save to database
  };
  
  const handleRemovePortfolioItem = (id: string) => {
    setPortfolioItems(portfolioItems.filter(item => item.id !== id));
    // In production: API call to delete from database
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
    // Close editing mode
    if (section === 'bio') setEditingBio(false);
    if (section === 'categories') setEditingCategories(false);
    if (section === 'platforms') setEditingPlatforms(false);
    if (section === 'languages') setEditingLanguages(false);
    if (section === 'contact') setEditingContact(false);
  };

  const toggleArrayItem = (arr: string[], item: string, setArr: (arr: string[]) => void) => {
    if (arr.includes(item)) {
      setArr(arr.filter(i => i !== item));
    } else {
      setArr([...arr, item]);
    }
  };

  const tabs = [
    { id: 'overview' as const, label: 'Pregled', count: null },
    { id: 'reviews' as const, label: 'Recenzije', count: allReviews.length },
  ];

  return (
    <div className="min-h-screen bg-secondary/30">
      <div className="max-w-6xl mx-auto px-6 lg:px-12 py-12">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-light mb-2">Dashboard</h1>
            <p className="text-muted">Dobrodošla nazad, {creator.name}</p>
          </div>
          <Link 
            href={`/kreator/${creator.id}`}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-full text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Pogledaj svoj profil
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
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-6 border border-border text-center">
            <div className="text-3xl font-light mb-1">247</div>
            <div className="text-sm text-muted">Pregleda profila</div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-border text-center">
            <div className="text-3xl font-light mb-1">{stats.averageRating.toFixed(1)}</div>
            <div className="text-sm text-muted">Prosečna ocena</div>
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
                  <div className="w-20 h-20 rounded-full overflow-hidden relative">
                    <Image src={creator.photo} alt={creator.name} fill className="object-cover" />
                  </div>
                  <div>
                    <h3 className="font-medium text-lg">{creator.name}</h3>
                    <p className="text-sm text-muted">{creator.location}</p>
                    <p className="text-sm text-muted mt-1">Od €{creator.priceFrom} po projektu</p>
                  </div>
                </div>
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

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl p-6 border border-border text-center">
                  <div className="text-3xl font-light mb-1">247</div>
                  <div className="text-sm text-muted">Pregleda profila</div>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-border text-center">
                  <div className="text-3xl font-light mb-1">{stats.averageRating.toFixed(1)}</div>
                  <div className="text-sm text-muted">Prosečna ocena</div>
                </div>
              </div>

              {/* Portfolio */}
              <div className="bg-white rounded-2xl p-6 border border-border">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-medium">Portfolio</h2>
                  <button 
                    onClick={() => setShowPortfolioModal(true)}
                    className="text-sm text-primary hover:underline"
                  >
                    + Dodaj video
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
                    
                    return (
                      <div key={item.id} className="flex flex-col">
                        <div 
                          className="aspect-[3/4] relative rounded-xl overflow-hidden group cursor-pointer"
                          onClick={() => setActiveVideo(item)}
                        >
                          {item.type === 'upload' && item.url.startsWith('data:video') ? (
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
                              className="object-cover" 
                              unoptimized={item.thumbnail.startsWith('data:')}
                            />
                          )}
                          {/* Hover overlay with play button */}
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center">
                              <svg className="w-6 h-6 text-foreground ml-1" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            </div>
                          </div>
                          {/* Platform badge - text only */}
                          <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-medium">
                            {platformLabels[displayPlatform] || displayPlatform}
                          </div>
                          {/* Delete button on hover */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemovePortfolioItem(item.id);
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
                          setContactInfo({ email: creator.email, phone: creator.phone || '', instagram: creator.instagram || '', priceFrom: creator.priceFrom }); 
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
                    <div className="flex justify-between">
                      <span className="text-muted">Instagram</span>
                      <span>{contactInfo.instagram || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Cena od</span>
                      <span>€{contactInfo.priceFrom}</span>
                    </div>
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

    </div>
  );
}

// Note: All business users must have active subscription to access the app
// Pricing/payment page will be shown during registration (via Stripe integration)
function BusinessDashboard() {
  const { 
    currentUser, 
    getRecentlyViewedCreators, 
    getReviewsByBusiness,
    getCreatorById,
    deleteReview,
  } = useDemo();
  const [showPortalMessage, setShowPortalMessage] = useState(false);
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
  const [visibleReviews, setVisibleReviews] = useState(3); // Number of reviews to show initially
  const [viewingReview, setViewingReview] = useState<Review | null>(null); // For viewing full review in modal
  
  // Get recently viewed creators
  const recentCreators = getRecentlyViewedCreators(3);
  
  // Get business reviews (using demo business ID)
  const businessId = currentUser.businessId || 'b1';
  const myReviews = getReviewsByBusiness(businessId);
  
  // Handle review delete
  const handleDeleteReview = (reviewId: string) => {
    deleteReview(reviewId);
    setShowDeleteSuccess(true);
    setTimeout(() => setShowDeleteSuccess(false), 3000);
  };
  
  // Handle show more reviews
  const handleShowMoreReviews = () => {
    setVisibleReviews(prev => Math.min(prev + 3, myReviews.length));
  };
  
  // Reset visible reviews when reviews change
  const hasMoreReviews = visibleReviews < myReviews.length;
  
  // Demo subscription data (in production, this would come from database)
  const subscription = {
    plan: currentUser.subscriptionPlan || 'yearly',
    status: currentUser.subscriptionStatus || 'active',
    expiresAt: currentUser.subscriptionExpiresAt || '2025-01-15',
    price: currentUser.subscriptionPlan === 'monthly' ? '€49/mesec' : '€490/godina',
  };

  const handleManageSubscription = async () => {
    // In production, this would redirect to Stripe Customer Portal
    // const response = await fetch('/api/stripe/portal', { method: 'POST' });
    // const { url } = await response.json();
    // window.location.href = url;
    
    // Demo mode: show message
    setShowPortalMessage(true);
    setTimeout(() => setShowPortalMessage(false), 3000);
  };

  return (
    <div className="min-h-screen bg-secondary/30">
      <div className="max-w-6xl mx-auto px-6 lg:px-12 py-12">
        <h1 className="text-3xl font-light mb-2">Dashboard</h1>
        <p className="text-muted mb-10">Dobrodošao nazad, {currentUser.companyName || currentUser.name}</p>

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
            <div className="bg-white rounded-2xl p-6 border border-border">
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
              
              <div className="mt-6 pt-6 border-t border-border grid sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted">Sledeće plaćanje</p>
                  <p className="font-medium">
                    {new Date(subscription.expiresAt).toLocaleDateString('sr-RS', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
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
                      <div className="w-14 h-14 rounded-full overflow-hidden relative flex-shrink-0">
                        <Image src={creator.photo} alt={creator.name} fill className="object-cover" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">{creator.name}</h3>
                        <p className="text-sm text-muted">{creator.categories.join(', ')}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">€{creator.priceFrom}</p>
                        <p className="text-sm text-muted">{creator.location}</p>
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
                      const creator = getCreatorById(review.creatorId);
                      return (
                        <div key={review.id} className="p-3 sm:p-4 border border-border rounded-xl">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="min-w-0 flex-1">
                              <Link 
                                href={`/kreator/${review.creatorId}`}
                                className="font-medium text-primary hover:underline text-sm sm:text-base truncate block"
                              >
                                {creator?.name || 'Nepoznat kreator'}
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
                          <p className="text-xs sm:text-sm text-muted line-clamp-2">{review.comment}</p>
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
                  🔍 Pretraži kreatore
                </Link>
                <Link 
                  href="/dashboard/favorites"
                  className="block w-full text-left px-4 py-3 rounded-xl bg-secondary hover:bg-accent transition-colors text-sm"
                >
                  ❤️ Sačuvani kreatori
                </Link>
                <Link 
                  href="/dashboard/settings"
                  className="block w-full text-left px-4 py-3 rounded-xl bg-secondary hover:bg-accent transition-colors text-sm"
                >
                  ⚙️ Podešavanja naloga
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
                    href={`/kreator/${viewingReview.creatorId}`}
                    className="text-sm text-primary hover:underline"
                    onClick={() => setViewingReview(null)}
                  >
                    {getCreatorById(viewingReview.creatorId)?.name || 'Kreator'}
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
              <div className="bg-secondary/50 rounded-xl p-4 mb-4">
                <p className="text-foreground leading-relaxed whitespace-pre-wrap">{viewingReview.comment}</p>
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
    </div>
  );
}

