'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useDemo } from '@/context/DemoContext';
import { platforms } from '@/lib/mockData';

interface Job {
  id: string;
  businessId: string;
  businessName: string;
  businessLogo: string | null;
  title: string;
  description: string;
  category: string;
  platforms: string[];
  budgetType: 'fixed' | 'hourly';
  budgetMin: number | null;
  budgetMax: number | null;
  duration: string | null;
  experienceLevel: string | null;
  status: string;
  createdAt: string;
}

export default function PosloviPage() {
  const { currentUser, isLoggedIn, isHydrated } = useDemo();
  
  // State
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);
  
  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('');
  const [budgetRange, setBudgetRange] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showFilters, setShowFilters] = useState<boolean>(true);
  
  // Sorting & Pagination
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const JOBS_PER_PAGE = 10;
  
  // Fetch categories
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
  
  // Fetch jobs
  useEffect(() => {
    const fetchJobs = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/jobs?status=open');
        if (response.ok) {
          const data = await response.json();
          setJobs(data.jobs || []);
        }
      } catch (error) {
        console.error('Error fetching jobs:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchJobs();
  }, []);
  
  // Hide filters on mobile by default
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setShowFilters(false);
      }
    };
    handleResize();
  }, []);
  
  // Filtered and sorted jobs
  const filteredJobs = useMemo(() => {
    let result = jobs.filter((job) => {
      if (selectedCategory && job.category !== selectedCategory) return false;
      if (selectedPlatform && !job.platforms.includes(selectedPlatform)) return false;
      
      if (budgetRange) {
        const [min, max] = budgetRange.split('-').map(Number);
        const jobBudget = job.budgetMax || job.budgetMin || 0;
        if (max) {
          if (jobBudget < min || jobBudget > max) return false;
        } else {
          if (jobBudget < min) return false;
        }
      }
      
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !job.title.toLowerCase().includes(query) &&
          !job.description.toLowerCase().includes(query) &&
          !job.businessName.toLowerCase().includes(query)
        ) {
          return false;
        }
      }
      
      return true;
    });
    
    // Sort by date
    result.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });
    
    return result;
  }, [jobs, selectedCategory, selectedPlatform, budgetRange, searchQuery, sortOrder]);
  
  // Paginated jobs
  const totalPages = Math.ceil(filteredJobs.length / JOBS_PER_PAGE);
  const paginatedJobs = useMemo(() => {
    const start = (currentPage - 1) * JOBS_PER_PAGE;
    return filteredJobs.slice(start, start + JOBS_PER_PAGE);
  }, [filteredJobs, currentPage]);
  
  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedPlatform, budgetRange, searchQuery, sortOrder]);
  
  const clearFilters = () => {
    setSelectedCategory('');
    setSelectedPlatform('');
    setBudgetRange('');
    setSearchQuery('');
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Danas';
    if (diffDays === 1) return 'Juče';
    if (diffDays < 7) return `Pre ${diffDays} dana`;
    if (diffDays < 30) return `Pre ${Math.floor(diffDays / 7)} nedelja`;
    return date.toLocaleDateString('sr-RS');
  };
  
  // Format budget
  const formatBudget = (job: Job) => {
    if (!job.budgetMin && !job.budgetMax) return 'Po dogovoru';
    if (job.budgetMin && job.budgetMax) {
      if (job.budgetMin === job.budgetMax) return `€${job.budgetMin}`;
      return `€${job.budgetMin} - €${job.budgetMax}`;
    }
    if (job.budgetMin) return `Od €${job.budgetMin}`;
    if (job.budgetMax) return `Do €${job.budgetMax}`;
    return 'Po dogovoru';
  };
  
  // Experience level label
  const getExperienceLabel = (level: string | null) => {
    switch (level) {
      case 'beginner': return 'Početnik';
      case 'intermediate': return 'Srednji nivo';
      case 'expert': return 'Ekspert';
      default: return null;
    }
  };

  // Show login prompt to guests
  if (isHydrated && !isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary/30">
        <div className="max-w-md mx-auto px-6 text-center">
          <div className="bg-white rounded-3xl p-10 border border-border shadow-sm">
            <div className="text-5xl mb-6">💼</div>
            <h1 className="text-2xl font-light mb-3">Prijavi se</h1>
            <p className="text-muted mb-8">
              Moraš biti prijavljen da bi pregledao poslove.
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

  // Only business, creator and admin can see jobs
  if (isHydrated && currentUser.type !== 'business' && currentUser.type !== 'creator' && currentUser.type !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary/30">
        <div className="max-w-md mx-auto px-6 text-center">
          <div className="bg-white rounded-3xl p-10 border border-border shadow-sm">
            <div className="text-5xl mb-6">🔒</div>
            <h1 className="text-2xl font-light mb-3">Pristup ograničen</h1>
            <p className="text-muted mb-8">
              Poslovi su dostupni samo za kreatore i biznise.
            </p>
            <Link 
              href="/"
              className="block w-full py-4 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
            >
              Nazad na početnu
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl lg:text-5xl font-light mb-4">Poslovi</h1>
              <p className="text-muted text-lg">Pronađi savršen projekat za sebe</p>
            </div>
            {currentUser.type === 'business' && (
              <Link
                href="/dashboard?tab=poslovi&action=new"
                className="hidden sm:flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Dodaj posao
              </Link>
            )}
          </div>
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
                    placeholder="Naziv, opis..."
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

                {/* Budget range */}
                <div>
                  <label className="block text-sm text-muted mb-2">Budžet (€)</label>
                  <select
                    value={budgetRange}
                    onChange={(e) => setBudgetRange(e.target.value)}
                    className="w-full px-4 py-2.5 border border-border rounded-xl focus:outline-none focus:border-primary text-sm appearance-none bg-white"
                  >
                    <option value="">Bilo koji budžet</option>
                    <option value="0-100">Do €100</option>
                    <option value="100-300">€100 - €300</option>
                    <option value="300-500">€300 - €500</option>
                    <option value="500-1000">€500 - €1000</option>
                    <option value="1000-">€1000+</option>
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
                {isLoading ? (
                  'Učitavanje...'
                ) : (
                  <>Pronađeno <span className="font-medium text-foreground">{filteredJobs.length}</span> poslova</>
                )}
              </p>
              
              <div className="flex items-center gap-3">
                {/* Sort dropdown */}
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
                  className="px-4 py-2 border border-border rounded-xl focus:outline-none focus:border-primary text-sm bg-white"
                >
                  <option value="newest">Najnoviji</option>
                  <option value="oldest">Najstariji</option>
                </select>
                
                {/* Mobile add job button */}
                {currentUser.type === 'business' && (
                  <Link
                    href="/dashboard?tab=poslovi&action=new"
                    className="sm:hidden flex items-center justify-center gap-2 py-3 px-4 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </Link>
                )}
              </div>
            </div>

            {/* Jobs list */}
            {isLoading ? (
              <div className="text-center py-20">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <h3 className="text-lg font-medium mb-2">Učitavamo poslove...</h3>
                <p className="text-muted">Molimo sačekajte</p>
              </div>
            ) : filteredJobs.length > 0 ? (
              <div className="space-y-4">
                {paginatedJobs.map((job) => (
                  <Link 
                    key={job.id}
                    href={`/poslovi/${job.id}`}
                    className="block bg-white rounded-2xl border border-border p-6 hover:border-muted/50 hover:shadow-lg transition-all"
                  >
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-lg mb-1 truncate">{job.title}</h3>
                        <p className="text-sm text-muted">{job.businessName}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="font-medium text-lg">{formatBudget(job)}</div>
                        <div className="text-xs text-muted">{job.budgetType === 'hourly' ? 'po satu' : 'fiksno'}</div>
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted mb-4 line-clamp-2">{job.description}</p>
                    
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      <span className="text-xs px-3 py-1 bg-secondary rounded-full">{job.category}</span>
                      {job.platforms.slice(0, 3).map((platform) => (
                        <span key={platform} className="text-xs px-3 py-1 bg-secondary rounded-full text-muted">
                          {platform}
                        </span>
                      ))}
                      {job.experienceLevel && (
                        <span className="text-xs px-3 py-1 bg-primary/10 text-primary rounded-full">
                          {getExperienceLabel(job.experienceLevel)}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-muted">
                      <span>{formatDate(job.createdAt)}</span>
                      {job.duration && <span>Trajanje: {job.duration}</span>}
                    </div>
                  </Link>
                ))}
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-8">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 border border-border rounded-xl hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    
                    {/* Page numbers */}
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(page => {
                          // Show first, last, current, and neighbors
                          if (page === 1 || page === totalPages) return true;
                          if (Math.abs(page - currentPage) <= 1) return true;
                          return false;
                        })
                        .map((page, idx, arr) => (
                          <span key={page} className="flex items-center">
                            {idx > 0 && arr[idx - 1] !== page - 1 && (
                              <span className="px-2 text-muted">...</span>
                            )}
                            <button
                              onClick={() => setCurrentPage(page)}
                              className={`w-10 h-10 rounded-xl font-medium transition-colors ${
                                currentPage === page
                                  ? 'bg-primary text-white'
                                  : 'hover:bg-secondary'
                              }`}
                            >
                              {page}
                            </button>
                          </span>
                        ))}
                    </div>
                    
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 border border-border rounded-xl hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="text-6xl mb-6">💼</div>
                <h3 className="text-xl font-medium mb-2">Nema poslova</h3>
                <p className="text-muted mb-6">
                  {searchQuery || selectedCategory || selectedPlatform || budgetRange
                    ? 'Pokušaj sa drugim filterima'
                    : 'Trenutno nema otvorenih poslova'}
                </p>
                {(searchQuery || selectedCategory || selectedPlatform || budgetRange) && (
                  <button
                    onClick={clearFilters}
                    className="px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
                  >
                    Očisti filtere
                  </button>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

