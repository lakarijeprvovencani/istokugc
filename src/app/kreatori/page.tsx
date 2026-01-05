'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { platforms, languages } from '@/lib/mockData';
import CreatorCard from '@/components/CreatorCard';
import { useDemo } from '@/context/DemoContext';
import { createClient } from '@/lib/supabase/client';

// Serbian pluralization helper for "kreator/kreatora"
const formatCreatorCount = (count: number): string => {
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;
  
  if (count === 1) return '1 kreator';
  if (lastTwoDigits >= 11 && lastTwoDigits <= 19) return `${count} kreatora`;
  if (lastDigit >= 2 && lastDigit <= 4) return `${count} kreatora`;
  return `${count} kreatora`;
};

export default function KreatoriPage() {
  const { currentUser, isLoggedIn, isHydrated, getOwnCreatorStatus, updateCurrentUser } = useDemo();
  
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
  const creatorsPerPage = 12;
  
  // Get creator status for pending check
  const creatorStatus = getOwnCreatorStatus();
  
  // Fetch categories, creators, and subscription status in PARALLEL
  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingCreators(true);
      
      const includeAll = currentUser.type === 'admin';
      
      // Prepare all fetch promises
      const categoriesPromise = fetch('/api/categories')
        .then(res => res.ok ? res.json() : { categories: [] })
        .catch(() => ({ categories: [] }));
      
      const creatorsPromise = fetch(`/api/creators?includeAll=${includeAll}&limit=100`)
        .then(res => res.ok ? res.json() : { creators: [] })
        .catch(() => ({ creators: [] }));
      
      const subscriptionPromise = (async () => {
        if (currentUser.type === 'business' && currentUser.businessId) {
          try {
            const supabase = createClient();
            
            let { data, error } = await supabase
              .from('businesses')
              .select('subscription_status')
              .eq('id', currentUser.businessId)
              .single();
            
            if (error || !data) {
              const result = await supabase
                .from('businesses')
                .select('subscription_status')
                .eq('user_id', currentUser.businessId)
                .single();
              data = result.data;
            }
            
            return data?.subscription_status || null;
          } catch {
            return null;
          }
        }
        return null;
      })();
      
      // Execute ALL in parallel
      const [categoriesData, creatorsData, subscriptionStatus] = await Promise.all([
        categoriesPromise,
        creatorsPromise,
        subscriptionPromise
      ]);
      
      // Update state
      setCategories(categoriesData.categories || []);
      setAllCreators(creatorsData.creators || []);
      
      if (subscriptionStatus) {
        setLiveSubscriptionStatus(subscriptionStatus);
        if (subscriptionStatus !== currentUser.subscriptionStatus && updateCurrentUser) {
          updateCurrentUser({ subscriptionStatus: subscriptionStatus });
        }
      }
      
      setIsCheckingSubscription(false);
      setIsLoadingCreators(false);
    };
    
    fetchData();
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
  
  // Filtered creators - client-side filtering
  const filteredCreators = useMemo(() => {
    let results = allCreators.filter((creator) => {
      // For admins, show all; for others, only approved (already filtered in API)
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
          !(creator.bio || '').toLowerCase().includes(query) &&
          !creator.location.toLowerCase().includes(query)
        ) {
          return false;
        }
      }
      
      // Filter by minimum rating
      if (minRating) {
        const minRatingNum = parseFloat(minRating);
        if ((creator.rating || 0) < minRatingNum) return false;
      }

      return true;
    });
    
    // Sort results
    if (sortBy === 'rating-desc') {
      results.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === 'rating-asc') {
      results.sort((a, b) => (a.rating || 0) - (b.rating || 0));
    } else if (sortBy === 'reviews') {
      results.sort((a, b) => (b.totalReviews || 0) - (a.totalReviews || 0));
    } else if (sortBy === 'price-asc') {
      results.sort((a, b) => a.priceFrom - b.priceFrom);
    } else if (sortBy === 'price-desc') {
      results.sort((a, b) => b.priceFrom - a.priceFrom);
    }
    
    return results;
  }, [allCreators, currentUser.type, selectedCategory, selectedPlatform, selectedLanguage, priceRange, searchQuery, minRating, sortBy]);

  // Paginacija
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
  
  // Check if current user is a creator with pending status
  const isDemoCreator = currentUser.creatorId === '1';
  
  // If current user is a pending/rejected creator, show special screen
  if (currentUser.type === 'creator' && creatorStatus && !isDemoCreator) {
    if (creatorStatus.status === 'pending') {
      return (
        <div className="min-h-screen flex items-center justify-center bg-secondary/30">
          <div className="max-w-md mx-auto px-6 text-center">
            <div className="bg-white rounded-3xl p-10 border border-border shadow-sm">
              <div className="text-5xl mb-6">⏳</div>
              <h1 className="text-2xl font-light mb-3">Profil na čekanju</h1>
              <p className="text-muted mb-8">
                Tvoj profil je trenutno na čekanju odobrenja. Kada bude odobren, moći ćeš da pregledaš druge kreatore.
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
    
    if (creatorStatus.status === 'rejected') {
      return (
        <div className="min-h-screen flex items-center justify-center bg-secondary/30">
          <div className="max-w-md mx-auto px-6 text-center">
            <div className="bg-white rounded-3xl p-10 border border-border shadow-sm">
              <div className="text-5xl mb-6">❌</div>
              <h1 className="text-2xl font-light mb-3">Profil odbijen</h1>
              <p className="text-muted mb-8">
                Nažalost, tvoj profil nije odobren. Molimo te da kontaktiraš podršku za više informacija.
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
    
    if (creatorStatus.status === 'deactivated') {
      return (
        <div className="min-h-screen flex items-center justify-center bg-secondary/30">
          <div className="max-w-md mx-auto px-6 text-center">
            <div className="bg-white rounded-3xl p-10 border border-border shadow-sm">
              <div className="text-5xl mb-6">🚫</div>
              <h1 className="text-2xl font-light mb-3">Profil deaktiviran</h1>
              <p className="text-muted mb-8">
                Tvoj profil je trenutno deaktiviran. Kontaktiraj podršku za reaktivaciju.
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

  // Show subscription wall for non-subscribed business users
  if (currentUser.type === 'business' && !hasActiveSubscription && !isCheckingSubscription) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary/30">
        <div className="max-w-md mx-auto px-6 text-center">
          <div className="bg-white rounded-3xl p-10 border border-border shadow-sm">
            <div className="text-5xl mb-6">🔒</div>
            <h1 className="text-2xl font-light mb-3">Pretplata potrebna</h1>
            <p className="text-muted mb-8">
              Za pristup bazi kreatora potrebna je aktivna pretplata.
            </p>
            <Link 
              href="/pricing"
              className="block w-full py-4 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
            >
              Pogledaj planove
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Show loading while checking auth state
  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary/30">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted">Učitavanje...</p>
        </div>
      </div>
    );
  }

  // Only show login prompt to guests (non-logged in users)
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary/30">
        <div className="max-w-md mx-auto px-6 text-center">
          <div className="bg-white rounded-3xl p-10 border border-border shadow-sm">
            <div className="text-5xl mb-6">🔐</div>
            <h1 className="text-2xl font-light mb-3">Prijavi se</h1>
            <p className="text-muted mb-8">
              Moraš biti prijavljen da bi pregledao kreatore.
            </p>
            <Link 
              href="/login"
              className="block w-full py-4 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors mb-4"
            >
              Prijavi se
            </Link>
            <Link 
              href="/register"
              className="block w-full py-4 border border-border rounded-xl font-medium hover:bg-secondary transition-colors"
            >
              Registruj se
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero section */}
      <div className="bg-secondary/30 py-12">
        <div className="max-w-7xl 2xl:max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12">
          <h1 className="text-4xl lg:text-5xl font-light mb-4">Pretraži kreatore</h1>
          <p className="text-muted text-lg">Pronađi savršenog UGC kreatora za tvoj brend</p>
        </div>
      </div>

      <div className="max-w-7xl 2xl:max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 py-8 lg:py-12">
        <div className="lg:flex lg:gap-12">
          {/* Mobile filters toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden w-full mb-6 py-3 border border-border rounded-xl flex items-center justify-center gap-2 hover:bg-secondary transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            {showFilters ? 'Sakrij filtere' : 'Prikaži filtere'}
          </button>

          {/* Filters sidebar */}
          {showFilters && (
            <aside className="lg:w-64 flex-shrink-0 mb-8 lg:mb-0">
              <div className="bg-white rounded-2xl border border-border p-6 space-y-6 sticky top-24">
                <div className="flex items-center justify-between">
                  <h2 className="font-medium">Filteri</h2>
                  <button
                    onClick={clearFilters}
                    className="text-sm text-muted hover:text-foreground transition-colors"
                  >
                    Očisti
                  </button>
                </div>

                {/* Search */}
                <div>
                  <label className="block text-sm text-muted mb-2">Pretraga</label>
                  <input
                    type="text"
                    placeholder="Ime, lokacija..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2.5 border border-border rounded-xl focus:outline-none focus:border-primary text-sm"
                  />
                </div>

                {/* Category filter */}
                <div>
                  <label className="block text-sm text-muted mb-2">Kategorija</label>
                  <select 
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-4 py-2.5 border border-border rounded-xl focus:outline-none focus:border-primary text-sm appearance-none bg-white"
                  >
                    <option value="">Sve kategorije</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Platform filter */}
                <div>
                  <label className="block text-sm text-muted mb-2">Platforma</label>
                  <select
                    value={selectedPlatform}
                    onChange={(e) => setSelectedPlatform(e.target.value)}
                    className="w-full px-4 py-2.5 border border-border rounded-xl focus:outline-none focus:border-primary text-sm appearance-none bg-white"
                  >
                    <option value="">Sve platforme</option>
                    {platforms.map((platform) => (
                      <option key={platform} value={platform}>{platform}</option>
                    ))}
                  </select>
                </div>

                {/* Language filter */}
                <div>
                  <label className="block text-sm text-muted mb-2">Jezik</label>
                  <select
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    className="w-full px-4 py-2.5 border border-border rounded-xl focus:outline-none focus:border-primary text-sm appearance-none bg-white"
                  >
                    <option value="">Svi jezici</option>
                    {languages.map((lang) => (
                      <option key={lang} value={lang}>{lang}</option>
                    ))}
                  </select>
                </div>

                {/* Price range */}
                <div>
                  <label className="block text-sm text-muted mb-2">Cena (€)</label>
                  <select
                    value={priceRange}
                    onChange={(e) => setPriceRange(e.target.value)}
                    className="w-full px-4 py-2.5 border border-border rounded-xl focus:outline-none focus:border-primary text-sm appearance-none bg-white"
                  >
                    <option value="">Bilo koja cena</option>
                    <option value="0-50">Do €50</option>
                    <option value="50-100">€50 - €100</option>
                    <option value="100-200">€100 - €200</option>
                    <option value="200-500">€200 - €500</option>
                    <option value="500-">€500+</option>
                  </select>
                </div>

                {/* Min rating */}
                <div>
                  <label className="block text-sm text-muted mb-2">Minimalna ocena</label>
                  <select
                    value={minRating}
                    onChange={(e) => setMinRating(e.target.value)}
                    className="w-full px-4 py-2.5 border border-border rounded-xl focus:outline-none focus:border-primary text-sm appearance-none bg-white"
                  >
                    <option value="">Bilo koja ocena</option>
                    <option value="4.5">4.5+ ⭐</option>
                    <option value="4">4+ ⭐</option>
                    <option value="3.5">3.5+ ⭐</option>
                    <option value="3">3+ ⭐</option>
                  </select>
                </div>
              </div>
            </aside>
          )}

          {/* Main content */}
          <main className="flex-1 min-w-0">
            {/* Results header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <p className="text-muted text-sm">
                {isLoadingCreators ? (
                  'Učitavanje...'
                ) : (
                  <>Prikazano <span className="font-medium text-foreground">{paginatedCreators.length}</span> od <span className="font-medium text-foreground">{formatCreatorCount(filteredCreators.length)}</span></>
                )}
              </p>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-border rounded-xl focus:outline-none focus:border-primary text-sm appearance-none bg-white w-full sm:w-auto"
              >
                <option value="">Sortiraj po</option>
                <option value="rating-desc">Ocena (najviša)</option>
                <option value="rating-asc">Ocena (najniža)</option>
                <option value="reviews">Broj recenzija</option>
                <option value="price-asc">Cena (najniža)</option>
                <option value="price-desc">Cena (najviša)</option>
              </select>
            </div>

            {/* Results */}
            {isLoadingCreators ? (
              <div className="text-center py-20">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <h3 className="text-lg font-medium mb-2">Učitavamo kreatore...</h3>
                <p className="text-muted">Molimo sačekajte</p>
              </div>
            ) : filteredCreators.length > 0 ? (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                  {paginatedCreators.map((creator, index) => (
                    <CreatorCard key={creator.id} creator={creator} priority={index < 6} />
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
                              {/* Show ellipsis if there's a gap */}
                              {index > 0 && page - arr[index - 1] > 1 && (
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
                    
                    {/* Page info for mobile */}
                    <p className="text-sm text-muted sm:hidden">
                      Stranica {currentPage} od {totalPages}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-20">
                <div className="text-6xl mb-6">🔍</div>
                <h3 className="text-xl font-medium mb-2">Nema rezultata</h3>
                <p className="text-muted mb-6">Pokušaj sa drugim filterima</p>
                <button
                  onClick={clearFilters}
                  className="px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
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
