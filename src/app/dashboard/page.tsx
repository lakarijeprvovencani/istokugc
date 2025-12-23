'use client';

import { useState } from 'react';
import { useDemo } from '@/context/DemoContext';
import Link from 'next/link';
import Image from 'next/image';
import { mockCreators } from '@/lib/mockData';
import ReviewCard from '@/components/ReviewCard';
import { AverageRating } from '@/components/StarRating';
import { generateReviewStats } from '@/types/review';

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
  const { getReviewsForCreator, addReplyToReview } = useDemo();
  const [activeTab, setActiveTab] = useState<'overview' | 'reviews'>('overview');
  
  // Get reviews for this creator
  const allReviews = getReviewsForCreator(creator.id, false); // Include pending
  const approvedReviews = allReviews.filter(r => r.status === 'approved');
  const pendingReviews = allReviews.filter(r => r.status === 'pending');
  const stats = generateReviewStats(allReviews);

  const tabs = [
    { id: 'overview' as const, label: 'Pregled', count: null },
    { id: 'reviews' as const, label: 'Recenzije', count: allReviews.length },
  ];

  return (
    <div className="min-h-screen bg-secondary/30">
      <div className="max-w-6xl mx-auto px-6 lg:px-12 py-12">
        <h1 className="text-3xl font-light mb-2">Dashboard</h1>
        <p className="text-muted mb-6">Dobrodošla nazad, {creator.name}</p>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 bg-white rounded-xl p-1 border border-border w-fit">
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

                <div className="mt-6 pt-6 border-t border-border">
                  <Link 
                    href="#"
                    className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    Uredi profil →
                  </Link>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl p-6 border border-border text-center">
                  <div className="text-3xl font-light mb-1">247</div>
                  <div className="text-sm text-muted">Pregleda profila</div>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-border text-center">
                  <div className="text-3xl font-light mb-1">12</div>
                  <div className="text-sm text-muted">Kontaktiranja</div>
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
                  <button className="text-sm text-primary hover:underline">
                    + Dodaj video
                  </button>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  {creator.portfolio.map((item, index) => (
                    <div key={index} className="aspect-[3/4] relative rounded-xl overflow-hidden">
                      <Image src={item.thumbnail} alt="" fill className="object-cover" />
                      <div className="absolute top-2 right-2 bg-white/90 px-2 py-1 rounded-full text-xs">
                        {item.type}
                      </div>
                    </div>
                  ))}
                  <button className="aspect-[3/4] rounded-xl border-2 border-dashed border-border flex items-center justify-center text-muted hover:border-muted transition-colors">
                    <span className="text-3xl">+</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick info */}
              <div className="bg-white rounded-2xl p-6 border border-border">
                <h3 className="font-medium mb-4">Tvoje informacije</h3>
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted">Email</span>
                    <span>{creator.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Telefon</span>
                    <span>{creator.phone || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Instagram</span>
                    <span>{creator.instagram || '—'}</span>
                  </div>
                </div>
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

              {/* Categories */}
              <div className="bg-white rounded-2xl p-6 border border-border">
                <h3 className="font-medium mb-4">Kategorije</h3>
                <div className="flex flex-wrap gap-2">
                  {creator.categories.map((cat) => (
                    <span key={cat} className="px-3 py-1.5 bg-secondary rounded-full text-sm">
                      {cat}
                    </span>
                  ))}
                </div>
              </div>

              {/* Platforms */}
              <div className="bg-white rounded-2xl p-6 border border-border">
                <h3 className="font-medium mb-4">Platforme</h3>
                <div className="flex flex-wrap gap-2">
                  {creator.platforms.map((plat) => (
                    <span key={plat} className="px-3 py-1.5 bg-secondary rounded-full text-sm">
                      {plat}
                    </span>
                  ))}
                </div>
              </div>

              {/* Languages */}
              <div className="bg-white rounded-2xl p-6 border border-border">
                <h3 className="font-medium mb-4">Jezici</h3>
                <div className="flex flex-wrap gap-2">
                  {creator.languages.map((lang) => (
                    <span key={lang} className="px-3 py-1.5 bg-secondary rounded-full text-sm">
                      {lang}
                    </span>
                  ))}
                </div>
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
                    onReply={(reviewId, reply) => {
                      addReplyToReview(reviewId, reply);
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

              {/* Subscription benefits */}
              <div className="mt-6 pt-6 border-t border-border">
                <p className="text-sm text-muted mb-3">Tvoj plan uključuje:</p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-secondary rounded-full text-xs">✓ Neograničena pretraga</span>
                  <span className="px-3 py-1 bg-secondary rounded-full text-xs">✓ Kontakt info kreatora</span>
                  <span className="px-3 py-1 bg-secondary rounded-full text-xs">✓ Email podrška</span>
                  {subscription.plan === 'yearly' && (
                    <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs">✓ Prioritetna podrška</span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick search */}
            <div className="bg-white rounded-2xl p-6 border border-border">
              <h2 className="text-lg font-medium mb-6">Pretraži kreatore</h2>
              <div className="flex gap-4">
                <input
                  type="text"
                  placeholder="Kategorija, ime, lokacija..."
                  className="flex-1 px-5 py-3 border border-border rounded-xl focus:outline-none focus:border-muted"
                />
                <Link
                  href="/kreatori"
                  className="px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
                >
                  Pretraži
                </Link>
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
            <div className="bg-white rounded-2xl p-6 border border-border">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-medium">Moje recenzije</h2>
                <span className="text-sm text-muted">{myReviews.length} recenzija</span>
              </div>
              
              {/* Delete success message */}
              {showDeleteSuccess && (
                <div className="mb-4 bg-success/10 text-success rounded-lg p-3 text-sm flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                  Recenzija je uspešno obrisana.
                </div>
              )}
              
              {myReviews.length > 0 ? (
                <div className="space-y-4">
                  {myReviews.slice(0, 3).map((review) => {
                    const creator = getCreatorById(review.creatorId);
                    return (
                      <div key={review.id} className="p-4 border border-border rounded-xl">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <Link 
                              href={`/kreator/${review.creatorId}`}
                              className="font-medium text-primary hover:underline"
                            >
                              {creator?.name || 'Nepoznat kreator'}
                            </Link>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <svg
                                    key={star}
                                    viewBox="0 0 24 24"
                                    fill={star <= review.rating ? '#f59e0b' : 'none'}
                                    stroke={star <= review.rating ? '#f59e0b' : '#e5e5e5'}
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
                          <button
                            onClick={() => handleDeleteReview(review.id)}
                            className="text-muted hover:text-error transition-colors p-1"
                            title="Obriši recenziju"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                            </svg>
                          </button>
                        </div>
                        <p className="text-sm text-muted line-clamp-2">{review.comment}</p>
                        <p className="text-xs text-muted mt-2">
                          {new Date(review.createdAt).toLocaleDateString('sr-RS', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                    );
                  })}
                  
                  {myReviews.length > 3 && (
                    <Link 
                      href="/dashboard/reviews"
                      className="block text-center text-sm text-primary hover:underline py-2"
                    >
                      Vidi sve recenzije ({myReviews.length}) →
                    </Link>
                  )}
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
    </div>
  );
}

