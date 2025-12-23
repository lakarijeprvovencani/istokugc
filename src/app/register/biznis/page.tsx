'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDemo } from '@/context/DemoContext';

export default function RegisterBusinessPage() {
  const router = useRouter();
  const { setUserType } = useDemo();
  
  const [formData, setFormData] = useState({
    companyName: '',
    email: '',
    password: '',
    website: '',
    industry: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Demo: log in as business (unpaid initially)
    setUserType('businessUnpaid');
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen py-20">
      <div className="max-w-xl mx-auto px-6">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-light mb-3">Registruj se kao brend</h1>
          <p className="text-muted">Pronađi savršene UGC kreatore za tvoj brend</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-border rounded-3xl p-8 space-y-6">
          <div>
            <label className="text-sm text-muted mb-2 block">Ime kompanije *</label>
            <input
              type="text"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              placeholder="Ime tvoje firme"
              className="w-full px-5 py-4 border border-border rounded-xl focus:outline-none focus:border-muted"
              required
            />
          </div>

          <div>
            <label className="text-sm text-muted mb-2 block">Email adresa *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="firma@email.com"
              className="w-full px-5 py-4 border border-border rounded-xl focus:outline-none focus:border-muted"
              required
            />
            <p className="text-xs text-muted mt-2">Poslat ćemo ti verifikacioni email</p>
          </div>

          <div>
            <label className="text-sm text-muted mb-2 block">Lozinka *</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Minimum 8 karaktera"
              className="w-full px-5 py-4 border border-border rounded-xl focus:outline-none focus:border-muted"
              required
              minLength={8}
            />
          </div>

          <div>
            <label className="text-sm text-muted mb-2 block">Website</label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              placeholder="https://www.tvojsajt.com"
              className="w-full px-5 py-4 border border-border rounded-xl focus:outline-none focus:border-muted"
            />
          </div>

          <div>
            <label className="text-sm text-muted mb-2 block">Industrija</label>
            <select
              value={formData.industry}
              onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
              className="w-full px-5 py-4 border border-border rounded-xl focus:outline-none focus:border-muted bg-white"
            >
              <option value="">Izaberi industriju</option>
              <option value="beauty">Beauty & Kozmetika</option>
              <option value="fashion">Moda</option>
              <option value="tech">Tehnologija</option>
              <option value="food">Hrana & Piće</option>
              <option value="fitness">Fitness & Zdravlje</option>
              <option value="travel">Putovanja</option>
              <option value="finance">Finansije</option>
              <option value="other">Drugo</option>
            </select>
          </div>

          {/* Pricing info */}
          <div className="bg-secondary rounded-xl p-5 mt-8">
            <div className="text-sm uppercase tracking-wider text-muted mb-4">Planovi pretplate</div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl p-5 border border-border">
                <div className="text-xl font-light mb-1">€49</div>
                <div className="text-sm text-muted mb-3">mesečno</div>
                <ul className="text-sm space-y-2 text-muted">
                  <li>✓ Pristup svim kreatorima</li>
                  <li>✓ Kontakt informacije</li>
                  <li>✓ Neograničena pretraga</li>
                </ul>
              </div>
              <div className="bg-white rounded-xl p-5 border-2 border-primary relative">
                <div className="absolute -top-3 right-4 bg-primary text-white text-xs px-3 py-1 rounded-full">
                  Uštedi 17%
                </div>
                <div className="text-xl font-light mb-1">€490</div>
                <div className="text-sm text-muted mb-3">godišnje</div>
                <ul className="text-sm space-y-2 text-muted">
                  <li>✓ Sve od mesečnog plana</li>
                  <li>✓ 2 meseca besplatno</li>
                  <li>✓ Prioritetna podrška</li>
                </ul>
              </div>
            </div>
            <p className="text-xs text-muted mt-4 text-center">
              Izabrat ćeš plan nakon registracije
            </p>
          </div>

          <label className="flex items-start gap-3 mt-6">
            <input type="checkbox" required className="mt-1" />
            <span className="text-sm text-muted">
              Slažem se sa{' '}
              <Link href="#" className="underline">uslovima korišćenja</Link>
              {' '}i{' '}
              <Link href="#" className="underline">politikom privatnosti</Link>
            </span>
          </label>

          <button
            type="submit"
            className="w-full py-4 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
          >
            Registruj se
          </button>
        </form>

        <div className="relative my-10">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-muted">ili</span>
          </div>
        </div>

        <button
          onClick={() => {
            setUserType('businessUnpaid');
            router.push('/dashboard');
          }}
          className="w-full py-4 border border-border rounded-xl font-medium hover:bg-secondary transition-colors flex items-center justify-center gap-3"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Nastavi sa Google-om
        </button>

        <p className="text-center text-sm text-muted mt-10">
          Već imaš nalog?{' '}
          <Link href="/login" className="text-foreground hover:underline">
            Prijavi se
          </Link>
        </p>

        <p className="text-center text-sm text-muted mt-4">
          Želiš da se registruješ kao kreator?{' '}
          <Link href="/register/kreator" className="text-foreground hover:underline">
            Registruj se kao kreator
          </Link>
        </p>
      </div>
    </div>
  );
}

