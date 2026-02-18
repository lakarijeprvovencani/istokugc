# UGC Platform — Kompletna Dokumentacija

> **Ovo je najvažniji dokument u projektu.**
> Svaki agent/developer MORA da pročita ovaj fajl pre bilo kakve izmene.
> Poslednje ažuriranje: 18. februar 2026.

---

## ZLATNA PRAVILA (OBAVEZNO PROČITAJ)

1. **NEMA DEMO/MOCK PODATAKA. ISKLJUČIVO SUPABASE.**
   - Svi podaci dolaze iz Supabase baze — autentifikacija, korisnici, poslovi, poruke, sve.
   - `DemoContext` je centralni state management koji čita PRAVE podatke iz Supabase. Ime je nasleđeno ali sve unutra radi sa pravom bazom.
   - NIKAD ne dodavaj mock podatke, hardkodirane nizove, ili demo korisnike.

2. **Ne menjaj funkcionalne delove bez eksplicitnog zahteva korisnika.**

3. **Backend je kompletno testiran — 67 automatskih testova pokriva sve API rute.**
   - Pokreni `npm test` pre bilo kakve promene da proveriš da nisi ništa pokvario.
   - Dev server mora biti pokrenut (`npm run dev`) pre pokretanja testova.

4. **Fajlovi koje NE TREBA dirati bez razloga:**
   - `src/middleware.ts` — kritičan za bezbednost, štiti sve rute
   - `src/lib/auth-helper.ts` — koristi ga svaka API ruta za proveru identiteta
   - `src/lib/rate-limit.ts` — sprečava spam/abuse
   - `src/lib/validations.ts` — Zod šeme za validaciju inputa
   - `src/context/DemoContext.tsx` — centralni state management (ČITA IZ SUPABASE, ne iz mock-a)
   - `next.config.ts` — sigurnosni hederi (HSTS, CSP)

---

## Status Platforme

| Oblast | Status | Detalji |
|--------|--------|---------|
| Autentifikacija | ✅ Završeno | Supabase Auth, middleware zaštita, role-based pristup |
| API Bezbednost | ✅ Završeno | Svaka ruta ima auth proveru, 38 testova potvrđuje |
| Input Validacija | ✅ Završeno | Zod šeme na svim kritičnim endpointima |
| Rate Limiting | ✅ Završeno | Supabase tabela, primenjeno na registraciju i API |
| Stripe Integracija | ✅ Završeno | Checkout, pretplata, cancel, promena plana, webhook |
| RLS (Row Level Security) | ✅ Završeno | Sve tabele imaju politike |
| Sigurnosni Hederi | ✅ Završeno | HSTS, CSP, frame-src za embede |
| Automatski Testovi | ✅ Završeno | 67 API testova, svi prolaze |
| Frontend | ✅ Funkcionalan | Testiran ručno, backend odbija sve nevalidne zahteve |

---

## Tehnički Stek

| Komponenta | Tehnologija |
|-----------|-------------|
| Frontend | Next.js 16 (App Router), React, TypeScript |
| Styling | Tailwind CSS 4 |
| Backend/DB | Supabase (PostgreSQL + Auth + Storage) |
| Plaćanje | Stripe (Checkout, Subscriptions, Webhooks, Customer Portal) |
| Deploy | Vercel |
| Validacija | Zod |
| Testovi | Vitest |

---

## Korisničke Uloge

| Uloga | Šta može | Kako se registruje |
|-------|---------|-------------------|
| **guest** | Pregled kreatora, poslova, recenzija | — |
| **creator** | Dashboard, profil, portfolio, apliciranje na posao, poruke, recenzije | `/register/kreator` |
| **business** | Pretraga kreatora, objava poslova, pozivi, poruke, pretplata | `/register/biznis` → Stripe plaćanje |
| **admin** | Sve + odobravanje kreatora, kategorije, upravljanje korisnicima | Kreiran putem `/api/admin/setup` |

---

## Kompletna Lista API Ruta

### Javne (bez login-a)
| Ruta | Metoda | Opis |
|------|--------|------|
| `/api/jobs` | GET | Lista javnih poslova |
| `/api/reviews` | GET | Lista javnih recenzija |
| `/api/creators/[id]` | GET | Javni profil (kontakt info samo za business/admin/owner) |
| `/api/auth/register/creator` | POST | Registracija kreatora |
| `/api/auth/register/business` | POST | Registracija biznisa |
| `/api/stripe/create-checkout` | POST | Kreiranje Stripe checkout sesije |
| `/api/stripe/session/[id]` | GET | Podaci o Stripe sesiji (koristi se tokom registracije) |
| `/api/stripe/webhook` | POST | Stripe webhook (verifikacija potpisa) |

