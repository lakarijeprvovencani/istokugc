'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useDemo } from '@/context/DemoContext';

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
  applicationDeadline: string | null;
  isExpired: boolean;
  status: string;
  createdAt: string;
}

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { currentUser, isLoggedIn, isHydrated } = useDemo();
  const jobId = params.id as string;
  
  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasApplied, setHasApplied] = useState(false);
  const [myApplication, setMyApplication] = useState<any>(null);
  
  // Saved job state
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Apply form
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [proposedPrice, setProposedPrice] = useState('');
  const [estimatedDuration, setEstimatedDuration] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);
  
  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  // Fetch job details - includeAll to see expired jobs too
  useEffect(() => {
    const fetchJob = async () => {
      try {
        // Use includeAll to also fetch expired jobs (so users can see job details if they've applied)
        const response = await fetch(`/api/jobs?includeAll=true`);
        if (response.ok) {
          const data = await response.json();
          // Find job that is open OR job where user has already applied
          const foundJob = data.jobs?.find((j: Job) => j.id === jobId && (j.status === 'open' || j.status === 'closed'));
          if (foundJob) {
            setJob(foundJob);
          }
        }
      } catch (error) {
        console.error('Error fetching job:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (jobId) {
      fetchJob();
    }
  }, [jobId]);
  
  // Check if job is saved
  useEffect(() => {
    const checkSaved = async () => {
      if (!currentUser.creatorId || !jobId) return;
      
      try {
        const response = await fetch(`/api/saved-jobs?creatorId=${currentUser.creatorId}`);
        if (response.ok) {
          const data = await response.json();
          const saved = data.savedJobs?.some((sj: any) => sj.job?.id === jobId);
          setIsSaved(saved);
        }
      } catch (error) {
        console.error('Error checking saved status:', error);
      }
    };
    
    checkSaved();
  }, [currentUser.creatorId, jobId]);
  
  // Handle save/unsave
  const handleToggleSave = async () => {
    if (!currentUser.creatorId || !jobId) return;
    
    setIsSaving(true);
    try {
      if (isSaved) {
        // Unsave
        await fetch(`/api/saved-jobs?creatorId=${currentUser.creatorId}&jobId=${jobId}`, {
          method: 'DELETE',
        });
        setIsSaved(false);
      } else {
        // Save
        await fetch('/api/saved-jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ creatorId: currentUser.creatorId, jobId }),
        });
        setIsSaved(true);
      }
    } catch (error) {
      console.error('Error toggling save:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Check if creator already applied
  useEffect(() => {
    const checkApplication = async () => {
      if (!currentUser.creatorId || !jobId) return;
      
      try {
        const response = await fetch(`/api/job-applications?jobId=${jobId}&creatorId=${currentUser.creatorId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.applications && data.applications.length > 0) {
            setHasApplied(true);
            setMyApplication(data.applications[0]);
          }
        }
      } catch (error) {
        console.error('Error checking application:', error);
      }
    };
    
    if (isHydrated && currentUser.type === 'creator') {
      checkApplication();
    }
  }, [isHydrated, currentUser.creatorId, currentUser.type, jobId]);
  
  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    
    if (!coverLetter.trim()) {
      setSubmitError('Molimo unesite propratno pismo');
      return;
    }
    
    if (!proposedPrice || parseInt(proposedPrice) <= 0) {
      setSubmitError('Molimo unesite validnu cenu');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/job-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId,
          creatorId: currentUser.creatorId,
          coverLetter: coverLetter.trim(),
          proposedPrice: parseInt(proposedPrice),
          estimatedDuration: estimatedDuration || null,
        }),
      });
      
      if (response.ok) {
        setSubmitSuccess(true);
        setHasApplied(true);
        setTimeout(() => {
          setShowApplyModal(false);
          setSubmitSuccess(false);
        }, 2000);
      } else {
        const data = await response.json();
        setSubmitError(data.error || 'Greška pri slanju prijave');
      }
    } catch (error) {
      console.error('Error applying:', error);
      setSubmitError('Greška pri slanju prijave');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleWithdraw = async () => {
    if (!myApplication) return;
    
    try {
      const response = await fetch(`/api/job-applications?applicationId=${myApplication.id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setHasApplied(false);
        setMyApplication(null);
      }
    } catch (error) {
      console.error('Error withdrawing application:', error);
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('sr-RS', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };
  
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
  
  const getExperienceLabel = (level: string | null) => {
    switch (level) {
      case 'beginner': return 'Početnik';
      case 'intermediate': return 'Srednji nivo';
      case 'expert': return 'Ekspert';
      default: return 'Bilo koji nivo';
    }
  };
  
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return { text: 'Na čekanju', color: 'bg-amber-100 text-amber-700' };
      case 'accepted': return { text: 'Prihvaćeno', color: 'bg-success/10 text-success' };
      case 'rejected': return { text: 'Odbijeno', color: 'bg-error/10 text-error' };
      case 'withdrawn': return { text: 'Povučeno', color: 'bg-muted/20 text-muted' };
      default: return { text: status, color: 'bg-secondary text-muted' };
    }
  };

  // Auth check
  if (isHydrated && !isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary/30">
        <div className="max-w-md mx-auto px-6 text-center">
          <div className="bg-white rounded-3xl p-10 border border-border shadow-sm">
            <div className="text-5xl mb-6">💼</div>
            <h1 className="text-2xl font-light mb-3">Prijavi se</h1>
            <p className="text-muted mb-8">Moraš biti prijavljen da bi video detalje posla.</p>
            <Link href="/login" className="block w-full py-4 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors">
              Prijavi se
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted">Učitavanje posla...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary/30">
        <div className="max-w-md mx-auto px-6 text-center">
          <div className="bg-white rounded-3xl p-10 border border-border shadow-sm">
            <div className="text-5xl mb-6">🔍</div>
            <h1 className="text-2xl font-light mb-3">Posao nije pronađen</h1>
            <p className="text-muted mb-8">Ovaj posao ne postoji ili je uklonjen.</p>
            <Link href="/poslovi" className="block w-full py-4 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors">
              Nazad na poslove
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/30">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-12 py-8 lg:py-12">
        {/* Back link */}
        <Link href="/poslovi" className="inline-flex items-center gap-2 text-muted hover:text-foreground transition-colors mb-6">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Nazad na poslove
        </Link>
        
        {/* Main content */}
        <div className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm">
          {/* Header */}
          <div className="p-6 sm:p-8">
            {/* Top row: Company info + Budget */}
            <div className="flex items-start justify-between gap-4 mb-6">
              {/* Company */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center flex-shrink-0 overflow-hidden border border-border/50">
                  {job.businessLogo ? (
                    <Image src={job.businessLogo} alt="" width={56} height={56} className="object-cover" />
                  ) : (
                    <span className="text-xl font-semibold text-primary">
                      {job.businessName?.charAt(0)?.toUpperCase() || 'B'}
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-medium text-lg">{job.businessName}</p>
                </div>
              </div>
              
              {/* Budget */}
              <div className="text-right flex-shrink-0 bg-gradient-to-br from-primary/5 to-transparent p-4 rounded-xl border border-primary/10">
                <div className="text-2xl font-semibold text-primary">{formatBudget(job)}</div>
                {/* Only show type if there's an actual price range */}
                {job.budgetMin && job.budgetMax && (
                  <div className="text-xs text-muted uppercase tracking-wide mt-0.5">
                    {job.budgetType === 'hourly' ? 'po satu' : 'fiksno'}
                  </div>
                )}
              </div>
            </div>
            
            {/* Title */}
            <h1 className="text-2xl sm:text-3xl font-semibold mb-2">{job.title}</h1>
            
            {/* Published date below title */}
            <p className="text-sm text-muted flex items-center gap-1.5 mb-4">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Objavljeno {formatDate(job.createdAt)}
            </p>
          </div>
          
          {/* Description */}
          <div className="p-6 sm:p-8 border-t border-border">
            <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Opis posla
            </h2>
            <div className="bg-secondary/30 rounded-xl p-5">
              <p className="text-muted leading-relaxed whitespace-pre-wrap">{job.description}</p>
            </div>
          </div>
          
          {/* Job details summary */}
          <div className="px-6 sm:px-8 pb-6 sm:pb-8">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-secondary/50 rounded-xl p-4 text-center">
                <p className="text-xs text-muted uppercase tracking-wide mb-1">Kategorija</p>
                <p className="font-medium text-sm">{job.category}</p>
              </div>
              <div className="bg-secondary/50 rounded-xl p-4 text-center">
                <p className="text-xs text-muted uppercase tracking-wide mb-1">Platforma</p>
                <p className="font-medium text-sm">{job.platforms[0] || '-'}</p>
              </div>
              <div className="bg-secondary/50 rounded-xl p-4 text-center">
                <p className="text-xs text-muted uppercase tracking-wide mb-1">Iskustvo</p>
                <p className="font-medium text-sm">{getExperienceLabel(job.experienceLevel)}</p>
              </div>
              <div className="bg-secondary/50 rounded-xl p-4 text-center">
                <p className="text-xs text-muted uppercase tracking-wide mb-1">Trajanje</p>
                <p className="font-medium text-sm">{job.duration || 'Fleksibilno'}</p>
              </div>
            </div>
          </div>
          
          {/* Apply section - Only for creators */}
          {currentUser.type === 'creator' && (
            <div className="p-6 sm:p-8 border-t border-border bg-secondary/30">
              {hasApplied ? (
                <div>
                  {/* Different message for engaged (accepted invitation) vs regular application */}
                  {myApplication?.status === 'engaged' || myApplication?.status === 'completed' ? (
                    <>
                      <div className="flex items-center gap-3 mb-4">
                        <svg className="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium">
                          {myApplication?.status === 'completed' 
                            ? 'Uspešno ste završili ovaj projekat!' 
                            : 'Već ste prihvatili poziv da radite na ovom projektu'}
                        </span>
                      </div>
                      <div className="bg-white rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-muted">Status:</span>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            myApplication?.status === 'completed' 
                              ? 'bg-success/10 text-success' 
                              : 'bg-primary/10 text-primary'
                          }`}>
                            {myApplication?.status === 'completed' ? 'Završeno' : 'Angažovani ste'}
                          </span>
                        </div>
                        <p className="text-sm text-muted">
                          {myApplication?.status === 'completed' 
                            ? 'Čestitamo! Ovaj projekat je uspešno završen.'
                            : 'Možete kontaktirati biznis putem poruka u dashboardu.'}
                        </p>
                        <Link 
                          href="/dashboard?tab=poruke" 
                          className="mt-3 inline-flex items-center gap-2 text-primary text-sm hover:underline"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          Idi na poruke
                        </Link>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-3 mb-4">
                        <svg className="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium">Već ste se prijavili na ovaj posao</span>
                      </div>
                      
                      {myApplication && (
                        <div className="bg-white rounded-xl p-4 mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-muted">Status prijave:</span>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusLabel(myApplication.status).color}`}>
                              {getStatusLabel(myApplication.status).text}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted">Vaša ponuda:</span>
                            <span className="font-medium">€{myApplication.proposedPrice}</span>
                          </div>
                        </div>
                      )}
                      
                      {myApplication?.status === 'pending' && (
                        <button
                          onClick={handleWithdraw}
                          className="text-sm text-error hover:underline"
                        >
                          Povuci prijavu
                        </button>
                      )}
                    </>
                  )}
                </div>
              ) : job.isExpired ? (
                <div className="text-center py-4">
                  <div className="w-12 h-12 bg-error/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="font-medium text-error mb-1">Prijave za ovaj oglas su istekle</h3>
                  <p className="text-sm text-muted">
                    Rok za prijave je bio {job.applicationDeadline ? new Date(job.applicationDeadline).toLocaleDateString('sr-RS') : ''}
                  </p>
                </div>
              ) : job.status === 'open' ? (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h3 className="font-medium mb-1">Zainteresovani ste za ovaj posao?</h3>
                    <p className="text-sm text-muted">Pošaljite prijavu i pokažite zašto ste vi pravi izbor</p>
                    {job.applicationDeadline && (
                      <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Rok za prijave: {new Date(job.applicationDeadline).toLocaleDateString('sr-RS')}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleToggleSave}
                      disabled={isSaving}
                      className={`px-4 py-3 rounded-xl font-medium transition-colors flex items-center gap-2 ${
                        isSaved 
                          ? 'bg-amber-100 text-amber-700 border border-amber-300' 
                          : 'bg-secondary text-foreground border border-border hover:bg-secondary/80'
                      }`}
                    >
                      {isSaving ? (
                        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <svg className={`w-5 h-5 ${isSaved ? 'fill-amber-500' : ''}`} fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                      )}
                      {isSaved ? 'Sačuvano' : 'Sačuvaj'}
                    </button>
                    <button
                      onClick={() => setShowApplyModal(true)}
                      className="px-8 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
                    >
                      Prijavi se
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted">
                  <p>Ovaj posao više nije otvoren za prijave</p>
                </div>
              )}
            </div>
          )}
          
          {/* Business view */}
          {currentUser.type === 'business' && job.businessId === currentUser.businessId && (
            <div className="p-6 sm:p-8 border-t border-border bg-secondary/30">
              <Link
                href={`/dashboard?tab=poslovi`}
                className="inline-flex items-center gap-2 text-primary hover:underline"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Pogledaj prijave u dashboardu
              </Link>
            </div>
          )}
        </div>
      </div>
      
      {/* Apply Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleApply}>
              <div className="p-6 border-b border-border">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-medium">Prijavi se na posao</h2>
                  <button
                    type="button"
                    onClick={() => setShowApplyModal(false)}
                    className="p-2 hover:bg-secondary rounded-xl transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-5">
                {submitSuccess ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium mb-2">Prijava uspešno poslata!</h3>
                    <p className="text-muted">Biznis će pregledati vašu prijavu</p>
                  </div>
                ) : (
                  <>
                    {submitError && (
                      <div className="p-4 bg-error/10 border border-error/20 rounded-xl text-error text-sm">
                        {submitError}
                      </div>
                    )}
                    
                    {/* Cover Letter */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Propratno pismo *</label>
                      <textarea
                        required
                        rows={5}
                        value={coverLetter}
                        onChange={(e) => setCoverLetter(e.target.value)}
                        placeholder="Opišite zašto ste vi pravi izbor za ovaj posao, vaše relevantno iskustvo..."
                        className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:border-primary resize-none"
                      />
                    </div>
                    
                    {/* Proposed Price */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Vaša ponuda (€) *</label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={proposedPrice}
                        onChange={(e) => setProposedPrice(e.target.value)}
                        placeholder={job.budgetMin ? `Budžet: ${formatBudget(job)}` : 'Unesite vašu cenu'}
                        className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:border-primary"
                      />
                      {job.budgetMin && (
                        <p className="text-xs text-muted mt-1">Budžet klijenta: {formatBudget(job)}</p>
                      )}
                    </div>
                    
                    {/* Estimated Duration */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Procenjeno vreme za završetak</label>
                      <select
                        value={estimatedDuration}
                        onChange={(e) => setEstimatedDuration(e.target.value)}
                        className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:border-primary bg-white"
                      >
                        <option value="">Izaberite opciju</option>
                        <option value="1-3 dana">1-3 dana</option>
                        <option value="4-7 dana">4-7 dana</option>
                        <option value="1-2 nedelje">1-2 nedelje</option>
                        <option value="2-4 nedelje">2-4 nedelje</option>
                        <option value="1+ mesec">1+ mesec</option>
                      </select>
                    </div>
                  </>
                )}
              </div>
              
              {!submitSuccess && (
                <div className="p-6 border-t border-border flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowApplyModal(false)}
                    className="px-6 py-3 border border-border rounded-xl hover:bg-secondary transition-colors"
                  >
                    Otkaži
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Šaljem...
                      </>
                    ) : (
                      'Pošalji prijavu'
                    )}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

