'use client';

import { useState } from 'react';
import { useDemo } from '@/context/DemoContext';
import Link from 'next/link';
import Image from 'next/image';
import { mockCreators, pendingCreators, mockBusinesses, categories, Creator } from '@/lib/mockData';

type AdminTab = 'pending' | 'creators' | 'businesses' | 'categories';

export default function AdminPage() {
  const { currentUser } = useDemo();
  const [activeTab, setActiveTab] = useState<AdminTab>('pending');
  
  // State za kreatore koji čekaju
  const [localPending, setLocalPending] = useState<Creator[]>([...pendingCreators]);
  
  // State za odobrene kreatore
  const [localCreators, setLocalCreators] = useState<Creator[]>([...mockCreators]);
  
  // State za biznise
  const [localBusinesses, setLocalBusinesses] = useState([...mockBusinesses]);
  
  // State za kategorije
  const [localCategories, setLocalCategories] = useState([...categories]);
  const [newCategory, setNewCategory] = useState('');
  
  // State za editovanje
  const [editingCreator, setEditingCreator] = useState<Creator | null>(null);
  
  // Pretraga
  const [searchCreators, setSearchCreators] = useState('');
  const [searchBusinesses, setSearchBusinesses] = useState('');

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

  // Odobri kreatora
  const handleApprove = (id: string) => {
    const creator = localPending.find(c => c.id === id);
    if (creator) {
      const approvedCreator = { ...creator, approved: true };
      setLocalCreators(prev => [...prev, approvedCreator]);
      setLocalPending(prev => prev.filter(c => c.id !== id));
    }
  };

  // Odbij kreatora
  const handleReject = (id: string) => {
    setLocalPending(prev => prev.filter(c => c.id !== id));
  };

  // Obriši kreatora
  const handleDeleteCreator = (id: string) => {
    if (confirm('Da li ste sigurni da želite da obrišete ovog kreatora?')) {
      setLocalCreators(prev => prev.filter(c => c.id !== id));
    }
  };

  // Toggle vidljivost kreatora
  const handleToggleVisibility = (id: string) => {
    setLocalCreators(prev => prev.map(c => 
      c.id === id ? { ...c, approved: !c.approved } : c
    ));
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
    setLocalCreators(prev => prev.map(c => 
      c.id === updatedCreator.id ? updatedCreator : c
    ));
    setEditingCreator(null);
  };

  // Filtrirani kreatori
  const filteredCreators = localCreators.filter(c => 
    c.name.toLowerCase().includes(searchCreators.toLowerCase()) ||
    c.email.toLowerCase().includes(searchCreators.toLowerCase())
  );

  // Filtrirani biznisi
  const filteredBusinesses = localBusinesses.filter(b => 
    b.companyName.toLowerCase().includes(searchBusinesses.toLowerCase()) ||
    b.email.toLowerCase().includes(searchBusinesses.toLowerCase())
  );

  const tabs: { id: AdminTab; label: string; count?: number }[] = [
    { id: 'pending', label: 'Čekaju odobrenje', count: localPending.length },
    { id: 'creators', label: 'Kreatori', count: localCreators.length },
    { id: 'businesses', label: 'Biznisi', count: localBusinesses.length },
    { id: 'categories', label: 'Kategorije', count: localCategories.length },
  ];

  return (
    <div className="min-h-screen bg-secondary/30">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-12">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-light mb-2">Admin Panel</h1>
            <p className="text-muted">Upravljaj platformom</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted">Ulogovan kao:</span>
            <span className="px-4 py-2 bg-primary text-white rounded-full text-sm">Admin</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-primary text-white'
                  : 'bg-white border border-border hover:bg-secondary'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                  activeTab === tab.id ? 'bg-white/20' : 'bg-secondary'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl border border-border p-6">
          {/* Pending */}
          {activeTab === 'pending' && (
            <div>
              <h2 className="text-lg font-medium mb-6">Kreatori koji čekaju odobrenje</h2>
              
              {localPending.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">✅</div>
                  <p className="text-muted">Nema kreatora koji čekaju odobrenje</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {localPending.map((creator) => (
                    <div key={creator.id} className="border border-border rounded-xl p-6">
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
                          
                          <p className="text-sm mt-4">{creator.bio}</p>
                          
                          <div className="flex flex-wrap gap-2 mt-4">
                            {creator.categories.map((cat) => (
                              <span key={cat} className="px-3 py-1 bg-secondary rounded-full text-xs">
                                {cat}
                              </span>
                            ))}
                          </div>
                          
                          <div className="flex gap-3 mt-6">
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
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Creators */}
          {activeTab === 'creators' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-medium">Svi kreatori ({filteredCreators.length})</h2>
                <input
                  type="text"
                  placeholder="Pretraži po imenu ili emailu..."
                  value={searchCreators}
                  onChange={(e) => setSearchCreators(e.target.value)}
                  className="px-4 py-2 border border-border rounded-xl focus:outline-none focus:border-muted w-64"
                />
              </div>
              
              {filteredCreators.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted">Nema rezultata</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
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
                            <button
                              onClick={() => handleToggleVisibility(creator.id)}
                              className={`px-3 py-1 rounded-full text-xs cursor-pointer transition-colors ${
                                creator.approved 
                                  ? 'bg-success/10 text-success hover:bg-success/20' 
                                  : 'bg-warning/10 text-warning hover:bg-warning/20'
                              }`}
                            >
                              {creator.approved ? 'Vidljiv' : 'Skriven'}
                            </button>
                          </td>
                          <td className="py-4">
                            <div className="flex gap-2">
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
              )}
            </div>
          )}

          {/* Businesses */}
          {activeTab === 'businesses' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-medium">Svi biznisi ({filteredBusinesses.length})</h2>
                <input
                  type="text"
                  placeholder="Pretraži po imenu ili emailu..."
                  value={searchBusinesses}
                  onChange={(e) => setSearchBusinesses(e.target.value)}
                  className="px-4 py-2 border border-border rounded-xl focus:outline-none focus:border-muted w-64"
                />
              </div>
              
              {filteredBusinesses.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted">Nema rezultata</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
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
              )}
            </div>
          )}

          {/* Categories */}
          {activeTab === 'categories' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-medium">Kategorije ({localCategories.length})</h2>
              </div>
              
              <form onSubmit={handleAddCategory} className="flex gap-4 mb-8">
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="Nova kategorija..."
                  className="flex-1 px-5 py-3 border border-border rounded-xl focus:outline-none focus:border-muted"
                />
                <button
                  type="submit"
                  className="px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
                >
                  Dodaj
                </button>
              </form>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {localCategories.map((category) => (
                  <div 
                    key={category}
                    className="flex items-center justify-between p-4 bg-secondary rounded-xl group"
                  >
                    <span>{category}</span>
                    <button 
                      onClick={() => handleDeleteCategory(category)}
                      className="text-muted hover:text-error transition-colors opacity-0 group-hover:opacity-100"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

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
