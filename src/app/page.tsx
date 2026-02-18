'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  const [categories, setCategories] = useState<string[]>([]);
  const [featuredCreators, setFeaturedCreators] = useState<any[]>([]);
  
  // Fetch categories and featured creators from database
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch categories
        const catResponse = await fetch('/api/categories');
        if (catResponse.ok) {
          const catData = await catResponse.json();
          setCategories(catData.categories || []);
        }
        
        // Fetch featured creators (first 4 approved)
        const creatorsResponse = await fetch('/api/creators?limit=4');
        if (creatorsResponse.ok) {
          const creatorsData = await creatorsResponse.json();
          setFeaturedCreators(creatorsData.creators || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    
    fetchData();
  }, []);

  return (
    <div>
      {/* Hero Section */}
      <section className="relative min-h-[600px] lg:min-h-[700px] 2xl:min-h-[800px] flex items-center">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-secondary via-white to-white" />
        
        <div className="relative max-w-7xl 2xl:max-w-[1400px] mx-auto px-6 lg:px-12 py-16 lg:py-20 w-full">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left content */}
            <div className="animate-fadeIn">
              <h1 className="text-5xl lg:text-7xl font-light leading-tight mb-8">
                Pronađi savršene
                <span className="block font-medium">UGC kreatore</span>
              </h1>
              <p className="text-lg text-muted max-w-lg mb-10 leading-relaxed">
                Platforma koja povezuje brendove sa talentovanim kreatorima 
                sadržaja. Autentičan sadržaj, jednostavna saradnja.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link 
                  href="/kreatori"
                  className="px-8 py-4 bg-primary text-white rounded-full text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  Pretraži kreatore
                </Link>
                <Link 
                  href="/register/kreator"
                  className="px-8 py-4 border border-border rounded-full text-sm font-medium hover:bg-secondary transition-colors"
                >
                  Postani kreator
                </Link>
              </div>

              {/* Stats */}
              <div className="flex gap-12 mt-16">
                <div>
                  <div className="text-4xl font-light">500+</div>
                  <div className="text-sm text-muted mt-1">Kreatora</div>
                </div>
                <div>
                  <div className="text-4xl font-light">120+</div>
                  <div className="text-sm text-muted mt-1">Brendova</div>
                </div>
                <div>
                  <div className="text-4xl font-light">12</div>
                  <div className="text-sm text-muted mt-1">Kategorija</div>
                </div>
              </div>
            </div>

            {/* Right - Featured creators grid */}
            <div className="hidden lg:grid grid-cols-2 gap-4 animate-fadeIn animate-delay-200">
              {featuredCreators.map((creator, index) => (
                <div 
                  key={creator.id}
                  className={`relative rounded-2xl overflow-hidden ${
                    index === 0 ? 'row-span-2' : ''
                  }`}
                  style={{ aspectRatio: index === 0 ? '3/4' : '1/1' }}
                >
                  <Image
                    src={creator.photo}
                    alt={creator.name}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-4 left-4 text-white">
                    <div className="font-medium">{creator.name}</div>
                    <div className="text-sm opacity-80">{creator.categories[0]}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl 2xl:max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-light mb-4">Istraži po kategorijama</h2>
            <p className="text-muted max-w-xl mx-auto">
              Pronađi kreatore specijalizovane za tvoju industriju
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6 gap-4">
            {categories.map((category) => (
              <Link 
                key={category}
                href={`/kreatori?category=${category}`}
                className="group p-8 bg-secondary rounded-2xl text-center hover:bg-primary hover:text-white transition-all"
              >
                <div className="w-12 h-12 mx-auto mb-4 text-primary group-hover:text-white transition-colors">
                  {category === 'Beauty' && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
                    </svg>
                  )}
                  {category === 'Fashion' && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                    </svg>
                  )}
                  {category === 'Fitness' && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 12h1m14 0h1M6 12h12M6 8v8M18 8v8M8 7v10M16 7v10" />
                    </svg>
                  )}
                  {category === 'Tech' && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
                    </svg>
                  )}
                  {category === 'Food' && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.87c1.355 0 2.697.055 4.024.165C17.155 8.51 18 9.473 18 10.608v2.513m-3-4.87v-1.5m-6 1.5v-1.5m12 9.75l-1.5.75a3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0L3 16.5m15-3.38a48.474 48.474 0 00-6-.37c-2.032 0-4.034.125-6 .37m12 0c.39.049.777.102 1.163.16 1.07.16 1.837 1.094 1.837 2.175v5.17c0 .62-.504 1.124-1.125 1.124H4.125A1.125 1.125 0 013 20.625v-5.17c0-1.08.768-2.014 1.837-2.174A47.78 47.78 0 016 13.12" />
                    </svg>
                  )}
                  {category === 'Travel' && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                    </svg>
                  )}
                  {category === 'Lifestyle' && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                    </svg>
                  )}
                  {category === 'Gaming' && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 01-.657.643 48.39 48.39 0 01-4.163-.3c.186 1.613.293 3.25.315 4.907a.656.656 0 01-.658.663v0c-.355 0-.676-.186-.959-.401a1.647 1.647 0 00-1.003-.349c-1.036 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401v0c.31 0 .555.26.532.57a48.039 48.039 0 01-.642 5.056c1.518.19 3.058.309 4.616.354a.64.64 0 00.657-.643v0c0-.355-.186-.676-.401-.959a1.647 1.647 0 01-.349-1.003c0-1.035 1.008-1.875 2.25-1.875 1.243 0 2.25.84 2.25 1.875 0 .369-.128.713-.349 1.003-.215.283-.4.604-.4.959v0c0 .333.277.599.61.58a48.1 48.1 0 005.427-.63 48.05 48.05 0 00.582-4.717.532.532 0 00-.533-.57v0c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.035 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.37 0 .713.128 1.003.349.283.215.604.401.96.401v0a.656.656 0 00.658-.663 48.422 48.422 0 00-.37-5.36c-1.886.342-3.81.574-5.766.689a.578.578 0 01-.61-.58v0z" />
                    </svg>
                  )}
                  {category === 'Health' && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  {category === 'Finance' && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                    </svg>
                  )}
                  {category === 'Education' && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
                    </svg>
                  )}
                  {category === 'Entertainment' && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-1.5A1.125 1.125 0 0118 18.375M20.625 4.5H3.375m17.25 0c.621 0 1.125.504 1.125 1.125M20.625 4.5h-1.5C18.504 4.5 18 5.004 18 5.625m3.75 0v1.5c0 .621-.504 1.125-1.125 1.125M3.375 4.5c-.621 0-1.125.504-1.125 1.125M3.375 4.5h1.5C5.496 4.5 6 5.004 6 5.625m-3.75 0v1.5c0 .621.504 1.125 1.125 1.125m0 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m1.5-3.75C5.496 8.25 6 7.746 6 7.125v-1.5M4.875 8.25C5.496 8.25 6 8.754 6 9.375v1.5m0-5.25v5.25m0-5.25C6 5.004 6.504 4.5 7.125 4.5h9.75c.621 0 1.125.504 1.125 1.125m1.125 2.625h1.5m-1.5 0A1.125 1.125 0 0118 7.125v-1.5m1.125 2.625c-.621 0-1.125.504-1.125 1.125v1.5m2.625-2.625c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125M18 5.625v5.25M7.125 12h9.75m-9.75 0A1.125 1.125 0 016 10.875M7.125 12C6.504 12 6 12.504 6 13.125m0-2.25C6 11.496 5.496 12 4.875 12M18 10.875c0 .621-.504 1.125-1.125 1.125M18 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m-12 5.25v-5.25m0 5.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125m-12 0v-1.5c0-.621-.504-1.125-1.125-1.125M18 18.375v-5.25m0 5.25v-1.5c0-.621.504-1.125 1.125-1.125M18 13.125v1.5c0 .621.504 1.125 1.125 1.125M18 13.125c0-.621.504-1.125 1.125-1.125M6 13.125v1.5c0 .621-.504 1.125-1.125 1.125M6 13.125C6 12.504 5.496 12 4.875 12m-1.5 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M19.125 12h1.5m0 0c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h1.5m14.25 0h1.5" />
                    </svg>
                  )}
                </div>
                <div className="font-medium">{category}</div>
                <div className="text-sm text-muted group-hover:text-white/70 mt-1">
                  Pregledaj →
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 lg:py-24 bg-secondary">
        <div className="max-w-7xl 2xl:max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-light mb-4">Kako funkcioniše</h2>
            <p className="text-muted max-w-xl mx-auto">
              Jednostavan proces za brendove i kreatore
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-16">
            {/* For Brands */}
            <div className="bg-white rounded-3xl p-10">
              <div className="text-sm uppercase tracking-wider text-muted mb-6">Za brendove</div>
              <div className="space-y-8">
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center flex-shrink-0 font-medium">
                    1
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Registruj se</h4>
                    <p className="text-sm text-muted">Napravi nalog za tvoj brend ili kompaniju</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center flex-shrink-0 font-medium">
                    2
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Izaberi plan</h4>
                    <p className="text-sm text-muted">Mesečna ili godišnja pretplata za pristup</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center flex-shrink-0 font-medium">
                    3
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Pronađi kreatore</h4>
                    <p className="text-sm text-muted">Pretraži po kategoriji, ceni, jeziku i platformi</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center flex-shrink-0 font-medium">
                    4
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Kontaktiraj</h4>
                    <p className="text-sm text-muted">Direktno kontaktiraj kreatore i dogovori saradnju</p>
                  </div>
                </div>
              </div>
              <Link 
                href="/register/biznis"
                className="inline-block mt-10 px-8 py-4 bg-primary text-white rounded-full text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Registruj se kao brend
              </Link>
            </div>

            {/* For Creators */}
            <div className="bg-white rounded-3xl p-10">
              <div className="text-sm uppercase tracking-wider text-muted mb-6">Za kreatore</div>
              <div className="space-y-8">
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center flex-shrink-0 font-medium">
                    1
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Napravi profil</h4>
                    <p className="text-sm text-muted">Registruj se besplatno i popuni svoj profil</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center flex-shrink-0 font-medium">
                    2
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Dodaj portfolio</h4>
                    <p className="text-sm text-muted">Prikaži svoje najbolje radove</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center flex-shrink-0 font-medium">
                    3
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Čekaj odobrenje</h4>
                    <p className="text-sm text-muted">Naš tim će pregledati tvoj profil</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center flex-shrink-0 font-medium">
                    4
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Primi ponude</h4>
                    <p className="text-sm text-muted">Brendovi te kontaktiraju za saradnju</p>
                  </div>
                </div>
              </div>
              <Link 
                href="/register/kreator"
                className="inline-block mt-10 px-8 py-4 border border-border rounded-full text-sm font-medium hover:bg-secondary transition-colors"
              >
                Postani kreator — besplatno
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Creators */}
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl 2xl:max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl lg:text-4xl font-light mb-4">Istaknuti kreatori</h2>
              <p className="text-muted">Otkrij neke od naših najboljih talenata</p>
            </div>
            <Link 
              href="/kreatori"
              className="hidden md:block text-sm text-muted hover:text-foreground transition-colors"
            >
              Vidi sve →
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {featuredCreators.map((creator) => (
              <Link key={creator.id} href={`/kreator/${creator.id}`}>
                <div className="group">
                  <div className="aspect-[3/4] sm:aspect-[4/5] relative rounded-xl sm:rounded-2xl overflow-hidden mb-2 sm:mb-4">
                    <Image
                      src={creator.photo}
                      alt={creator.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <h3 className="font-medium text-sm sm:text-base truncate">{creator.name}</h3>
                  <p className="text-xs sm:text-sm text-muted truncate">{creator.categories[0]} • {creator.location}</p>
                  <p className="text-xs sm:text-sm mt-0.5 sm:mt-1">od €{creator.priceFrom}</p>
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-10 md:hidden">
            <Link 
              href="/kreatori"
              className="text-sm text-muted hover:text-foreground transition-colors"
            >
              Vidi sve →
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-24 bg-primary text-white">
        <div className="max-w-4xl 2xl:max-w-5xl mx-auto px-6 lg:px-12 text-center">
          <h2 className="text-3xl lg:text-5xl font-light mb-6">
            Spreman da pronađeš savršenog kreatora?
          </h2>
          <p className="text-white/70 max-w-xl mx-auto mb-10">
            Pridruži se stotinama brendova koji već koriste UGC Executive 
            za pronalazak autentičnog sadržaja.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link 
              href="/register/biznis"
              className="px-8 py-4 bg-white text-primary rounded-full text-sm font-medium hover:bg-white/90 transition-colors"
            >
              Registruj se kao brend
            </Link>
            <Link 
              href="/kreatori"
              className="px-8 py-4 border border-white/30 rounded-full text-sm font-medium hover:bg-white/10 transition-colors"
            >
              Pretraži kreatore
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