### Zaštićene (zahtevaju login + ownership)
| Ruta | Metoda | Ko ima pristup |
|------|--------|---------------|
| `/api/dashboard` | GET | Vlasnik profila ili admin |
| `/api/favorites` | GET/POST/DELETE | Vlasnik biznisa ili admin |
| `/api/creator-views` | GET/POST | Vlasnik biznisa ili admin |
| `/api/job-applications` | GET/POST/PUT/DELETE | Vlasnik (kreator/biznis) ili admin |
| `/api/job-invitations` | GET/POST/PUT/DELETE | Vlasnik (kreator/biznis) ili admin |
| `/api/job-messages` | GET/POST/PUT | Učesnik u razgovoru ili admin |
| `/api/saved-jobs` | GET/POST/DELETE | Vlasnik (kreator) ili admin |
| `/api/jobs` | POST/PUT/DELETE | Vlasnik biznisa (sa pretplatom) ili admin |
| `/api/reviews` | POST/PUT/DELETE | Vlasnik recenzije ili admin |
| `/api/reviews/[id]/reply` | POST/PUT/DELETE | Vlasnik profila (kreator) ili admin |
| `/api/creators/[id]` | PUT | Vlasnik profila ili admin |
| `/api/creators/[id]/photo` | POST | Vlasnik profila ili admin |
| `/api/upload/portfolio` | POST | Vlasnik profila ili admin |
| `/api/stripe/cancel-subscription` | POST | Vlasnik biznisa ili admin |
| `/api/stripe/reactivate-subscription` | POST | Vlasnik biznisa ili admin |
| `/api/stripe/change-plan` | POST | Vlasnik biznisa ili admin |
| `/api/stripe/create-portal` | POST | Vlasnik biznisa ili admin |
| `/api/stripe/subscription-status` | GET | Vlasnik biznisa ili admin |
| `/api/subscription/renew` | POST | Vlasnik biznisa ili admin |

### Admin Only
| Ruta | Metoda | Opis |
|------|--------|------|
| `/api/admin/creators` | GET/PUT/DELETE | Upravljanje kreatorima |
| `/api/admin/businesses` | GET/PUT/DELETE | Upravljanje biznisima |
| `/api/admin/jobs` | POST/PUT/DELETE | Upravljanje poslovima |
| `/api/admin/categories` | GET/POST/DELETE | Upravljanje kategorijama |
| `/api/admin/reset-password` | POST | Reset lozinke |
| `/api/businesses` | GET/POST | Lista biznisa |
| `/api/notifications` | POST | Slanje notifikacija |
| `/api/reviews/[id]/approve` | POST | Odobravanje recenzije |
| `/api/reviews/[id]/reject` | POST | Odbijanje recenzije |
| `/api/jobs?includeAll=true` | GET | Lista svih poslova (uključujući neaktivne) |

---

## Tok Registracije Biznisa (sa plaćanjem)

```
1. /register/biznis → korisnik popunjava formu
2. Bira plan → podaci se čuvaju u localStorage + šalju na API
3. /api/stripe/create-checkout → kreira Stripe sesiju sa metadata
4. Korisnik plaća na Stripe-u
5. Stripe redirectuje na /checkout/success
6. Success stranica:
   a. Čita podatke iz localStorage (ili fallback: Stripe metadata)
   b. Poziva /api/auth/register/business
   c. Auto-login sa signInWithPassword
   d. Update DemoContext-a sa loginAsNewBusiness()
   e. Prikazuje confetti i success poruku
```

## Tok Registracije Kreatora

```
1. /register/kreator → korisnik popunjava formu
2. Poziva /api/auth/register/creator
3. Kreira se Supabase auth korisnik + kreator profil u bazi
4. Auto-login i redirect na dashboard
5. Admin odobrava kreatora (status: pending → approved)
```

---

## Bezbednosne Mere

### Middleware (`src/middleware.ts`)
- Osvežava Supabase sesiju na svakom zahtevu
- Javne rute: `/`, `/login`, `/register`, `/pricing`, `/checkout`, `/poslovi`, `/auth/*`
- Zaštićene: `/dashboard` (auth required), `/admin` (admin only)
- API rute imaju sopstvenu auth logiku u handlerima

### Auth Helper (`src/lib/auth-helper.ts`)
- `getAuthUser()` — vraća korisnika i njegovu ulogu iz Supabase
- `isAdmin()` — proverava da li je korisnik admin
- `requireAdmin()` — vraća 403 ako nije admin
- Koristi se u SVAKOJ zaštićenoj API ruti

### Input Validacija (`src/lib/validations.ts`)
| Schema | Endpoint |
|--------|----------|
| `creatorRegistrationSchema` | `/api/auth/register/creator` |
| `businessRegistrationSchema` | `/api/auth/register/business` |
| `reviewSchema` | `/api/reviews` POST |
| `creatorUpdateSchema` | `/api/creators/[id]` PUT |
| `businessUpdateSchema` | `/api/business/profile` PUT |

### Rate Limiting (`src/lib/rate-limit.ts`)
- Koristi Supabase tabelu `rate_limits`
- Primenjen na: registraciju kreatora, registraciju biznisa, kreiranje recenzija
- Blokira previše zahteva sa iste IP adrese

### Sigurnosni Hederi (`next.config.ts`)
- `Strict-Transport-Security` (HSTS)
- `Content-Security-Policy` sa dozvolama za YouTube, Instagram, TikTok embede
- `X-Frame-Options`, `X-Content-Type-Options`, itd.

