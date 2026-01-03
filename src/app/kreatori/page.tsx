'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { platforms, languages } from '@/lib/mockData';
import CreatorCard from '@/components/CreatorCard';
import { useDemo } from '@/context/DemoContext';
import { createClient } from '@/lib/supabase/client';

export default function KreatoriPage() {
  const { currentUser, isLoggedIn, getOwnCreatorStatus, updateCurrentUser } = useDemo();
  
  // ALL HOOKS MUST BE AT THE TOP - before any conditional returns
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [priceRange, setPriceRange] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [minRating, setMinRating] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('');
  const [showFilters, setShowFilters] = useState<boolean>(true);
  const [liveSubscriptionStatus, setLiveSubscriptionStatus] = useState<string | null>(null);
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(true);
  const [allCreators, setAllCreators] = useState<any[]>([]);
  const [isLoadingCreators, setIsLoadingCreators] = useState(true);
  
  // Categories from database
  const [categories, setCategories] = useState<string[]>([]);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const creatorsPerPage = 12; // 12 kreatora po stranici
  
  // Get creator status for pending check
  const creatorStatus = getOwnCreatorStatus();
  
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
      }
    };
    
    fetchCategories();
  }, []);
  
  // Fetch creators from Supabase
  useEffect(() => {
    const fetchCreators = async () => {
      try {
        const includeAll = currentUser.type === 'admin';
        const response = await fetch(`/api/creators?includeAll=${includeAll}`);
        if (response.ok) {
          const data = await response.json();
          setAllCreators(data.creators || []);
        }
      } catch (error) {
        console.error('Error fetching creators:', error);
      } finally {
        setIsLoadingCreators(false);
      }
    };
    
    fetchCreators();
  }, [currentUser.type]);
  
  // Fetch live subscription status from Supabase for business users
  useEffect(() => {
    const checkSubscription = async () => {
      if (currentUser.type === 'business' && currentUser.businessId) {
        try {
          const supabase = createClient();
          
          // Try to find business by id first, then by user_id if not found
          let { data, error } = await supabase
            .from('businesses')
            .select('subscription_status')
            .eq('id', currentUser.businessId)
            .single();
          
          // If not found by id, try by user_id (in case businessId is actually user_id)
          if (error || !data) {
            const result = await supabase
              .from('businesses')
              .select('subscription_status')
              .eq('user_id', currentUser.businessId)
              .single();
            data = result.data;
            error = result.error;
          }
          
          if (!error && data) {
            console.log('Live subscription status:', data.subscription_status);
            setLiveSubscriptionStatus(data.subscription_status);
            // Also update the context if status changed
            if (data.subscription_status !== currentUser.subscriptionStatus && updateCurrentUser) {
              updateCurrentUser({ subscriptionStatus: data.subscription_status });
            }
          } else {
            console.error('Error fetching subscription status:', error);
          }
        } catch (err) {
          console.error('Error checking subscription:', err);
        }
      }
      setIsCheckingSubscription(false);
    };
    
    checkSubscription();
  }, [currentUser.type, currentUser.businessId, currentUser.subscriptionStatus, updateCurrentUser]);
  
  // Check if business user has active subscription - use live status if available
  const hasActiveSubscription = useMemo(() => {
    if (currentUser.type === 'admin' || currentUser.type === 'creator') return true;
    if (currentUser.type === 'business') {
      // Use live status if we have it, otherwise fall back to context value
      const statusToCheck = liveSubscriptionStatus || currentUser.subscriptionStatus;
      return statusToCheck === 'active';
    }
    return false; // guest
  }, [currentUser, liveSubscriptionStatus]);
  
  // Hide filters on mobile by default
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setShowFilters(false);
      }
    };
    // Check on mount
    handleResize();
  }, []);
  
  // Helper to get creator rating - now uses data from API
  const getCreatorRating = (creatorId: string): number => {
    const creator = allCreators.find(c => c.id === creatorId);
    return creator?.rating || 0;
  };
  
  const getCreatorReviewCount = (creatorId: string): number => {
    const creator = allCreators.find(c => c.id === creatorId);
    return creator?.totalReviews || 0;
  };
  
  // Filtered creators - must be declared as a hook before conditional returns
  const filteredCreators = useMemo(() => {
    let results = allCreators.filter((creator) => {
      // For admins, show all (already filtered in API)
      // For others, only show approved (already handled in API)
      if (currentUser.type !== 'admin' && creator.status !== 'approved') return false;
      
      if (selectedCategory && !creator.categories.includes(selectedCategory)) return false;
      if (selectedPlatform && !creator.platforms.includes(selectedPlatform)) return false;
      if (selectedLanguage && !creator.languages.includes(selectedLanguage)) return false;
      
      if (priceRange) {
        const [min, max] = priceRange.split('-').map(Number);
        if (max) {
          if (creator.priceFrom < min || creator.priceFrom > max) return false;
        } else {
          if (creator.priceFrom < min) return false;
        }
      }

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !creator.name.toLowerCase().includes(query) &&
          !creator.bio.toLowerCase().includes(query) &&
          !creator.location.toLowerCase().includes(query)
        ) {
          return false;
        }
      }
      
      // Filter by minimum rating
      if (minRating) {
        const creatorRating = getCreatorRating(creator.id);
        const minRatingNum = parseFloat(minRating);
        if (creatorRating < minRatingNum) return false;
      }

      return true;
    });
    
    // Sort results
    if (sortBy === 'rating-desc') {
      results.sort((a, b) => getCreatorRating(b.id) - getCreatorRating(a.id));
    } else if (sortBy === 'rating-asc') {
      results.sort((a, b) => getCreatorRating(a.id) - getCreatorRating(b.id));
    } else if (sortBy === 'reviews') {
      results.sort((a, b) => getCreatorReviewCount(b.id) - getCreatorReviewCount(a.id));
    } else if (sortBy === 'price-asc') {
      results.sort((a, b) => a.priceFrom - b.priceFrom);
    } else if (sortBy === 'price-desc') {
      results.sort((a, b) => b.priceFrom - a.priceFrom);
    }
    
    return results;
  }, [allCreators, currentUser.type, selectedCategory, selectedPlatform, selectedLanguage, priceRange, searchQuery, minRating, sortBy, getCreatorRating, getCreatorReviewCount]);

  // Paginacija - prikaži samo kreatore za trenutnu stranicu
  const totalPages = Math.ceil(filteredCreators.length / creatorsPerPage);
  const paginatedCreators = useMemo(() => {
    const startIndex = (currentPage - 1) * creatorsPerPage;
    return filteredCreators.slice(startIndex, startIndex + creatorsPerPage);
  }, [filteredCreators, currentPage, creatorsPerPage]);

  // Reset na prvu stranicu kad se promene filteri
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedPlatform, selectedLanguage, priceRange, searchQuery, minRating, sortBy]);

  const clearFilters = () => {
    setSelectedCategory('');
    setSelectedPlatform('');
    setSelectedLanguage('');
    setPriceRange('');
    setSearchQuery('');
    setMinRating('');
    setSortBy('');
  };
  
  // Show loading while checking subscription for business users
  if (currentUser.type === 'business' && isCheckingSubscription) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-secondary/30">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted">Provera pretplate...</p>
        </div>
      </div>
    );
  }
  
  // Show subscription required screen for business users with expired subscription
  if (currentUser.type === 'business' && !hasActiveSubscription) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-secondary/30">
        <div className="max-w-md mx-auto px-6 text-center">
          <div className="bg-white rounded-3xl border border-border p-8 shadow-sm">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            
            <h1 className="text-2xl font-light mb-3">Pretplata je istekla</h1>
            <p className="text-muted mb-8">
              Vaša pretplata nije aktivna. Obnovite pretplatu da biste pristupili svim kreatorima i njihovim kontakt informacijama.
            </p>
            
            <div className="space-y-3">
              <Link
                href="/pricing"
                className="block w-full py-3.5 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
              >
                Obnovi pretplatu
              </Link>
              <Link
                href="/dashboard"
                className="block w-full py-3.5 border border-border rounded-xl font-medium hover:bg-secondary transition-colors"
              >
                Nazad na Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Show login required for guests
  if (!isLoggedIn) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-secondary/30">
        <div className="max-w-md mx-auto px-6 text-center">
          <div className="bg-white rounded-3xl border border-border p-8 shadow-sm">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            
            <h1 className="text-2xl font-light mb-3">Prijava potrebna</h1>
            <p className="text-muted mb-8">
              Prijavite se ili kreirajte nalog da biste videli sve kreatore.
            </p>
            
            <div className="space-y-3">
              <Link 
                href="/login"
                className="block w-full py-4 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
              >
                Prijavi se
              </Link>
              <Link 
                href="/register/biznis"
                className="block w-full py-4 border border-border rounded-xl font-medium hover:bg-secondary transition-colors"
              >
                Registruj se kao brend
              </Link>
              <Link 
                href="/register/kreator"
                className="block w-full py-3 text-sm text-muted hover:text-foreground transition-colors"
              >
                Ili postani kreator →
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Check if this is demo creator (ID "1" - Marija Petrović)
  // Demo creators bypass pending/rejected checks for client presentations
  const isDemoCreator = currentUser.creatorId === '1';

  // If creator is pending or rejected, redirect to dashboard (they'll see proper screen there)
  // Skip this check for demo creators
  if (currentUser.type === 'creator' && creatorStatus && !isDemoCreator) {
    if (creatorStatus.status === 'pending' || creatorStatus.status === 'rejected') {
      return (
        <div className="min-h-screen flex items-center justify-center bg-secondary/30">
          <div className="max-w-md mx-auto px-6 text-center">
            <div className="bg-white rounded-3xl p-10 border border-border shadow-sm">
              <div className="text-5xl mb-6">⏳</div>
              <h1 className="text-2xl font-light mb-3">Profil na čekanju</h1>
              <p className="text-muted mb-8">
                Vaš profil još uvek nije odobren. Dok čekate odobrenje, ne možete pregledati druge kreatore.
              </p>
              <Link 
                href="/dashboard"
                className="block w-full py-4 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
              >
                Nazad na dashboard
              </Link>
            </div>
          </div>
        </div>
      );
    }
  }

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-secondary py-10 sm:py-12 lg:py-16">
        <div className="max-w-7xl 2xl:max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-light mb-2 sm:mb-4">Pretraži kreatore</h1>
          <p className="text-muted text-sm sm:text-base max-w-xl">
            Pronađi savršenog UGC kreatora za tvoj brend
          </p>
        </div>
      </section>

      <div className="max-w-7xl 2xl:max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 py-8 lg:py-12">
        <div className="lg:flex lg:gap-12">
          {/* Mobile filter toggle */}
          <div className="lg:hidden mb-6">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-white border border-border rounded-xl text-sm font-medium hover:bg-secondary transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              {showFilters ? 'Sakrij filtere' : 'Prikaži filtere'}
            </button>
          </div>
          
          {/* Sidebar filters */}
          <aside className={`
            ${showFilters ? 'block' : 'hidden'} 
            w-full lg:w-64 
            flex-shrink-0 
            mb-8 lg:mb-0
            transition-all duration-300
          `}>
            <div className="w-full lg:w-64 lg:sticky lg:top-28 bg-white lg:bg-transparent p-4 lg:p-0 rounded-2xl lg:rounded-none border lg:border-0 border-border">
              {/* Search */}
              <div className="mb-8">
                <label className="text-sm text-muted mb-2 block">Pretraga</label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Ime, lokacija..."
                  className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:border-muted"
                />
              </div>

              {/* Category */}
              <div className="mb-8">
                <label className="text-sm text-muted mb-2 block">Kategorija</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:border-muted bg-white"
                >
                  <option value="">Sve kategorije</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Platform */}
              <div className="mb-8">
                <label className="text-sm text-muted mb-2 block">Platforma</label>
                <select
                  value={selectedPlatform}
                  onChange={(e) => setSelectedPlatform(e.target.value)}
                  className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:border-muted bg-white"
                >
                  <option value="">Sve platforme</option>
                  {platforms.map((plat) => (
                    <option key={plat} value={plat}>{plat}</option>
                  ))}
                </select>
              </div>

              {/* Language */}
              <div className="mb-8">
                <label className="text-sm text-muted mb-2 block">Jezik</label>
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:border-muted bg-white"
                >
                  <option value="">Svi jezici</option>
                  {languages.map((lang) => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
              </div>

              {/* Price Range */}
              <div className="mb-8">
                <label className="text-sm text-muted mb-2 block">Cenovni rang</label>
                <select
                  value={priceRange}
                  onChange={(e) => setPriceRange(e.target.value)}
                  className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:border-muted bg-white"
                >
                  <option value="">Svi cenovni rangovi</option>
                  <option value="0-100">Do €100</option>
                  <option value="100-200">€100 - €200</option>
                  <option value="200-300">€200 - €300</option>
                  <option value="300-">€300+</option>
                </select>
              </div>

              {/* Rating Filter */}
              <div className="mb-8">
                <label className="text-sm text-muted mb-2 block">Minimalna ocena</label>
                <div className="relative">
                  <select
                    value={minRating}
                    onChange={(e) => setMinRating(e.target.value)}
                    className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:border-muted bg-white appearance-none"
                  >
                    <option value="">Sve ocene</option>
                    <option value="5">5.0 ⭐</option>
                    <option value="4.5">4.5+ ⭐</option>
                    <option value="4">4.0+ ⭐</option>
                    <option value="3.5">3.5+ ⭐</option>
                    <option value="3">3.0+ ⭐</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg className="w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                {/* Rating preview with stars */}
                {minRating && (
                  <div className="mt-2 flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        viewBox="0 0 24 24"
                        fill={star <= parseFloat(minRating) ? '#f59e0b' : 'none'}
                        stroke={star <= parseFloat(minRating) ? '#f59e0b' : '#e5e5e5'}
                        strokeWidth={2}
                        className="w-4 h-4"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                        />
                      </svg>
                    ))}
                    <span className="text-sm text-muted ml-1">{minRating}+</span>
                  </div>
                )}
              </div>

              {/* Clear filters */}
              <button
                onClick={clearFilters}
                className="w-full py-3 text-sm text-muted hover:text-foreground border border-border rounded-xl hover:bg-secondary transition-colors"
              >
                Očisti filtere
              </button>
              
              {/* Hide filters button - mobile only */}
              <button
                onClick={() => setShowFilters(false)}
                className="lg:hidden w-full mt-4 py-3 text-sm font-medium bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors"
              >
                Primeni filtere
              </button>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0">
            {/* Results count & sorting */}
            <div className="mb-6 lg:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {/* Filter toggle button - desktop only */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`hidden lg:flex p-2.5 rounded-xl border transition-all ${
                    showFilters 
                      ? 'bg-primary text-white border-primary' 
                      : 'bg-white text-muted border-border hover:bg-secondary hover:text-foreground'
                  }`}
                  title={showFilters ? 'Sakrij filtere' : 'Prikaži filtere'}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                </button>
                <p className="text-muted text-sm sm:text-base">
                  {isLoadingCreators ? (
                    <span className="text-muted">Učitavanje...</span>
                  ) : (
                    <>Prikazano <span className="font-medium text-foreground">{paginatedCreators.length}</span> od <span className="font-medium text-foreground">{filteredCreators.length}</span> kreatora</>
                  )}
                </p>
              </div>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full sm:w-auto px-4 py-2.5 border border-border rounded-xl focus:outline-none focus:border-muted bg-white text-sm"
              >
                <option value="">Sortiraj po</option>
                <option value="rating-desc">Najviša ocena</option>
                <option value="rating-asc">Najniža ocena</option>
                <option value="reviews">Najviše recenzija</option>
                <option value="price-asc">Cena: niska → visoka</option>
                <option value="price-desc">Cena: visoka → niska</option>
              </select>
            </div>

            {/* Grid */}
            {isLoadingCreators ? (
              <div className="text-center py-20">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <h3 className="text-lg font-medium mb-2">Učitavamo kreatore...</h3>
                <p className="text-muted">Molimo sačekajte</p>
              </div>
            ) : filteredCreators.length > 0 ? (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                  {paginatedCreators.map((creator) => (
                    <CreatorCard key={creator.id} creator={creator} />
                  ))}
                </div>
                
                {/* Paginacija */}
                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
                    <div className="flex items-center gap-2">
                      {/* Previous button */}
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 border border-border rounded-lg hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      
                      {/* Page numbers */}
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                          .filter(page => {
                            // Show first, last, and pages around current
                            if (page === 1 || page === totalPages) return true;
                            if (Math.abs(page - currentPage) <= 1) return true;
                            return false;
                          })
                          .map((page, index, arr) => (
                            <div key={page} className="flex items-center">
                              {/* Add ellipsis if there's a gap */}
                              {index > 0 && arr[index - 1] !== page - 1 && (
                                <span className="px-2 text-muted">...</span>
                              )}
                              <button
                                onClick={() => setCurrentPage(page)}
                                className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                                  currentPage === page
                                    ? 'bg-primary text-white'
                                    : 'hover:bg-secondary'
                                }`}
                              >
                                {page}
                              </button>
                            </div>
                          ))}
                      </div>
                      
                      {/* Next button */}
                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 border border-border rounded-lg hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                    
                    <p className="text-sm text-muted">
                      Stranica {currentPage} od {totalPages}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-20">
                <div className="text-4xl mb-4">🔍</div>
                <h3 className="text-xl font-medium mb-2">Nema rezultata</h3>
                <p className="text-muted mb-6">Pokušaj sa drugim filterima</p>
                <button
                  onClick={clearFilters}
                  className="px-6 py-3 bg-primary text-white rounded-full text-sm hover:bg-primary/90 transition-colors"
                >
                  Očisti filtere
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
