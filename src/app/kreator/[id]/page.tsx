'use client';

import { use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { mockCreators } from '@/lib/mockData';
import { useDemo } from '@/context/DemoContext';

export default function CreatorProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { currentUser, isLoggedIn } = useDemo();
  const creator = mockCreators.find((c) => c.id === resolvedParams.id);

  // Admin and paid business can see contact info
  const canSeeContact = currentUser.type === 'admin' || (currentUser.type === 'business' && currentUser.isPaid);
  const needsToPay = currentUser.type === 'business' && !currentUser.isPaid;

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
                ) : needsToPay ? (
                  <div>
                    <p className="text-sm text-muted mb-4">
                      Kontakt informacije su dostupne samo za korisnike sa aktivnom pretplatom.
                    </p>
                    <Link 
                      href="/dashboard"
                      className="block w-full text-center py-3 bg-primary text-white rounded-xl text-sm hover:bg-primary/90 transition-colors"
                    >
                      Aktiviraj pretplatu
                    </Link>
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
            </div>
          </div>

          {/* Right - Details */}
          <div className="flex-1">
            {/* Header */}
            <div className="mb-10">
              <h1 className="text-4xl lg:text-5xl font-light mb-3">{creator.name}</h1>
              <p className="text-lg text-muted">{creator.location}</p>
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
            <div>
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
          </div>
        </div>
      </div>
    </div>
  );
}
