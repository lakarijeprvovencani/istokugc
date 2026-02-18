# UGC Platform — Promene i Arhitektura

> Ovaj dokument služi kao referenca za sve buduće agente/developere.
> Poslednje ažuriranje: 18. februar 2026.

---

## VAŽNO: Pravila projekta

1. **NEMA DEMO/MOCK PODATAKA.** Svi podaci dolaze iz Supabase. `DemoContext` je zapravo state management koji čita prave podatke iz Supabase — ime je nasleđeno ali sve unutra radi sa pravom bazom.
2. **Supabase** je jedini backend — autentifikacija, baza, storage.
3. **Stripe** za plaćanje (test mode, prelazi na live).
4. **Ne menjaj funkcionalne delove bez eksplicitnog zahteva korisnika.**

---

## Tehnički stek

| Komponenta | Tehnologija |
|-----------|-------------|
| Frontend | Next.js (App Router), React, TypeScript |
| Styling | Tailwind CSS 4 |
| Backend/DB | Supabase (PostgreSQL + Auth + Storage) |
| Plaćanje | Stripe (Checkout, Subscriptions, Webhooks, Customer Portal) |
| Deploy | Vercel |
| Validacija | Zod |

---

## Struktura korisničkih uloga

| Uloga | Pristup |
|-------|---------|
| **guest** | Javne stranice, registracija, pregled kreatora/poslova |
| **creator** | Dashboard, profil, portfolio, aplikacije za posao, poruke |
| **business** | Dashboard, pretraga kreatora, objava poslova, poruke, pretplata |
| **admin** | Sve + admin panel (odobravanje kreatora, upravljanje kategorijama, itd.) |

---

## Bezbednosne promene (Security Audit)

### Middleware (`src/middleware.ts`)
- Potpuno prepisan sa pravilnom Supabase SSR integracijom
- Javne rute: `/`, `/login`, `/register`, `/pricing`, `/checkout`, `/poslovi`, `/auth/*`
- Zaštićene rute: `/dashboard` (auth required), `/admin` (admin only)
- API rute imaju sopstvenu autentifikaciju u handlerima

### API Rute — Auth Provere
Svaka API ruta koristi `getAuthUser()` iz `src/lib/auth-helper.ts` za proveru identiteta. Admin rute koriste `isAdmin()` ili `requireAdmin()`.

**Zaštićene rute (dodat auth gde nije postojao):**
- `/api/stripe/cancel-subscription` — ownership + admin
- `/api/stripe/reactivate-subscription` — ownership + admin
- `/api/stripe/create-portal` — ownership + admin
- `/api/stripe/subscription-status` — ownership + admin
- `/api/stripe/session/[sessionId]` — BEZ auth (koristi se tokom registracije pre login-a)
- `/api/subscription/renew` — ownership + admin
- `/api/businesses` — admin only
- `/api/creator-views` — ownership + admin
- `/api/favorites` GET — ownership + admin
- `/api/job-applications` GET — ownership provera
- `/api/job-invitations` GET — ownership provera
- `/api/job-messages` GET — ownership provera
- `/api/saved-jobs` — ownership + admin
- `/api/jobs` — `includeAll=true` zahteva admin
- `/api/notifications` POST — admin only
- `/api/reviews/[id]/approve` — admin only
- `/api/reviews/[id]/reject` — admin only
- `/api/reviews/[id]/reply` — ownership (creator) + admin
- `/api/reviews/[id]` PUT/DELETE — ownership + admin
- `/api/upload/portfolio` — ownership + admin
- `/api/creators/[id]/photo` — ownership + admin
- `/api/admin/*` (jobs, creators, businesses, categories, reset-password) — admin only

**Rute bez auth (namerno):**
- `/api/auth/register/creator` — javna registracija
- `/api/auth/register/business` — javna registracija
- `/api/stripe/create-checkout` — pre-login tok
- `/api/stripe/webhook` — Stripe signature verification
- `/api/creators/[id]` GET — javni profil (kontakt info samo za business/admin/owner)
- `/api/reviews` GET — javne recenzije
- `/api/jobs` GET (bez `includeAll`) — javni poslovi

### Obrisane rute
- `/api/reviews/reply/route.ts` — duplikat bez auth, obrisan
- `/api/subscription/cancel/route.ts` — demo stub, obrisan
- `/api/subscription/change-plan/route.ts` — demo stub, obrisan
- `/api/subscription/invoices/route.ts` — demo stub, obrisan
- `/api/subscription/reactivate/route.ts` — demo stub, obrisan
- `/api/subscription/status/route.ts` — demo stub, obrisan

