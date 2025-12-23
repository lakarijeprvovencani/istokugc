'use client';

import { useState, useMemo } from 'react';
import { useDemo } from '@/context/DemoContext';
import Link from 'next/link';
import Image from 'next/image';
import { mockBusinesses, categories, Creator, CreatorStatus, Review } from '@/lib/mockData';
import ReviewCard from '@/components/ReviewCard';
import StarRating from '@/components/StarRating';

type AdminTab = 'pending' | 'creators' | 'businesses' | 'categories' | 'reviews';

export default function AdminPage() {
  const { 
    currentUser, 
    getCreators, 
    updateCreator, 
    deleteCreator, 
    isHydrated,
    getAllReviews,
    getPendingReviews,
    getCreatorById,
    approveReview,
    rejectReview,
    deleteReview,
  } = useDemo();
  const [activeTab, setActiveTab] = useState<AdminTab>('pending');
  
  // Get all creators from context (includes modifications from localStorage)
  // Now includes both mockCreators and pendingCreators
  const allCreators = useMemo(() => {
    if (!isHydrated) return [];
    return getCreators(true); // includeHidden = true to get all creators
  }, [getCreators, isHydrated]);
  
  // Kreatori koji čekaju odobrenje (status='pending' ili approved=false bez statusa)
  const pendingCreatorsList = useMemo(() => {
    return allCreators.filter(c => 
      c.status === 'pending' || (!c.status && !c.approved)
    );
  }, [allCreators]);
  
  // Odobreni/aktivni kreatori
  const approvedCreators = useMemo(() => {
    return allCreators.filter(c => 
      c.status === 'approved' || (c.approved && !c.status)
    );
  }, [allCreators]);
  
  // Deaktivirani kreatori
  const deactivatedCreators = useMemo(() => {
    return allCreators.filter(c => c.status === 'deactivated');
  }, [allCreators]);
  
  // State za biznise
  const [localBusinesses, setLocalBusinesses] = useState([...mockBusinesses]);
  
  // State za kategorije
  const [localCategories, setLocalCategories] = useState([...categories]);
  const [newCategory, setNewCategory] = useState('');
  
  // State za editovanje
  const [editingCreator, setEditingCreator] = useState<Creator | null>(null);
  
  // State za pregled kreatora (detalji)
  const [viewingCreator, setViewingCreator] = useState<Creator | null>(null);
  // Da li se modal otvara iz pending liste (prikaži Odobri/Odbij) ili iz kreatori liste (prikaži samo status)
  const [viewingFromPending, setViewingFromPending] = useState(false);
  
  // Pretraga
  const [searchCreators, setSearchCreators] = useState('');
  const [searchBusinesses, setSearchBusinesses] = useState('');
  
  // State za recenzije
  const [reviewStatusFilter, setReviewStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [selectedReviewCreator, setSelectedReviewCreator] = useState<string>('all');
  
  // Get reviews
  const allReviews = useMemo(() => {
    if (!isHydrated) return [];
    return getAllReviews();
  }, [getAllReviews, isHydrated]);
  
  const pendingReviewsCount = useMemo(() => {
    return allReviews.filter(r => r.status === 'pending').length;
  }, [allReviews]);
  
  // Filtrirane recenzije
  const filteredReviews = useMemo(() => {
    let reviews = [...allReviews];
    
    if (reviewStatusFilter !== 'all') {
      reviews = reviews.filter(r => r.status === reviewStatusFilter);
    }
    
    if (selectedReviewCreator !== 'all') {
      reviews = reviews.filter(r => r.creatorId === selectedReviewCreator);
    }
    
    // Sort by date, pending first
    return reviews.sort((a, b) => {
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (a.status !== 'pending' && b.status === 'pending') return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [allReviews, reviewStatusFilter, selectedReviewCreator]);
  
  // Helper za dobijanje imena kreatora
  const getCreatorName = (creatorId: string): string => {
    const creator = getCreatorById(creatorId);
    return creator?.name || 'Nepoznat kreator';
  };

  if (currentUser.type !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-medium mb-4">Pristup odbijen</h1>
          <p className="text-muted mb-6">Samo administratori mogu pristupiti ovoj stranici.</p>
          <Link href="/" className="text-primary hover:underline">
            Nazad na početnu
          </Link>
        </div>
      </div>
    );
  }

  // Odobri kreatora - sets status to 'approved'
  const handleApprove = (id: string) => {
    updateCreator(id, { 
      approved: true, 
      status: 'approved' as CreatorStatus 
    });
  };

  // Odbij kreatora - soft delete
  const handleReject = (id: string) => {
    deleteCreator(id);
  };

  // Obriši kreatora
  const handleDeleteCreator = (id: string) => {
    if (confirm('Da li ste sigurni da želite da obrišete ovog kreatora?')) {
      deleteCreator(id);
    }
  };

  // Promeni status kreatora
  const handleChangeStatus = (id: string, newStatus: CreatorStatus) => {
    updateCreator(id, { 
      status: newStatus,
      approved: newStatus === 'approved'
    });
  };

  // Obriši biznis
  const handleDeleteBusiness = (id: string) => {
    if (confirm('Da li ste sigurni da želite da obrišete ovaj biznis nalog?')) {
      setLocalBusinesses(prev => prev.filter(b => b.id !== id));
    }
  };

  // Dodaj kategoriju
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCategory.trim() && !localCategories.includes(newCategory.trim())) {
      setLocalCategories([...localCategories, newCategory.trim()]);
      setNewCategory('');
    }
  };

  // Obriši kategoriju
  const handleDeleteCategory = (category: string) => {
    if (confirm(`Da li ste sigurni da želite da obrišete kategoriju "${category}"?`)) {
      setLocalCategories(prev => prev.filter(c => c !== category));
    }
  };

  // Sačuvaj izmene kreatora
  const handleSaveCreator = (updatedCreator: Creator) => {
    updateCreator(updatedCreator.id, {
      name: updatedCreator.name,
      email: updatedCreator.email,
      location: updatedCreator.location,
      bio: updatedCreator.bio,
      priceFrom: updatedCreator.priceFrom,
      phone: updatedCreator.phone,
      instagram: updatedCreator.instagram,
    });
    setEditingCreator(null);
  };

  // Filtrirani kreatori (svi osim obrišenih)
  const filteredCreators = allCreators.filter(c => 
    c.name.toLowerCase().includes(searchCreators.toLowerCase()) ||
    c.email.toLowerCase().includes(searchCreators.toLowerCase())
  );

  // Filtrirani biznisi
  const filteredBusinesses = localBusinesses.filter(b => 
    b.companyName.toLowerCase().includes(searchBusinesses.toLowerCase()) ||
    b.email.toLowerCase().includes(searchBusinesses.toLowerCase())
  );

  const tabs: { id: AdminTab; label: string; count?: number; highlight?: boolean }[] = [
    { id: 'pending', label: 'Čekaju odobrenje', count: pendingCreatorsList.length },
    { id: 'creators', label: 'Kreatori', count: allCreators.length },
    { id: 'businesses', label: 'Biznisi', count: localBusinesses.length },
    { id: 'categories', label: 'Kategorije', count: localCategories.length },
    { id: 'reviews', label: 'Recenzije', count: pendingReviewsCount, highlight: pendingReviewsCount > 0 },
  ];

  return (
    <div className="min-h-screen bg-secondary/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-6 sm:py-12">
        {/* Header - responsive */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-10 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-light mb-1 sm:mb-2">Admin Panel</h1>
            <p className="text-sm sm:text-base text-muted">Upravljaj platformom</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="text-xs sm:text-sm text-muted">Ulogovan kao:</span>
            <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-primary text-white rounded-full text-xs sm:text-sm">Admin</span>
          </div>
        </div>

        {/* Tabs - grid on mobile, flex on desktop */}
        <div className="mb-6 sm:mb-8">
          {/* Mobile tabs - grid layout */}
          <div className="grid grid-cols-3 gap-2 sm:hidden">
            {tabs.map((tab) => {
              const mobileLabels: Record<AdminTab, string> = {
                pending: '⏳ Čekaju',
                creators: '🎨 Kreatori',
                businesses: '🏢 Biznisi',
                categories: '📂 Kat.',
                reviews: '⭐ Recenzije',
              };
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-2 py-3 rounded-xl text-xs font-medium transition-colors flex flex-col items-center gap-1 ${
                    activeTab === tab.id
                      ? 'bg-primary text-white'
                      : 'bg-white border border-border hover:bg-secondary'
                  } ${tab.highlight && activeTab !== tab.id ? 'border-warning' : ''}`}
                >
                  <span>{mobileLabels[tab.id]}</span>
                  {tab.count !== undefined && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                      activeTab === tab.id ? 'bg-white/20' : 
                      tab.highlight ? 'bg-warning/20 text-warning' : 'bg-secondary'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          
          {/* Desktop tabs - horizontal flex */}
          <div className="hidden sm:flex gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary text-white'
                    : 'bg-white border border-border hover:bg-secondary'
                } ${tab.highlight && activeTab !== tab.id ? 'border-warning' : ''}`}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                    activeTab === tab.id ? 'bg-white/20' : 
                    tab.highlight ? 'bg-warning/20 text-warning' : 'bg-secondary'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl border border-border p-4 sm:p-6">
          {/* Pending */}
          {activeTab === 'pending' && (
            <div>
              <h2 className="text-base sm:text-lg font-medium mb-4 sm:mb-6">Kreatori koji čekaju odobrenje</h2>
              
              {pendingCreatorsList.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <div className="text-3xl sm:text-4xl mb-4">✅</div>
                  <p className="text-muted text-sm sm:text-base">Nema kreatora koji čekaju odobrenje</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingCreatorsList.map((creator) => (
                    <div key={creator.id} className="border border-border rounded-xl p-4 sm:p-6">
                      {/* Mobile layout */}
                      <div className="sm:hidden">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-14 h-14 rounded-full overflow-hidden relative flex-shrink-0">
                            <Image src={creator.photo} alt={creator.name} fill className="object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-base truncate">{creator.name}</h3>
                            <p className="text-xs text-muted truncate">{creator.location}</p>
                            <p className="text-xs text-muted truncate">{creator.email}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="font-medium text-sm">€{creator.priceFrom}</p>
                          </div>
                        </div>
                        
                        <p className="text-xs text-muted line-clamp-2 mb-3">{creator.bio}</p>
                        
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {creator.categories.slice(0, 3).map((cat) => (
                            <span key={cat} className="px-2 py-0.5 bg-secondary rounded-full text-xs">
                              {cat}
                            </span>
                          ))}
                          {creator.categories.length > 3 && (
                            <span className="px-2 py-0.5 bg-secondary rounded-full text-xs">+{creator.categories.length - 3}</span>
                          )}
                        </div>
                        
                        {/* Mobile buttons - stack vertically */}
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => { setViewingCreator(creator); setViewingFromPending(true); }}
                            className="w-full py-2.5 border border-primary text-primary rounded-xl text-sm font-medium hover:bg-primary/5 transition-colors"
                          >
                            👁 Pogledaj detalje
                          </button>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApprove(creator.id)}
                              className="flex-1 py-2.5 bg-success text-white rounded-xl text-sm font-medium hover:bg-success/90 transition-colors"
                            >
                              ✓ Odobri
                            </button>
                            <button
                              onClick={() => handleReject(creator.id)}
                              className="flex-1 py-2.5 bg-error text-white rounded-xl text-sm font-medium hover:bg-error/90 transition-colors"
                            >
                              ✕ Odbij
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      {/* Desktop layout */}
                      <div className="hidden sm:block">
                        <div className="flex items-start gap-6">
                          <div className="w-20 h-20 rounded-full overflow-hidden relative flex-shrink-0">
                            <Image src={creator.photo} alt={creator.name} fill className="object-cover" />
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-medium text-lg">{creator.name}</h3>
                                <p className="text-sm text-muted">{creator.location}</p>
                                <p className="text-sm text-muted">{creator.email}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-medium">€{creator.priceFrom}</p>
                                <p className="text-sm text-muted">Registrovan: {creator.createdAt}</p>
                              </div>
                            </div>
                            
                            <p className="text-sm mt-4 line-clamp-2">{creator.bio}</p>
                            
                            <div className="flex flex-wrap gap-2 mt-4">
                              {creator.categories.map((cat) => (
                                <span key={cat} className="px-3 py-1 bg-secondary rounded-full text-xs">
                                  {cat}
                                </span>
                              ))}
                            </div>
                            
                            <div className="flex gap-3 mt-6">
                              <button
                                onClick={() => { setViewingCreator(creator); setViewingFromPending(true); }}
                                className="px-6 py-2.5 border border-primary text-primary rounded-xl text-sm font-medium hover:bg-primary/5 transition-colors"
                              >
                                👁 Pogledaj detalje
                              </button>
                              <button
                                onClick={() => handleApprove(creator.id)}
                                className="px-6 py-2.5 bg-success text-white rounded-xl text-sm font-medium hover:bg-success/90 transition-colors"
                              >
                                ✓ Odobri
                              </button>
                              <button
                                onClick={() => handleReject(creator.id)}
                                className="px-6 py-2.5 bg-error text-white rounded-xl text-sm font-medium hover:bg-error/90 transition-colors"
                              >
                                ✕ Odbij
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Creators */}
          {activeTab === 'creators' && (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
                <h2 className="text-base sm:text-lg font-medium">Svi kreatori ({filteredCreators.length})</h2>
                <input
                  type="text"
                  placeholder="Pretraži..."
                  value={searchCreators}
                  onChange={(e) => setSearchCreators(e.target.value)}
                  className="px-4 py-2 border border-border rounded-xl focus:outline-none focus:border-muted w-full sm:w-64 text-sm"
                />
              </div>
              
              {filteredCreators.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <p className="text-muted text-sm sm:text-base">Nema rezultata</p>
                </div>
              ) : (
                <>
                  {/* Mobile view - cards */}
                  <div className="sm:hidden space-y-3">
                    {filteredCreators.map((creator) => (
                      <div key={creator.id} className="border border-border rounded-xl p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 rounded-full overflow-hidden relative flex-shrink-0">
                            <Image src={creator.photo} alt="" fill className="object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{creator.name}</div>
                            <div className="text-xs text-muted truncate">{creator.email}</div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="font-medium text-sm">€{creator.priceFrom}</p>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {creator.categories.slice(0, 2).map((cat) => (
                            <span key={cat} className="px-2 py-0.5 bg-secondary rounded text-xs">
                              {cat}
                            </span>
                          ))}
                          {creator.categories.length > 2 && (
                            <span className="px-2 py-0.5 bg-secondary rounded text-xs">
                              +{creator.categories.length - 2}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between gap-2">
                          <select
                            value={creator.status || (creator.approved ? 'approved' : 'pending')}
                            onChange={(e) => handleChangeStatus(creator.id, e.target.value as CreatorStatus)}
                            className={`px-2 py-1.5 rounded-lg text-xs cursor-pointer transition-colors border-0 focus:outline-none ${
                              (creator.status === 'approved' || (creator.approved && !creator.status))
                                ? 'bg-black text-white' 
                                : creator.status === 'pending'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            <option value="approved">Aktivan</option>
                            <option value="pending">Na čekanju</option>
                            <option value="deactivated">Neaktivan</option>
                          </select>
                          
                          <div className="flex gap-3">
                            <button 
                              onClick={() => { setViewingCreator(creator); setViewingFromPending(false); }}
                              className="text-xs text-muted hover:text-primary"
                            >
                              👁
                            </button>
                            <button 
                              onClick={() => setEditingCreator(creator)}
                              className="text-xs text-primary hover:underline"
                            >
                              Uredi
                            </button>
                            <button 
                              onClick={() => handleDeleteCreator(creator.id)}
                              className="text-xs text-error hover:underline"
                            >
                              Obriši
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Desktop view - table */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border text-left">
                          <th className="pb-4 font-medium text-sm text-muted">Kreator</th>
                          <th className="pb-4 font-medium text-sm text-muted">Kategorije</th>
                          <th className="pb-4 font-medium text-sm text-muted">Cena</th>
                          <th className="pb-4 font-medium text-sm text-muted">Status</th>
                          <th className="pb-4 font-medium text-sm text-muted">Akcije</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredCreators.map((creator) => (
                          <tr key={creator.id} className="border-b border-border">
                            <td className="py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full overflow-hidden relative">
                                  <Image src={creator.photo} alt="" fill className="object-cover" />
                                </div>
                                <div>
                                  <div className="font-medium">{creator.name}</div>
                                  <div className="text-sm text-muted">{creator.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-4">
                              <div className="flex gap-1 flex-wrap">
                                {creator.categories.slice(0, 2).map((cat) => (
                                  <span key={cat} className="px-2 py-0.5 bg-secondary rounded text-xs">
                                    {cat}
                                  </span>
                                ))}
                                {creator.categories.length > 2 && (
                                  <span className="px-2 py-0.5 bg-secondary rounded text-xs">
                                    +{creator.categories.length - 2}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-4">€{creator.priceFrom}</td>
                            <td className="py-4">
                              <select
                                value={creator.status || (creator.approved ? 'approved' : 'pending')}
                                onChange={(e) => handleChangeStatus(creator.id, e.target.value as CreatorStatus)}
                                className={`px-3 py-1.5 rounded-lg text-xs cursor-pointer transition-colors border-0 focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                                  (creator.status === 'approved' || (creator.approved && !creator.status))
                                    ? 'bg-black text-white' 
                                    : creator.status === 'pending'
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-red-100 text-red-700'
                                }`}
                              >
                                <option value="approved">Aktivan</option>
                                <option value="pending">Na čekanju</option>
                                <option value="deactivated">Neaktivan</option>
                              </select>
                            </td>
                            <td className="py-4">
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => { setViewingCreator(creator); setViewingFromPending(false); }}
                                  className="text-sm text-muted hover:text-primary"
                                >
                                  👁
                                </button>
                                <button 
                                  onClick={() => setEditingCreator(creator)}
                                  className="text-sm text-primary hover:underline"
                                >
                                  Uredi
                                </button>
                                <button 
                                  onClick={() => handleDeleteCreator(creator.id)}
                                  className="text-sm text-error hover:underline"
                                >
                                  Obriši
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Businesses */}
          {activeTab === 'businesses' && (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
                <h2 className="text-base sm:text-lg font-medium">Svi biznisi ({filteredBusinesses.length})</h2>
                <input
                  type="text"
                  placeholder="Pretraži..."
                  value={searchBusinesses}
                  onChange={(e) => setSearchBusinesses(e.target.value)}
                  className="px-4 py-2 border border-border rounded-xl focus:outline-none focus:border-muted w-full sm:w-64 text-sm"
                />
              </div>
              
              {filteredBusinesses.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <p className="text-muted text-sm sm:text-base">Nema rezultata</p>
                </div>
              ) : (
                <>
                  {/* Mobile view - cards */}
                  <div className="sm:hidden space-y-3">
                    {filteredBusinesses.map((business) => (
                      <div key={business.id} className="border border-border rounded-xl p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-sm truncate">{business.companyName}</h3>
                            <p className="text-xs text-muted truncate">{business.email}</p>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-xs flex-shrink-0 ml-2 ${
                            business.subscriptionStatus === 'active' 
                              ? 'bg-success/10 text-success' 
                              : business.subscriptionStatus === 'expired'
                              ? 'bg-error/10 text-error'
                              : 'bg-secondary text-muted'
                          }`}>
                            {business.subscriptionStatus === 'active' ? 'Aktivan' : 
                             business.subscriptionStatus === 'expired' ? 'Istekao' : 'Neaktivan'}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs text-muted">
                          <span>
                            Plan: {business.subscriptionType === 'yearly' ? 'Godišnji' : 
                                   business.subscriptionType === 'monthly' ? 'Mesečni' : '—'}
                          </span>
                          <span>Ističe: {business.expiresAt || '—'}</span>
                        </div>
                        
                        <div className="mt-3 pt-3 border-t border-border">
                          <button 
                            onClick={() => handleDeleteBusiness(business.id)}
                            className="text-xs text-error hover:underline"
                          >
                            Obriši nalog
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Desktop view - table */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border text-left">
                          <th className="pb-4 font-medium text-sm text-muted">Kompanija</th>
                          <th className="pb-4 font-medium text-sm text-muted">Email</th>
                          <th className="pb-4 font-medium text-sm text-muted">Plan</th>
                          <th className="pb-4 font-medium text-sm text-muted">Status</th>
                          <th className="pb-4 font-medium text-sm text-muted">Ističe</th>
                          <th className="pb-4 font-medium text-sm text-muted">Akcije</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredBusinesses.map((business) => (
                          <tr key={business.id} className="border-b border-border">
                            <td className="py-4 font-medium">{business.companyName}</td>
                            <td className="py-4 text-muted">{business.email}</td>
                            <td className="py-4">
                              {business.subscriptionType === 'yearly' ? 'Godišnji' : 
                               business.subscriptionType === 'monthly' ? 'Mesečni' : '—'}
                            </td>
                            <td className="py-4">
                              <span className={`px-3 py-1 rounded-full text-xs ${
                                business.subscriptionStatus === 'active' 
                                  ? 'bg-success/10 text-success' 
                                  : business.subscriptionStatus === 'expired'
                                  ? 'bg-error/10 text-error'
                                  : 'bg-secondary text-muted'
                              }`}>
                                {business.subscriptionStatus === 'active' ? 'Aktivan' : 
                                 business.subscriptionStatus === 'expired' ? 'Istekao' : 'Neaktivan'}
                              </span>
                            </td>
                            <td className="py-4 text-muted">{business.expiresAt || '—'}</td>
                            <td className="py-4">
                              <button 
                                onClick={() => handleDeleteBusiness(business.id)}
                                className="text-sm text-error hover:underline"
                              >
                                Obriši
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Categories */}
          {activeTab === 'categories' && (
            <div>
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-base sm:text-lg font-medium">Kategorije ({localCategories.length})</h2>
              </div>
              
              <form onSubmit={handleAddCategory} className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 sm:mb-8">
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="Nova kategorija..."
                  className="flex-1 px-4 sm:px-5 py-2.5 sm:py-3 border border-border rounded-xl focus:outline-none focus:border-muted text-sm"
                />
                <button
                  type="submit"
                  className="px-6 py-2.5 sm:py-3 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  Dodaj
                </button>
              </form>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
                {localCategories.map((category) => (
                  <div 
                    key={category}
                    className="flex items-center justify-between p-3 sm:p-4 bg-secondary rounded-xl group"
                  >
                    <span className="text-sm truncate">{category}</span>
                    <button 
                      onClick={() => handleDeleteCategory(category)}
                      className="text-muted hover:text-error transition-colors sm:opacity-0 sm:group-hover:opacity-100 flex-shrink-0 ml-2"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reviews */}
          {activeTab === 'reviews' && (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
                <div>
                  <h2 className="text-base sm:text-lg font-medium">Moderacija recenzija</h2>
                  <p className="text-sm text-muted mt-1">
                    {pendingReviewsCount > 0 
                      ? `${pendingReviewsCount} recenzija čeka odobrenje`
                      : 'Sve recenzije su pregledane'
                    }
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2">
                  {/* Status filter */}
                  <select
                    value={reviewStatusFilter}
                    onChange={(e) => setReviewStatusFilter(e.target.value as typeof reviewStatusFilter)}
                    className="px-4 py-2 border border-border rounded-xl focus:outline-none focus:border-muted text-sm"
                  >
                    <option value="pending">Na čekanju ({allReviews.filter(r => r.status === 'pending').length})</option>
                    <option value="approved">Odobrene ({allReviews.filter(r => r.status === 'approved').length})</option>
                    <option value="rejected">Odbijene ({allReviews.filter(r => r.status === 'rejected').length})</option>
                    <option value="all">Sve ({allReviews.length})</option>
                  </select>
                  
                  {/* Creator filter */}
                  <select
                    value={selectedReviewCreator}
                    onChange={(e) => setSelectedReviewCreator(e.target.value)}
                    className="px-4 py-2 border border-border rounded-xl focus:outline-none focus:border-muted text-sm"
                  >
                    <option value="all">Svi kreatori</option>
                    {allCreators.map(creator => (
                      <option key={creator.id} value={creator.id}>
                        {creator.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              {filteredReviews.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <div className="text-3xl sm:text-4xl mb-4">
                    {reviewStatusFilter === 'pending' ? '✅' : '📝'}
                  </div>
                  <p className="text-muted text-sm sm:text-base">
                    {reviewStatusFilter === 'pending' 
                      ? 'Nema recenzija koje čekaju odobrenje'
                      : 'Nema recenzija sa ovim filterima'
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredReviews.map((review) => (
                    <div key={review.id} className="border border-border rounded-xl p-4 sm:p-6">
                      {/* Review header */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
                        <div className="flex items-center gap-3">
                          {/* Business avatar */}
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-medium text-primary">
                              {review.businessName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-sm">{review.businessName}</div>
                            <div className="text-xs text-muted">
                              Za: <Link href={`/kreator/${review.creatorId}`} className="text-primary hover:underline">
                                {getCreatorName(review.creatorId)}
                              </Link>
                            </div>
                          </div>
                        </div>
                        
                        {/* Status & date */}
                        <div className="flex items-center gap-3">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                            review.status === 'pending' 
                              ? 'bg-amber-100 text-amber-700'
                              : review.status === 'approved'
                              ? 'bg-success/10 text-success'
                              : 'bg-error/10 text-error'
                          }`}>
                            {review.status === 'pending' ? 'Na čekanju' :
                             review.status === 'approved' ? 'Odobrena' : 'Odbijena'}
                          </span>
                          <span className="text-xs text-muted">{review.createdAt}</span>
                        </div>
                      </div>
                      
                      {/* Rating */}
                      <div className="mb-3">
                        <StarRating rating={review.rating} readonly size="sm" />
                      </div>
                      
                      {/* Comment */}
                      <p className="text-sm mb-4">{review.comment}</p>
                      
                      {/* Creator reply */}
                      {review.creatorReply && (
                        <div className="bg-secondary/50 rounded-xl p-4 mb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-medium text-primary">Odgovor kreatora</span>
                            {review.creatorReplyAt && (
                              <span className="text-xs text-muted">{review.creatorReplyAt}</span>
                            )}
                          </div>
                          <p className="text-sm text-muted">{review.creatorReply}</p>
                        </div>
                      )}
                      
                      {/* Actions */}
                      <div className="flex flex-wrap gap-2 pt-4 border-t border-border">
                        {review.status === 'pending' && (
                          <>
                            <button
                              onClick={() => approveReview(review.id)}
                              className="px-4 py-2 bg-success text-white rounded-lg text-sm font-medium hover:bg-success/90 transition-colors"
                            >
                              ✓ Odobri
                            </button>
                            <button
                              onClick={() => {
                                const reason = prompt('Razlog odbijanja (opcionalno):');
                                rejectReview(review.id, reason || undefined);
                              }}
                              className="px-4 py-2 bg-error text-white rounded-lg text-sm font-medium hover:bg-error/90 transition-colors"
                            >
                              ✕ Odbij
                            </button>
                          </>
                        )}
                        {review.status === 'approved' && (
                          <button
                            onClick={() => rejectReview(review.id)}
                            className="px-4 py-2 border border-error text-error rounded-lg text-sm font-medium hover:bg-error/10 transition-colors"
                          >
                            Povuci odobrenje
                          </button>
                        )}
                        {review.status === 'rejected' && (
                          <button
                            onClick={() => approveReview(review.id)}
                            className="px-4 py-2 border border-success text-success rounded-lg text-sm font-medium hover:bg-success/10 transition-colors"
                          >
                            Odobri
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (confirm('Da li ste sigurni da želite da obrišete ovu recenziju?')) {
                              deleteReview(review.id);
                            }
                          }}
                          className="px-4 py-2 text-muted hover:text-error text-sm transition-colors ml-auto"
                        >
                          Obriši
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* View Creator Details Modal */}
        {viewingCreator && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Header with photo */}
              <div className="relative h-32 sm:h-48 bg-gradient-to-br from-primary/20 to-primary/5">
                <button 
                  onClick={() => setViewingCreator(null)}
                  className="absolute top-4 right-4 w-8 h-8 bg-white rounded-full flex items-center justify-center text-muted hover:text-foreground shadow-lg"
                >
                  ✕
                </button>
              </div>
              
              <div className="px-4 sm:px-6 pb-6">
                {/* Profile photo */}
                <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12 sm:-mt-16 mb-6">
                  <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden relative border-4 border-white shadow-lg flex-shrink-0">
                    <Image src={viewingCreator.photo} alt={viewingCreator.name} fill className="object-cover" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl sm:text-2xl font-medium">{viewingCreator.name}</h2>
                    <p className="text-sm text-muted">{viewingCreator.location}</p>
                    <p className="text-lg font-medium text-primary mt-1">od €{viewingCreator.priceFrom}</p>
                  </div>
                </div>
                
                {/* Contact info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 p-4 bg-secondary/50 rounded-xl">
                  <div>
                    <span className="text-xs text-muted block">Email</span>
                    <span className="text-sm font-medium">{viewingCreator.email}</span>
                  </div>
                  {viewingCreator.phone && (
                    <div>
                      <span className="text-xs text-muted block">Telefon</span>
                      <span className="text-sm font-medium">{viewingCreator.phone}</span>
                    </div>
                  )}
                  {viewingCreator.instagram && (
                    <div>
                      <span className="text-xs text-muted block">Instagram</span>
                      <span className="text-sm font-medium">{viewingCreator.instagram}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-xs text-muted block">Registrovan</span>
                    <span className="text-sm font-medium">{viewingCreator.createdAt}</span>
                  </div>
                </div>
                
                {/* Bio */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-muted mb-2">Bio</h3>
                  <p className="text-sm leading-relaxed">{viewingCreator.bio}</p>
                </div>
                
                {/* Categories */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-muted mb-2">Kategorije</h3>
                  <div className="flex flex-wrap gap-2">
                    {viewingCreator.categories.map((cat) => (
                      <span key={cat} className="px-3 py-1.5 bg-secondary rounded-full text-xs font-medium">
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
                
                {/* Platforms */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-muted mb-2">Platforme</h3>
                  <div className="flex flex-wrap gap-2">
                    {viewingCreator.platforms.map((platform) => (
                      <span key={platform} className="px-3 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-medium">
                        {platform}
                      </span>
                    ))}
                  </div>
                </div>
                
                {/* Languages */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-muted mb-2">Jezici</h3>
                  <div className="flex flex-wrap gap-2">
                    {viewingCreator.languages.map((lang) => (
                      <span key={lang} className="px-3 py-1.5 bg-secondary rounded-full text-xs">
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>
                
                {/* Portfolio */}
                {viewingCreator.portfolio && viewingCreator.portfolio.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-muted mb-3">Portfolio ({viewingCreator.portfolio.length} video{viewingCreator.portfolio.length > 1 ? 'a' : ''})</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {viewingCreator.portfolio.map((item, index) => (
                        <a 
                          key={index}
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group relative aspect-[9/16] rounded-xl overflow-hidden bg-secondary"
                        >
                          <Image 
                            src={item.thumbnail} 
                            alt={`Portfolio ${index + 1}`} 
                            fill 
                            className="object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="text-white text-xs font-medium px-3 py-1.5 bg-black/50 rounded-full flex items-center gap-1">
                              {item.type === 'tiktok' && '📱 TikTok'}
                              {item.type === 'instagram' && '📸 Instagram'}
                              {item.type === 'youtube' && '🎬 YouTube'}
                            </span>
                          </div>
                          <div className="absolute top-2 right-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                              item.type === 'tiktok' ? 'bg-black text-white' :
                              item.type === 'instagram' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' :
                              'bg-red-600 text-white'
                            }`}>
                              {item.type === 'tiktok' && 'TikTok'}
                              {item.type === 'instagram' && 'IG'}
                              {item.type === 'youtube' && 'YT'}
                            </span>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Action buttons - different for pending vs approved creators */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border">
                  {viewingFromPending ? (
                    // Pending kreatori - prikaži Odobri/Odbij
                    <>
                      <button
                        onClick={() => {
                          handleApprove(viewingCreator.id);
                          setViewingCreator(null);
                        }}
                        className="flex-1 py-3 bg-success text-white rounded-xl text-sm font-medium hover:bg-success/90 transition-colors"
                      >
                        ✓ Odobri kreatora
                      </button>
                      <button
                        onClick={() => {
                          handleReject(viewingCreator.id);
                          setViewingCreator(null);
                        }}
                        className="flex-1 py-3 bg-error text-white rounded-xl text-sm font-medium hover:bg-error/90 transition-colors"
                      >
                        ✕ Odbij kreatora
                      </button>
                    </>
                  ) : (
                    // Već odobreni kreatori - prikaži status dropdown
                    <div className="flex-1 flex items-center gap-3">
                      <span className="text-sm text-muted">Status:</span>
                      <select
                        value={viewingCreator.status || (viewingCreator.approved ? 'approved' : 'pending')}
                        onChange={(e) => {
                          handleChangeStatus(viewingCreator.id, e.target.value as CreatorStatus);
                          setViewingCreator({...viewingCreator, status: e.target.value as CreatorStatus});
                        }}
                        className={`px-4 py-2 rounded-xl text-sm cursor-pointer transition-colors border-0 focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                          (viewingCreator.status === 'approved' || (viewingCreator.approved && !viewingCreator.status))
                            ? 'bg-black text-white' 
                            : viewingCreator.status === 'pending'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        <option value="approved">Aktivan</option>
                        <option value="pending">Na čekanju</option>
                        <option value="deactivated">Neaktivan</option>
                      </select>
                    </div>
                  )}
                  <button
                    onClick={() => setViewingCreator(null)}
                    className={`${viewingFromPending ? 'flex-1' : ''} py-3 px-6 border border-border rounded-xl text-sm font-medium hover:bg-secondary transition-colors`}
                  >
                    Zatvori
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Creator Modal */}
        {editingCreator && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium">Uredi kreatora</h3>
                <button 
                  onClick={() => setEditingCreator(null)}
                  className="text-muted hover:text-foreground"
                >
                  ✕
                </button>
              </div>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                handleSaveCreator(editingCreator);
              }} className="space-y-4">
                <div>
                  <label className="text-sm text-muted mb-1 block">Ime</label>
                  <input
                    type="text"
                    value={editingCreator.name}
                    onChange={(e) => setEditingCreator({...editingCreator, name: e.target.value})}
                    className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:border-muted"
                  />
                </div>
                
                <div>
                  <label className="text-sm text-muted mb-1 block">Email</label>
                  <input
                    type="email"
                    value={editingCreator.email}
                    onChange={(e) => setEditingCreator({...editingCreator, email: e.target.value})}
                    className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:border-muted"
                  />
                </div>
                
                <div>
                  <label className="text-sm text-muted mb-1 block">Lokacija</label>
                  <input
                    type="text"
                    value={editingCreator.location}
                    onChange={(e) => setEditingCreator({...editingCreator, location: e.target.value})}
                    className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:border-muted"
                  />
                </div>
                
                <div>
                  <label className="text-sm text-muted mb-1 block">Bio</label>
                  <textarea
                    value={editingCreator.bio}
                    onChange={(e) => setEditingCreator({...editingCreator, bio: e.target.value})}
                    rows={3}
                    className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:border-muted resize-none"
                  />
                </div>
                
                <div>
                  <label className="text-sm text-muted mb-1 block">Cena (€)</label>
                  <input
                    type="number"
                    value={editingCreator.priceFrom}
                    onChange={(e) => setEditingCreator({...editingCreator, priceFrom: Number(e.target.value)})}
                    className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:border-muted"
                  />
                </div>
                
                <div>
                  <label className="text-sm text-muted mb-1 block">Telefon</label>
                  <input
                    type="text"
                    value={editingCreator.phone || ''}
                    onChange={(e) => setEditingCreator({...editingCreator, phone: e.target.value})}
                    className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:border-muted"
                  />
                </div>
                
                <div>
                  <label className="text-sm text-muted mb-1 block">Instagram</label>
                  <input
                    type="text"
                    value={editingCreator.instagram || ''}
                    onChange={(e) => setEditingCreator({...editingCreator, instagram: e.target.value})}
                    className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:border-muted"
                  />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setEditingCreator(null)}
                    className="flex-1 py-3 border border-border rounded-xl hover:bg-secondary transition-colors"
                  >
                    Otkaži
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors"
                  >
                    Sačuvaj
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