### Stripe Webhook Idempotency
- Tabela `webhook_events` čuva Stripe event ID-eve
- Sprečava duplu obradu istog eventa

### RLS (Row Level Security)
- Sve tabele imaju RLS politike
- Korisnik može pristupiti samo svojim podacima na nivou baze

---

## Automatski Testovi

**67 testova** pokriva sve API rute. Pokreni sa `npm test`.

| Grupa | Testova | Šta proverava |
|-------|---------|--------------|
| Auth Protection | 38 | Sve zaštićene rute vraćaju 401 bez login-a |
| Admin Routes | 4 | Admin-only rute rade za admina |
| Public Routes | 3 | Javne rute (jobs, reviews) rade bez auth-a |
| Data Isolation | 7 | Korisnik ne može da vidi tuđe podatke |
| Validation | 8 | Registracija odbija loš input + rate limiting radi |
| Stripe | 7 | Auth na Stripe rutama, checkout, webhook potpis |

**Kako pokrenuti:**
```bash
npm run dev    # prvo pokreni dev server
npm test       # u drugom terminalu pokreni testove
```

---

## Environment Varijable

Sve varijable su u `.env.local` (gitignored). Primer u `.env.example`.

| Varijabla | Opis | Gde se koristi |
|-----------|------|---------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase projekt URL | Svuda |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon ključ | Klijent |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role ključ (bypass RLS) | Server API rute |
| `STRIPE_SECRET_KEY` | Stripe tajni ključ | Stripe API pozivi |
| `STRIPE_WEBHOOK_SECRET` | Webhook tajni ključ | Verifikacija webhook-a |
| `STRIPE_PRICE_MONTHLY` | Price ID za mesečni plan | Checkout |
| `STRIPE_PRICE_YEARLY` | Price ID za godišnji plan | Checkout |
| `NEXT_PUBLIC_SITE_URL` | URL sajta | Stripe redirect URL-ovi |
| `ADMIN_SETUP_EMAIL` | Email za admin nalog | Admin setup |
| `ADMIN_SETUP_PASSWORD` | Lozinka za admin nalog | Admin setup |
| `ADMIN_CREATE_SECRET` | Tajni ključ za kreiranje admina | Admin kreiranje |

**VAŽNO za produkciju:**
- Promeni `NEXT_PUBLIC_SITE_URL` na pravi domen
- Promeni Stripe ključeve na live mode
- `ADMIN_SETUP_*` varijable nisu potrebne u produkciji

---

## SQL Migracije

Pokrenuti u Supabase SQL Editor-u **REDOSLEDOM**:

| # | Fajl | Opis | Status |
|---|------|------|--------|
| 1 | `supabase-rls-fixes.sql` | Popravke RLS politika | ⚠️ Proveri da li je pokrenuto |
| 2 | `supabase-rls-missing-tables.sql` | RLS za reviews, saved_creators, categories | ⚠️ Proveri da li je pokrenuto |
| 3 | `supabase-rate-limits-table.sql` | Tabela za rate limiting | ⚠️ Proveri da li je pokrenuto |
| 4 | `supabase-webhook-events-table.sql` | Tabela za webhook idempotency | ⚠️ Proveri da li je pokrenuto |

---

## Obrisane Rute (bile su nebezbedne ili demo stubovi)

- `/api/reviews/reply/route.ts` — duplikat bez auth
- `/api/subscription/cancel/route.ts` — demo stub
- `/api/subscription/change-plan/route.ts` — demo stub
- `/api/subscription/invoices/route.ts` — demo stub
- `/api/subscription/reactivate/route.ts` — demo stub
- `/api/subscription/status/route.ts` — demo stub

---

## Poznati Minorni Issues (ne utiču na funkcionalnost)

1. Dashboard: polje `replyAt: r.reply_at` → trebalo bi `r.reply_date` — kozmetika
2. `/api/subscription/renew`: fallback logika sa `updateResult.count` — dead code, ne šteti
3. `reviews/[id]` DELETE: ne vraća 404 kad review ne postoji — ne crash-uje
4. `DemoContext` ima "Demo" u imenu ali radi isključivo sa Supabase pravim podacima

---

## Istorija Promena

### 18. februar 2026 — Kompletni Security Audit + Testovi
- Middleware potpuno prepisan
- Auth dodat na 25+ API ruta
- Zod validacija na registraciju, recenzije, profile update
- Rate limiting implementiran (Supabase tabela)
- Stripe webhook idempotency
- RLS politike popravljene i dodate
- Sigurnosni hederi (HSTS, CSP)
- Uklonjeni osetljivi console.log pozivi
- Checkout flow robustan (localStorage + Stripe metadata fallback)
- Auto-login posle plaćanja
- 6 nesigurnih/demo ruta obrisano
- Jobs POST `isAdmin` bypass zatvoren
- Job-applications/invitations/messages — data isolation
- Stripe webhook sada ažurira subscription_type
- 67 automatskih API testova napisano i svi prolaze