### Hardkodirani tajni ključevi
- `/api/admin/create` — prebačen na `ADMIN_CREATE_SECRET` env var
- `/api/admin/setup` — prebačen na `ADMIN_SETUP_EMAIL`/`ADMIN_SETUP_PASSWORD` env vars, onemogućen u produkciji

### Sigurnosni hederi (`next.config.ts`)
- Dodat `Strict-Transport-Security` (HSTS)
- Dodat `Content-Security-Policy` sa dozvolama za YouTube, Instagram, TikTok embede
- `frame-src` uključuje: youtube.com, instagram.com, tiktok.com
- `media-src` konfigurisan za Supabase storage

### Uklanjanje osetljivih logova
- Uklonjeni `console.log` pozivi koji su logovali email adrese, lozinke, Stripe podatke
- `/api/stripe/webhook` — uklonjeno logovanje Stripe event podataka
- `/api/creator-views` — uklonjeno logovanje korisničkih podataka
- `/api/auth/register/creator` — uklonjeno logovanje registracionih podataka
- `/lib/email.ts` — uklonjeno logovanje PII (email adrese, imena)

---

## Input Validacija (Zod)

Fajl: `src/lib/validations.ts`

| Schema | Koristi se u |
|--------|-------------|
| `creatorRegistrationSchema` | `/api/auth/register/creator` |
| `businessRegistrationSchema` | `/api/auth/register/business` |
| `reviewSchema` | `/api/reviews` POST |
| `creatorUpdateSchema` | `/api/creators/[id]` PUT |
| `businessUpdateSchema` | `/api/business/profile` PUT |

---

## Rate Limiting

Fajl: `src/lib/rate-limit.ts`

- Koristi Supabase tabelu `rate_limits` (ne eksterni servis)
- SQL za kreiranje tabele: `supabase-rate-limits-table.sql`
- Limiteri: `getAuthLimiter` (registracija), `getApiLimiter` (API pozivi)
- Primenjen na: registraciju kreatora, registraciju biznisa, kreiranje recenzija

---

## Stripe Webhook Idempotency

- Tabela `webhook_events` čuva Stripe event ID-eve
- SQL: `supabase-webhook-events-table.sql`
- Pre obrade svakog webhook-a, proverava se da li je event već procesiran
- Sprečava duplu obradu istog eventa

---

## RLS (Row Level Security) Popravke

### `supabase-rls-fixes.sql`
- Ispravljen RLS za: `job_applications`, `job_invitations`, `job_messages`, `creator_views`, `saved_creators`
- Pravilno mapiranje `business_id`/`creator_id` na `auth.uid()` preko `businesses`/`creators` tabela

### `supabase-rls-missing-tables.sql`
- Dodat RLS za tabele: `reviews`, `saved_creators`, `categories`
- Politike bazirane na ulogama (kreator, biznis, admin)

---

## Checkout Flow (Plaćanje + Registracija)

### Problem koji je rešen
`localStorage` se koristio za čuvanje registracionih podataka između stranica. Ovo puca kad se domen promeni (localhost → Vercel) ili kad se `localStorage` obriše.

### Rešenje
1. **`/api/stripe/create-checkout`** — Prima `registrationData` i čuva u Stripe session metadata
2. **`/checkout/page.tsx`** — Prosleđuje kompletne registracione podatke u API
3. **`/checkout/success/page.tsx`** — Pokušava localStorage, fallback na Stripe metadata
4. **`/api/stripe/session/[sessionId]`** — Vraća metadata (bez auth jer se koristi pre login-a)

### Auto-login posle plaćanja
- Success stranica poziva `loginAsNewBusiness()` iz DemoContext-a
- DemoContext ima `onAuthStateChange` listener koji detektuje nove Supabase sesije
- `checkSupabaseSession()` čita prave podatke iz Supabase baze

---

## Page States (Loading/Error)

Dodate `error.tsx` i `loading.tsx` stranice za:
- `/` (globalni error boundary)
- `/dashboard`
- `/kreatori`
- `/poslovi`

---

## UI Promene

### Portfolio prikaz
- Dashboard: `grid-cols-3 sm:grid-cols-4 lg:grid-cols-5`, `aspect-square`
- Javni profil: `grid-cols-2 md:grid-cols-3`, `aspect-square`

