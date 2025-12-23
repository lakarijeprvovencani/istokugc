'use client';

import { use, useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Creator, CreatorStatus, categories, platforms, languages } from '@/lib/mockData';
import { useDemo } from '@/context/DemoContext';
import ReviewList from '@/components/ReviewList';
import ReviewForm from '@/components/ReviewForm';
import { AverageRating } from '@/components/StarRating';
import { generateReviewStats } from '@/types/review';
import type { CreateReviewInput } from '@/types/review';

export default function CreatorProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { 
    currentUser, 
    isLoggedIn, 
    isHydrated, 
    isOwnProfile,
    getCreatorById, 
    updateCreator, 
    deleteCreator,
    getReviewsForCreator,
    hasBusinessReviewedCreator,
    getBusinessReviewForCreator,
    addReview,
    addReplyToReview,
    isFavorite,
    addToFavorites,
    removeFromFavorites,
  } = useDemo();
  
  // Get creator from context (with any saved modifications)
  const savedCreator = getCreatorById(resolvedParams.id);
  
  // State for editing
  const [isEditing, setIsEditing] = useState(false);
  const [editedCreator, setEditedCreator] = useState<Creator | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  
  // Review states
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  
  // Update state after hydration - only run once when hydrated
  useEffect(() => {
    if (isHydrated) {
      const creator = getCreatorById(resolvedParams.id);
      if (creator) {
        setEditedCreator(creator);
        setIsDeleted(false);
      } else {
        // Creator was deleted or doesn't exist
        setIsDeleted(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHydrated, resolvedParams.id]);
  
  // Use edited version if available, otherwise saved
  const creator = editedCreator || savedCreator;
  
  const isAdmin = currentUser.type === 'admin';
  const isOwner = creator ? isOwnProfile(creator.id) : false;

  // Admin and business users can see contact info (all business users have active subscription)
  // Creators can also see their own contact info
  const canSeeContact = currentUser.type === 'admin' || currentUser.type === 'business' || isOwner;

  // If not logged in, show login prompt
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary/30">
        <div className="max-w-md mx-auto px-6 text-center">
          <div className="bg-white rounded-3xl p-10 border border-border shadow-sm">
            <div className="text-5xl mb-6">🔒</div>
            <h1 className="text-2xl font-light mb-3">Pristup ograničen</h1>
            <p className="text-muted mb-8">
              Da bi video profile kreatora, potrebno je da imaš nalog na platformi.
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
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!creator) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-medium mb-4">Kreator nije pronađen</h1>
          <Link href="/kreatori" className="text-muted hover:text-foreground">
            ← Nazad na listu
          </Link>
        </div>
      </div>
    );
  }

  // Show deleted state
  if (isDeleted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary/30">
        <div className="max-w-md mx-auto px-6 text-center">
          <div className="bg-white rounded-3xl p-10 border border-border shadow-sm">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600">
                <path d="M3 6h18"/>
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
              </svg>
            </div>
            <h1 className="text-2xl font-medium mb-3">Profil obrisan</h1>
            <p className="text-muted mb-8">
              Profil kreatora <strong>{editedCreator?.name}</strong> je uspešno obrisan.
            </p>
            <Link 
              href="/kreatori"
              className="block w-full py-4 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
            >
              Nazad na kreatore
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Back link */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-6">
        <Link href="/kreatori" className="text-sm text-muted hover:text-foreground transition-colors">
          ← Nazad na kreatore
        </Link>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-12 pb-20">
        <div className="lg:flex gap-16">
          {/* Left - Photo & Contact */}
          <div className="lg:w-96 flex-shrink-0 mb-10 lg:mb-0">
            <div className="sticky top-28">
              {/* Photo */}
              <div className="aspect-[3/4] relative rounded-3xl overflow-hidden mb-6">
                <Image
                  src={creator.photo}
                  alt={creator.name}
                  fill
                  className="object-cover"
                />
              </div>

              {/* Contact card */}
              <div className="bg-secondary rounded-2xl p-6">
                <div className="text-sm text-muted uppercase tracking-wider mb-4">Kontakt</div>
                
                {canSeeContact ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">📧</span>
                      <a href={`mailto:${creator.email}`} className="text-sm hover:underline">
                        {creator.email}
                      </a>
                    </div>
                    {creator.phone && (
                      <div className="flex items-center gap-3">
                        <span className="text-xl">📱</span>
                        <a href={`tel:${creator.phone}`} className="text-sm hover:underline">
                          {creator.phone}
                        </a>
                      </div>
                    )}
                    {creator.instagram && (
                      <div className="flex items-center gap-3">
                        <span className="text-xl">📸</span>
                        <span className="text-sm">{creator.instagram}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-muted mb-4">
                      Kontakt informacije su dostupne samo za brendove sa aktivnom pretplatom.
                    </p>
                    <Link 
                      href="/register/biznis"
                      className="block w-full text-center py-3 bg-primary text-white rounded-xl text-sm hover:bg-primary/90 transition-colors"
                    >
                      Registruj se kao brend
                    </Link>
                  </div>
                )}
              </div>

              {/* Price */}
              <div className="mt-6 bg-white border border-border rounded-2xl p-6">
                <div className="text-sm text-muted uppercase tracking-wider mb-2">Početna cena</div>
                <div className="text-3xl font-light">€{creator.priceFrom}</div>
                <p className="text-sm text-muted mt-2">po videu / projektu</p>
              </div>

              {/* Save to favorites button - only for business users */}
              {currentUser.type === 'business' && (
                <div className="mt-6">
                  {isFavorite(creator.id) ? (
                    <button
                      onClick={() => removeFromFavorites(creator.id)}
                      className="w-full py-4 border border-error text-error rounded-xl font-medium hover:bg-error/10 transition-colors flex items-center justify-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
                        <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                      </svg>
                      Ukloni iz sačuvanih
                    </button>
                  ) : (
                    <button
                      onClick={() => addToFavorites(creator.id)}
                      className="w-full py-4 bg-secondary text-foreground rounded-xl font-medium hover:bg-accent transition-colors flex items-center justify-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                      </svg>
                      Sačuvaj kreatora
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right - Details */}
          <div className="flex-1">
            {/* Own Profile Banner */}
            {isOwner && (
              <div className="mb-6 bg-gradient-to-r from-primary to-primary/80 text-white rounded-2xl p-5 flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-medium mb-1">Ovo je tvoj profil</h3>
                  <p className="text-sm text-white/80">
                    Ovde možeš videti kako tvoj profil izgleda drugima i odgovoriti na recenzije.
                  </p>
                </div>
              </div>
            )}

            {/* Header */}
            <div className="mb-10">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-4xl lg:text-5xl font-light mb-3">{creator.name}</h1>
                  <p className="text-lg text-muted">{creator.location}</p>
                </div>
                {isAdmin && (
                  <button
                    onClick={() => {
                      if (savedCreator) {
                        setEditedCreator(savedCreator);
                      }
                      setIsEditing(true);
                    }}
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-full text-sm font-medium hover:bg-primary/90 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                      <path d="m15 5 4 4"/>
                    </svg>
                    Uredi
                  </button>
                )}
              </div>
            </div>

            {/* Bio */}
            <div className="mb-12">
              <h2 className="text-sm text-muted uppercase tracking-wider mb-4">O meni</h2>
              <p className="text-lg leading-relaxed">{creator.bio}</p>
            </div>

            {/* Categories */}
            <div className="mb-12">
              <h2 className="text-sm text-muted uppercase tracking-wider mb-4">Kategorije</h2>
              <div className="flex flex-wrap gap-3">
                {creator.categories.map((category) => (
                  <span 
                    key={category}
                    className="px-5 py-2 bg-secondary rounded-full text-sm"
                  >
                    {category}
                  </span>
                ))}
              </div>
            </div>

            {/* Platforms */}
            <div className="mb-12">
              <h2 className="text-sm text-muted uppercase tracking-wider mb-4">Platforme</h2>
              <div className="flex flex-wrap gap-3">
                {creator.platforms.map((platform) => (
                  <span 
                    key={platform}
                    className="px-5 py-2 bg-secondary rounded-full text-sm flex items-center gap-2"
                  >
                    {platform === 'TikTok' && '📱'}
                    {platform === 'Instagram' && '📸'}
                    {platform === 'YouTube' && '🎬'}
                    {platform === 'Twitter/X' && '🐦'}
                    {platform === 'LinkedIn' && '💼'}
                    {platform}
                  </span>
                ))}
              </div>
            </div>

            {/* Languages */}
            <div className="mb-12">
              <h2 className="text-sm text-muted uppercase tracking-wider mb-4">Jezici</h2>
              <div className="flex flex-wrap gap-3">
                {creator.languages.map((language) => (
                  <span 
                    key={language}
                    className="px-5 py-2 bg-secondary rounded-full text-sm"
                  >
                    {language}
                  </span>
                ))}
              </div>
            </div>

            {/* Portfolio */}
            <div className="mb-12">
              <h2 className="text-sm text-muted uppercase tracking-wider mb-6">Portfolio</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {creator.portfolio.map((item, index) => (
                  <div 
                    key={index}
                    className="group relative aspect-[3/4] rounded-2xl overflow-hidden"
                  >
                    <Image
                      src={item.thumbnail}
                      alt={`Portfolio ${index + 1}`}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white font-medium flex items-center gap-2">
                        {item.type === 'instagram' && '📸 Instagram'}
                        {item.type === 'tiktok' && '📱 TikTok'}
                        {item.type === 'youtube' && '🎬 YouTube'}
                      </span>
                    </div>
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full">
                      <span className="text-xs font-medium capitalize">{item.type}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Reviews Section */}
            <div className="pt-8 border-t border-border">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-sm text-muted uppercase tracking-wider mb-3">Recenzije</h2>
                  {(() => {
                    const reviews = getReviewsForCreator(creator.id, true);
                    const stats = generateReviewStats(reviews);
                    if (stats.totalReviews > 0) {
                      return (
                        <AverageRating 
                          rating={stats.averageRating} 
                          totalReviews={stats.totalReviews} 
                          size="md"
                        />
                      );
                    }
                    return null;
                  })()}
                </div>
                
                {/* Review button for business users */}
                {currentUser.type === 'business' && !hasBusinessReviewedCreator('b1', creator.id) && !showReviewForm && (
                  <button
                    onClick={() => setShowReviewForm(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.562.562 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                    </svg>
                    Ostavi recenziju
                  </button>
                )}
              </div>

              {/* Success message after review submission */}
              {reviewSubmitted && (
                <div className="mb-6 bg-success/10 border border-success/20 rounded-xl p-4 flex items-center gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-success">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-success">Recenzija je uspešno poslata!</p>
                    <p className="text-xs text-muted mt-0.5">Biće vidljiva nakon odobrenja od strane administratora.</p>
                  </div>
                </div>
              )}

              {/* Review form for business users */}
              {showReviewForm && currentUser.type === 'business' && (
                <div className="mb-8">
                  <ReviewForm
                    creatorId={creator.id}
                    creatorName={creator.name}
                    onSubmit={(data: CreateReviewInput) => {
                      setIsSubmittingReview(true);
                      // Add review
                      addReview(data);
                      // Show success message
                      setIsSubmittingReview(false);
                      setShowReviewForm(false);
                      setReviewSubmitted(true);
                      // Hide success message after 5 seconds
                      setTimeout(() => setReviewSubmitted(false), 5000);
                    }}
                    onCancel={() => setShowReviewForm(false)}
                    isSubmitting={isSubmittingReview}
                  />
                </div>
              )}

              {/* Business's existing review notice */}
              {currentUser.type === 'business' && hasBusinessReviewedCreator('b1', creator.id) && (
                <div className="mb-6 bg-secondary rounded-xl p-4 flex items-center gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-muted">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                  </svg>
                  <p className="text-sm text-muted">
                    Već ste ostavili recenziju za ovog kreatora. 
                    {(() => {
                      const review = getBusinessReviewForCreator('b1', creator.id);
                      if (review?.status === 'pending') {
                        return ' Vaša recenzija čeka odobrenje.';
                      }
                      return '';
                    })()}
                  </p>
                </div>
              )}

              {/* Reviews list */}
              {(() => {
                const reviews = getReviewsForCreator(creator.id, true);
                if (reviews.length === 0 && !showReviewForm) {
                  return (
                    <div className="text-center py-12 bg-secondary/30 rounded-2xl">
                      <div className="text-4xl mb-4">📝</div>
                      <p className="text-muted">Još uvek nema recenzija za ovog kreatora.</p>
                      {currentUser.type === 'business' && !hasBusinessReviewedCreator('b1', creator.id) && (
                        <button
                          onClick={() => setShowReviewForm(true)}
                          className="mt-4 text-sm text-primary hover:underline"
                        >
                          Budite prvi koji će ostaviti recenziju
                        </button>
                      )}
                    </div>
                  );
                }
                return (
                  <ReviewList
                    reviews={reviews}
                    showStats={false}
                    canReply={isOwner}
                    onReply={(reviewId, reply) => {
                      addReplyToReview(reviewId, reply);
                    }}
                    emptyMessage="Još uvek nema recenzija za ovog kreatora."
                  />
                );
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditing && editedCreator && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-border px-8 py-6 flex items-center justify-between">
              <h2 className="text-2xl font-medium">Uredi kreatora</h2>
              <button
                onClick={() => setIsEditing(false)}
                className="p-2 hover:bg-secondary rounded-full transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-8 space-y-6">
              {/* Basic Info */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm text-muted mb-2">Ime i prezime</label>
                  <input
                    type="text"
                    value={editedCreator.name}
                    onChange={(e) => setEditedCreator({ ...editedCreator, name: e.target.value })}
                    className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm text-muted mb-2">Lokacija</label>
                  <input
                    type="text"
                    value={editedCreator.location}
                    onChange={(e) => setEditedCreator({ ...editedCreator, location: e.target.value })}
                    className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm text-muted mb-2">Biografija</label>
                <textarea
                  value={editedCreator.bio}
                  onChange={(e) => setEditedCreator({ ...editedCreator, bio: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:border-primary resize-none"
                />
              </div>

              {/* Contact Info */}
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm text-muted mb-2">Email</label>
                  <input
                    type="email"
                    value={editedCreator.email}
                    onChange={(e) => setEditedCreator({ ...editedCreator, email: e.target.value })}
                    className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm text-muted mb-2">Telefon</label>
                  <input
                    type="text"
                    value={editedCreator.phone || ''}
                    onChange={(e) => setEditedCreator({ ...editedCreator, phone: e.target.value })}
                    className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm text-muted mb-2">Instagram</label>
                  <input
                    type="text"
                    value={editedCreator.instagram || ''}
                    onChange={(e) => setEditedCreator({ ...editedCreator, instagram: e.target.value })}
                    className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Price */}
              <div className="w-48">
                <label className="block text-sm text-muted mb-2">Početna cena (€)</label>
                <input
                  type="number"
                  value={editedCreator.priceFrom}
                  onChange={(e) => setEditedCreator({ ...editedCreator, priceFrom: Number(e.target.value) })}
                  className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:border-primary"
                />
              </div>

              {/* Categories */}
              <div>
                <label className="block text-sm text-muted mb-3">Kategorije</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        const newCategories = editedCreator.categories.includes(cat)
                          ? editedCreator.categories.filter((c) => c !== cat)
                          : [...editedCreator.categories, cat];
                        setEditedCreator({ ...editedCreator, categories: newCategories });
                      }}
                      className={`px-4 py-2 rounded-full text-sm transition-colors ${
                        editedCreator.categories.includes(cat)
                          ? 'bg-primary text-white'
                          : 'bg-secondary hover:bg-accent'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Platforms */}
              <div>
                <label className="block text-sm text-muted mb-3">Platforme</label>
                <div className="flex flex-wrap gap-2">
                  {platforms.map((plat) => (
                    <button
                      key={plat}
                      type="button"
                      onClick={() => {
                        const newPlatforms = editedCreator.platforms.includes(plat)
                          ? editedCreator.platforms.filter((p) => p !== plat)
                          : [...editedCreator.platforms, plat];
                        setEditedCreator({ ...editedCreator, platforms: newPlatforms });
                      }}
                      className={`px-4 py-2 rounded-full text-sm transition-colors ${
                        editedCreator.platforms.includes(plat)
                          ? 'bg-primary text-white'
                          : 'bg-secondary hover:bg-accent'
                      }`}
                    >
                      {plat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Languages */}
              <div>
                <label className="block text-sm text-muted mb-3">Jezici</label>
                <div className="flex flex-wrap gap-2">
                  {languages.map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => {
                        const newLanguages = editedCreator.languages.includes(lang)
                          ? editedCreator.languages.filter((l) => l !== lang)
                          : [...editedCreator.languages, lang];
                        setEditedCreator({ ...editedCreator, languages: newLanguages });
                      }}
                      className={`px-4 py-2 rounded-full text-sm transition-colors ${
                        editedCreator.languages.includes(lang)
                          ? 'bg-primary text-white'
                          : 'bg-secondary hover:bg-accent'
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              {/* Photo URL */}
              <div>
                <label className="block text-sm text-muted mb-2">URL fotografije</label>
                <input
                  type="text"
                  value={editedCreator.photo}
                  onChange={(e) => setEditedCreator({ ...editedCreator, photo: e.target.value })}
                  className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:border-primary"
                />
              </div>

              {/* Status */}
              <div className="pt-6 border-t border-border">
                <label className="block text-sm text-muted mb-3">Status profila</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                    className="w-full md:w-auto min-w-[200px] px-5 py-3 border border-border rounded-xl text-sm font-medium bg-white hover:bg-secondary transition-colors flex items-center justify-between gap-4"
                  >
                    <span className="flex items-center gap-2">
                      {(editedCreator.status === 'approved' || (editedCreator.approved && !editedCreator.status)) && (
                        <>
                          <span className="w-2 h-2 rounded-full bg-primary"></span>
                          Aktivan
                        </>
                      )}
                      {(editedCreator.status === 'pending' || (!editedCreator.approved && !editedCreator.status && editedCreator.status !== 'deactivated')) && (
                        <>
                          <span className="w-2 h-2 rounded-full bg-muted"></span>
                          Na čekanju
                        </>
                      )}
                      {editedCreator.status === 'deactivated' && (
                        <>
                          <span className="w-2 h-2 rounded-full bg-red-500"></span>
                          Deaktiviran
                        </>
                      )}
                    </span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${showStatusDropdown ? 'rotate-180' : ''}`}>
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </button>
                  
                  {showStatusDropdown && (
                    <div className="absolute top-full left-0 mt-2 w-full md:w-auto min-w-[200px] bg-white border border-border rounded-xl shadow-lg overflow-hidden z-10">
                      <button
                        type="button"
                        onClick={() => {
                          setEditedCreator({ ...editedCreator, approved: true, status: 'approved' });
                          setShowStatusDropdown(false);
                        }}
                        className={`w-full px-5 py-3 text-sm text-left hover:bg-secondary transition-colors flex items-center gap-3 ${
                          (editedCreator.status === 'approved' || (editedCreator.approved && !editedCreator.status)) ? 'bg-secondary font-medium' : ''
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-primary"></span>
                        Aktivan
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditedCreator({ ...editedCreator, approved: false, status: 'pending' });
                          setShowStatusDropdown(false);
                        }}
                        className={`w-full px-5 py-3 text-sm text-left hover:bg-secondary transition-colors flex items-center gap-3 ${
                          editedCreator.status === 'pending' ? 'bg-secondary font-medium' : ''
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-muted"></span>
                        Na čekanju
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditedCreator({ ...editedCreator, approved: false, status: 'deactivated' });
                          setShowStatusDropdown(false);
                        }}
                        className={`w-full px-5 py-3 text-sm text-left hover:bg-secondary transition-colors flex items-center gap-3 ${
                          editedCreator.status === 'deactivated' ? 'bg-secondary font-medium' : ''
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-red-500"></span>
                        Deaktiviran
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted mt-3">
                  {editedCreator.status === 'deactivated'
                    ? 'Deaktivirani profili se ne prikazuju u pretrazi.'
                    : editedCreator.status === 'pending' || (!editedCreator.approved && !editedCreator.status)
                    ? 'Profil čeka odobrenje i nije vidljiv u pretrazi.'
                    : 'Profil je aktivan i vidljiv u pretrazi.'}
                </p>
              </div>

              {/* Delete Section */}
              <div className="pt-6 border-t border-red-200 bg-red-50 -mx-8 px-8 pb-6 mt-6 rounded-b-3xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-red-800">Opasna zona</h3>
                    <p className="text-xs text-red-600 mt-1">Brisanje profila je trajno i ne može se poništiti.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-5 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-colors flex items-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18"/>
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                      <line x1="10" y1="11" x2="10" y2="17"/>
                      <line x1="14" y1="11" x2="14" y2="17"/>
                    </svg>
                    Obriši profil
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white border-t border-border px-8 py-6 flex justify-end gap-4">
              <button
                onClick={() => {
                  setEditedCreator(savedCreator || null);
                  setIsEditing(false);
                  setShowStatusDropdown(false);
                }}
                className="px-6 py-3 border border-border rounded-xl text-sm font-medium hover:bg-secondary transition-colors"
              >
                Otkaži
              </button>
              <button
                onClick={() => {
                  if (editedCreator) {
                    // Save to context (persisted in localStorage)
                    updateCreator(editedCreator.id, editedCreator);
                    setIsEditing(false);
                    setShowStatusDropdown(false);
                  }
                }}
                className="px-6 py-3 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Sačuvaj izmene
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600">
                  <path d="M3 6h18"/>
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                  <line x1="10" y1="11" x2="10" y2="17"/>
                  <line x1="14" y1="11" x2="14" y2="17"/>
                </svg>
              </div>
              <h3 className="text-xl font-medium mb-2">Obriši profil?</h3>
              <p className="text-muted mb-6">
                Da li si siguran da želiš da obrišeš profil <strong>{editedCreator?.name}</strong>? Ova akcija se ne može poništiti.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-6 py-3 border border-border rounded-xl text-sm font-medium hover:bg-secondary transition-colors"
                >
                  Otkaži
                </button>
                <button
                  onClick={() => {
                    if (editedCreator) {
                      // Delete from context (persisted in localStorage)
                      deleteCreator(editedCreator.id);
                      setShowDeleteConfirm(false);
                      setIsEditing(false);
                      setIsDeleted(true);
                    }
                  }}
                  className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-colors"
                >
                  Da, obriši
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
