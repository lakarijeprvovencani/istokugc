'use client';

import { useState, useEffect } from 'react';
import { useDemo, UserSettings } from '@/context/DemoContext';
import Link from 'next/link';

type SettingsTab = 'profile' | 'notifications' | 'subscription' | 'security';

export default function SettingsPage() {
  const { currentUser, isHydrated, userSettings, updateSettings } = useDemo();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Local form state
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: '',
    companyName: '',
  });
  
  const [notificationForm, setNotificationForm] = useState({
    email: true,
    newCreators: true,
    promotions: false,
  });

  // Initialize form with current user data
  useEffect(() => {
    if (isHydrated) {
      setProfileForm({
        name: userSettings.profile.name || currentUser.name || '',
        email: userSettings.profile.email || currentUser.email || '',
        phone: userSettings.profile.phone || '',
        companyName: userSettings.profile.companyName || currentUser.companyName || '',
      });
      setNotificationForm(userSettings.notifications);
    }
  }, [isHydrated, currentUser, userSettings]);

  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted">Učitavanje...</div>
      </div>
    );
  }

  if (currentUser.type === 'guest') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary/30">
        <div className="max-w-md mx-auto px-6 text-center">
          <div className="bg-white rounded-3xl p-10 border border-border shadow-sm">
            <div className="text-5xl mb-6">🔒</div>
            <h1 className="text-2xl font-light mb-3">Nisi prijavljen</h1>
            <p className="text-muted mb-8">
              Prijavi se da bi pristupio podešavanjima naloga.
            </p>
            <Link 
              href="/login"
              className="block w-full py-4 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
            >
              Prijavi se
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleSaveProfile = () => {
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      updateSettings({
        profile: profileForm,
      });
      setIsSaving(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }, 500);
  };

  const handleSaveNotifications = () => {
    setIsSaving(true);
    setTimeout(() => {
      updateSettings({
        notifications: notificationForm,
      });
      setIsSaving(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }, 500);
  };

  const tabs = [
    { id: 'profile' as const, label: '👤 Profil', icon: '👤' },
    { id: 'notifications' as const, label: '🔔 Obaveštenja', icon: '🔔' },
    ...(currentUser.type === 'business' ? [{ id: 'subscription' as const, label: '💳 Pretplata', icon: '💳' }] : []),
    { id: 'security' as const, label: '🔒 Sigurnost', icon: '🔒' },
  ];

  return (
    <div className="min-h-screen bg-secondary/30">
      <div className="max-w-4xl mx-auto px-6 lg:px-12 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard" className="text-sm text-muted hover:text-foreground mb-2 block">
            ← Nazad na dashboard
          </Link>
          <h1 className="text-3xl font-light">Podešavanja naloga</h1>
          <p className="text-muted mt-1">Upravljaj svojim profilom i preferencama</p>
        </div>

        {/* Success message */}
        {showSuccess && (
          <div className="mb-6 bg-success/10 border border-success/20 rounded-xl p-4 flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-success">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            <p className="text-sm text-success font-medium">Podešavanja su uspešno sačuvana!</p>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-border overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'text-primary border-b-2 border-primary bg-primary/5'
                    : 'text-muted hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="p-6 lg:p-8">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-medium mb-1">Informacije o profilu</h2>
                  <p className="text-sm text-muted">
                    Ažuriraj svoje osnovne informacije
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm text-muted mb-2">
                      {currentUser.type === 'business' ? 'Ime kontakta' : 'Ime i prezime'}
                    </label>
                    <input
                      type="text"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:border-primary"
                      placeholder="Unesite ime"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-muted mb-2">Email adresa</label>
                    <input
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:border-primary"
                      placeholder="email@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-muted mb-2">Telefon</label>
                    <input
                      type="tel"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:border-primary"
                      placeholder="+381 61 123 4567"
                    />
                  </div>
                  {currentUser.type === 'business' && (
                    <div>
                      <label className="block text-sm text-muted mb-2">Naziv kompanije</label>
                      <input
                        type="text"
                        value={profileForm.companyName}
                        onChange={(e) => setProfileForm({ ...profileForm, companyName: e.target.value })}
                        className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:border-primary"
                        placeholder="Naziv vaše kompanije"
                      />
                    </div>
                  )}
                </div>

                <div className="pt-6 border-t border-border flex justify-end">
                  <button
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className="px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {isSaving ? 'Čuvanje...' : 'Sačuvaj promene'}
                  </button>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-medium mb-1">Podešavanja obaveštenja</h2>
                  <p className="text-sm text-muted">
                    Izaberi koje notifikacije želiš da primaš
                  </p>
                </div>

                <div className="space-y-4">
                  <label className="flex items-center justify-between p-4 bg-secondary/50 rounded-xl cursor-pointer hover:bg-secondary transition-colors">
                    <div>
                      <p className="font-medium">Email obaveštenja</p>
                      <p className="text-sm text-muted">Primaj važna obaveštenja putem email-a</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notificationForm.email}
                      onChange={(e) => setNotificationForm({ ...notificationForm, email: e.target.checked })}
                      className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
                    />
                  </label>

                  <label className="flex items-center justify-between p-4 bg-secondary/50 rounded-xl cursor-pointer hover:bg-secondary transition-colors">
                    <div>
                      <p className="font-medium">Novi kreatori</p>
                      <p className="text-sm text-muted">Obavesti me kada se novi kreatori registruju</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notificationForm.newCreators}
                      onChange={(e) => setNotificationForm({ ...notificationForm, newCreators: e.target.checked })}
                      className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
                    />
                  </label>

                  <label className="flex items-center justify-between p-4 bg-secondary/50 rounded-xl cursor-pointer hover:bg-secondary transition-colors">
                    <div>
                      <p className="font-medium">Promotivni sadržaj</p>
                      <p className="text-sm text-muted">Primaj informacije o specijalnim ponudama</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notificationForm.promotions}
                      onChange={(e) => setNotificationForm({ ...notificationForm, promotions: e.target.checked })}
                      className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
                    />
                  </label>
                </div>

                <div className="pt-6 border-t border-border flex justify-end">
                  <button
                    onClick={handleSaveNotifications}
                    disabled={isSaving}
                    className="px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {isSaving ? 'Čuvanje...' : 'Sačuvaj promene'}
                  </button>
                </div>
              </div>
            )}

            {/* Subscription Tab (Business only) */}
            {activeTab === 'subscription' && currentUser.type === 'business' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-medium mb-1">Detalji pretplate</h2>
                  <p className="text-sm text-muted">
                    Upravljaj svojom pretplatom i plaćanjima
                  </p>
                </div>

                <div className="bg-secondary/50 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="font-medium">
                        {currentUser.subscriptionPlan === 'yearly' ? 'Godišnji plan' : 'Mesečni plan'}
                      </p>
                      <p className="text-sm text-muted">
                        {currentUser.subscriptionPlan === 'yearly' ? '€490/godina' : '€49/mesec'}
                      </p>
                    </div>
                    <span className={`px-4 py-1.5 rounded-full text-sm flex items-center gap-2 ${
                      currentUser.subscriptionStatus === 'active' 
                        ? 'bg-success/10 text-success' 
                        : 'bg-error/10 text-error'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${
                        currentUser.subscriptionStatus === 'active' ? 'bg-success' : 'bg-error'
                      }`}></span>
                      {currentUser.subscriptionStatus === 'active' ? 'Aktivna' : 'Istekla'}
                    </span>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t border-border">
                    <div>
                      <p className="text-sm text-muted">Sledeće plaćanje</p>
                      <p className="font-medium">
                        {currentUser.subscriptionExpiresAt 
                          ? new Date(currentUser.subscriptionExpiresAt).toLocaleDateString('sr-RS', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })
                          : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted">Metod plaćanja</p>
                      <p className="font-medium">•••• 4242</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4">
                  <button className="px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors">
                    Upravljaj pretplatom
                  </button>
                  <button className="px-6 py-3 border border-border rounded-xl font-medium hover:bg-secondary transition-colors">
                    Istorija plaćanja
                  </button>
                  <button className="px-6 py-3 text-error hover:bg-error/10 rounded-xl font-medium transition-colors">
                    Otkaži pretplatu
                  </button>
                </div>

                <div className="bg-primary/5 rounded-xl p-4">
                  <p className="text-sm">
                    <strong>Demo režim:</strong> U produkciji, ovi dugmići bi otvorili Stripe Customer Portal za upravljanje pretplatom.
                  </p>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-medium mb-1">Sigurnost naloga</h2>
                  <p className="text-sm text-muted">
                    Zaštiti svoj nalog sa jakom lozinkom
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-muted mb-2">Trenutna lozinka</label>
                    <input
                      type="password"
                      className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:border-primary"
                      placeholder="••••••••"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-muted mb-2">Nova lozinka</label>
                    <input
                      type="password"
                      className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:border-primary"
                      placeholder="••••••••"
                    />
                    <p className="text-xs text-muted mt-1">Minimum 8 karaktera, uključujući broj i specijalni karakter</p>
                  </div>
                  <div>
                    <label className="block text-sm text-muted mb-2">Potvrdi novu lozinku</label>
                    <input
                      type="password"
                      className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:border-primary"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div className="pt-6 border-t border-border flex justify-end">
                  <button className="px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors">
                    Promeni lozinku
                  </button>
                </div>

                <div className="pt-6 border-t border-border">
                  <h3 className="font-medium text-error mb-2">Opasna zona</h3>
                  <p className="text-sm text-muted mb-4">
                    Brisanje naloga je trajno i ne može se poništiti.
                  </p>
                  <button className="px-6 py-3 border border-error text-error rounded-xl font-medium hover:bg-error/10 transition-colors">
                    Obriši nalog
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