### Avatar u headeru
- `loginAsNewCreator` i `loginAsNewBusiness` u DemoContext-u sada čuvaju `photo`/`logo`
- Login stranica prosleđuje ove parametre

---

## Environment Varijable

Sve varijable su u `.env.local` (gitignored). Primer u `.env.example`.

| Varijabla | Opis |
|-----------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase projekt URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon ključ |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role ključ (server-side only) |
| `STRIPE_SECRET_KEY` | Stripe tajni ključ |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook tajni ključ |
| `STRIPE_PRICE_MONTHLY` | Stripe Price ID za mesečni plan |
| `STRIPE_PRICE_YEARLY` | Stripe Price ID za godišnji plan |
| `NEXT_PUBLIC_SITE_URL` | URL sajta (localhost ili Vercel URL) |
| `ADMIN_SETUP_EMAIL` | Email za admin nalog |
| `ADMIN_SETUP_PASSWORD` | Lozinka za admin nalog |
| `ADMIN_CREATE_SECRET` | Tajni ključ za kreiranje admina |

---

## SQL Migracije (treba pokrenuti u Supabase SQL Editor)

| Fajl | Opis |
|------|------|
| `supabase-rls-fixes.sql` | Popravke RLS politika za postojeće tabele |
| `supabase-rls-missing-tables.sql` | RLS za reviews, saved_creators, categories |
| `supabase-rate-limits-table.sql` | Tabela za rate limiting |
| `supabase-webhook-events-table.sql` | Tabela za webhook idempotency |

---

## Tok registracije biznisa

1. Korisnik popunjava formu na `/register/biznis`
2. Bira plan → podaci se čuvaju u localStorage + šalju na `/api/stripe/create-checkout`
3. Stripe checkout sesija se kreira sa registracionim podacima u metadata
4. Korisnik plaća na Stripe-u
5. Stripe redirectuje na `/checkout/success?plan=...&session_id=...`
6. Success stranica:
   a. Čita podatke iz localStorage (ili fallback: Stripe metadata)
   b. Poziva `/api/auth/register/business` za kreiranje naloga
   c. Auto-login sa `signInWithPassword`
   d. Update DemoContext-a sa `loginAsNewBusiness()`
   e. Prikazuje confetti i success poruku

---

## Tok registracije kreatora

1. Korisnik popunjava formu na `/register/kreator`
2. Poziva `/api/auth/register/creator`
3. Kreira se Supabase auth korisnik + kreator profil u bazi
4. Auto-login i redirect na dashboard

---

## Dodatne popravke (18. feb 2026, runda 2)

1. **Jobs POST `isAdmin` bypass** — `isAdmin` flag se sada čita iz `user.role` na serveru, a ne iz request body-ja. Sprečava zaobilaženje provere pretplate.
2. **Job-applications/invitations GET** — non-admin korisnici moraju proslediti svoj `creatorId` ili `businessId`. Ne mogu više da listaju sve podatke iz baze.
3. **Job-messages GET** — pre vraćanja poruka, proverava se da li je korisnik učesnik u toj aplikaciji (kreator ili biznis).
4. **Stripe webhook `subscription_type`** — kad Stripe pošalje `customer.subscription.updated`, webhook sada čita price ID i ažurira `subscription_type` (monthly/yearly) u bazi.

---

## Poznati minorni issues (ne utiču na funkcionalnost)

1. Dashboard: polje `replyAt: r.reply_at` trebalo bi da bude `r.reply_date` — kozmetika
2. `/api/subscription/renew`: fallback logika koristi `updateResult.count` koji ne postoji — dead code, ne šteti
3. `reviews/[id]` DELETE: ne vraća 404 kad review ne postoji — ne crash-uje, samo ne radi ništa
4. `DemoContext` ima "Demo" u imenu ali radi isključivo sa Supabase pravim podacima

---

## Fajlovi koje NE TREBA dirati bez razloga

- `src/middleware.ts` — kritičan za bezbednost
- `src/lib/auth-helper.ts` — koristi ga svaka API ruta
- `src/lib/rate-limit.ts` — rate limiting logika
- `src/lib/validations.ts` — Zod šeme
- `src/context/DemoContext.tsx` — centralni state management
- `next.config.ts` — sigurnosni hederi i CSP
