# ISTOK / UGC Select — Kompletan vodič za aplikaciju

> **Za koga je ovaj fajl:** developera (Claude Code / Cursor) koji preuzima projekat.  
> **Cilj:** da brzo razumeš šta app radi, gde je šta u kodu, kako se pokreće i šta je bitno za izmene.  
> **Važno:** stariji fajlovi (`AUDIT_REPORT.md`, `DATABASE_INTEGRATION.md`, `API_ROUTES_UPDATE.md`) su delimično zastareli (govore o mock/demo/NextAuth/Prisma). **Ovaj fajl opisuje trenutno stanje koda.**

---

## 1. Šta je proizvod

**UGC Select** je marketplace platforma koja povezuje:

| Uloga | Šta radi |
|--------|----------|
| **Creator** | UGC kreator — profil, portfolio, prijave na poslove, poruke, odgovori na invite/recenzije |
| **Business** | Brend/firma — pretplata (Stripe), pregled kreatora, favoriti, objavljivanje poslova, invite, chat, recenzije |
| **Admin** | Moderacija — odobravanje kreatora/poslova/recenzija, kategorije, pregled biznisa |

**Branding u UI:** UGC Select  
**Produkcija:** https://app.ugcexecutive.com  
**GitHub:** https://github.com/lakarijeprvovencani/istokugc  
**Hosting:** Vercel projekat `ugc-platform`  
**Baza / Auth / Storage:** Supabase (kod klijenta)  
**Domen / DNS:** Oblak Host (kod klijenta)  
**Plaćanja:** Stripe (kod klijenta)

---

## 2. Tech stack

| Layer | Tehnologija |
|--------|-------------|
| Framework | **Next.js 16.0.8** (App Router) |
| UI | **React 19.2.1** + **Tailwind CSS v4** |
| Auth + DB + Storage | **Supabase** (`@supabase/supabase-js`, `@supabase/ssr`) |
| Plaćanja | **Stripe** (`stripe` ^20) |
| Jezik | TypeScript |
| Node | **20.x** (`.nvmrc`) |
| Font | Outfit (Google) u `src/app/layout.tsx` |
| Extra | `canvas-confetti`, `react-easy-crop` |

**Nije u dependencies (iako se pominje u starim MD):** NextAuth, Prisma, Resend, Sentry, Cloudflare R2/AWS SDK.

**Scripts:**
```bash
npm run dev      # lokalni development
npm run build    # production build
npm run start    # pokreni build
npm run lint
```

---

## 3. Kako lokalno pokrenuti

1. Clone: `git clone https://github.com/lakarijeprvovencani/istokugc.git`
2. `npm install`
3. Napravi `.env.local` (vrednosti povuci sa Vercela: Project → Settings → Environment Variables, ili od klijenta)
4. `npm run dev`
5. Otvori app (obično `http://localhost:3000`; neki fallback-ovi u kodu pominju `9898`)

### Obavezne env varijable

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=                    # Postgres URL (opciono za direktan pristup)

# App URL-ovi
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_PRICE_MONTHLY=
STRIPE_PRICE_YEARLY=
STRIPE_WEBHOOK_SECRET=

# Leftover (stari plan, ne koristi se aktivno u runtime-u)
NEXTAUTH_SECRET=
NEXTAUTH_URL=
AUTH_SECRET=
```

### Na Vercelu postoje i (delimično leftover)

| Env | Status |
|-----|--------|
| `RESEND_*` | Ključevi postoje, ali Resend SDK **nije aktivan** u kodu |
| `R2_*` | Cloudflare R2 leftover — **nije u kodu**, upload ide na Supabase Storage |
| `SENTRY_*` | Nije integrisan u ovaj package |

---

## 4. Uloge i dozvole (produkcijska namera)

Tipovi: `src/types/index.ts` → `UserRole = 'guest' | 'creator' | 'business' | 'admin'`

### Guest
- Vidi landing, listing kreatora, profil kreatora, poslove, pricing, register/login
- Ne može dashboard, admin, aplikacije, poruke, favorite (API traži auth gde je zaštićeno)

### Creator
1. Registracija → status `pending`
2. Admin odobrava → `approved` (tek tad je vidljiv u pretrazi)
3. Dashboard: profil, statistika, poslovi (prijave + invitations), poruke
4. Portfolio upload (Supabase Storage bucket `portfolio`)
5. Aplicira na poslove, čuva poslove (`saved_jobs`), odgovara na invite/recenzije

### Business
1. Birа plan → Stripe Checkout → na success kreira se nalog
2. Pretplata na `businesses` (`subscription_status`, Stripe IDs, `expires_at`)
3. Pregled kreatora, favoriti (`saved_creators`), creator views
4. Kreira poslove (status `pending` dok admin ne odobri → `open`)
5. Invite kreatora, chat (`job_messages`), recenzije
6. Stripe Customer Portal / cancel / change plan

### Admin
- Panel `/admin`: pending creators, all creators, businesses, categories, reviews, jobs
- API: `/api/admin/*`

### Matrica (namera)

| Akcija | Guest | Creator | Business | Admin |
|--------|-------|---------|----------|-------|
| Pregled kreatora | delimično | ✅ | ✅ | ✅ |
| Kontakt info | ❌ | ❌ | ✅ | ✅ |
| Edit svog profila | ❌ | ✅ | ✅ | ✅ |
| Admin panel | ❌ | ❌ | ❌ | ✅ |
| Ostavi recenziju | ❌ | ❌ | ✅ | — |
| Moderacija recenzija | ❌ | ❌ | ❌ | ✅ |
| Kreiraj posao | ❌ | ❌ | ✅ (aktivan sub) | ✅ |

---

## 5. Frontend mape (stranice)

Sve je u `src/app/` (App Router).

| Path | Fajl | Svrha |
|------|------|--------|
| `/` | `page.tsx` | Landing — hero, kategorije, featured creators |
| `/login` | `login/page.tsx` | Supabase `signInWithPassword` + sync uloge u context |
| `/register` | `register/page.tsx` | Izbor tipa naloga |
| `/register/kreator` | `register/kreator/page.tsx` | Registracija kreatora |
| `/register/kreator/cekanje` | `register/kreator/cekanje/page.tsx` | Čeka admin approval |
| `/register/biznis` | `register/biznis/page.tsx` | Ulaz u biznis signup / plan |
| `/pricing` | `pricing/page.tsx` | Prikaz planova |
| `/checkout` | `checkout/page.tsx` | Pokretanje Stripe Checkout |
| `/checkout/success` | `checkout/success/page.tsx` | Posle plaćanja: create business ili renew |
| `/checkout/cancel` | `checkout/cancel/page.tsx` | Otkazan checkout |
| `/kreatori` | `kreatori/page.tsx` | Directory odobrenih kreatora |
| `/kreator/[id]` | `kreator/[id]/page.tsx` | Javni profil + portfolio + reviews |
| `/poslovi` | `poslovi/page.tsx` | Job board |
| `/poslovi/[id]` | `poslovi/[id]/page.tsx` | Detalj posla + apply / save |
| `/dashboard` | `dashboard/page.tsx` | **Glavni panel** (veliki fajl ~8000 LOC) — creator ILI business UI |
| `/dashboard/reviews` | `dashboard/reviews/page.tsx` | Reviews fokus |
| `/dashboard/favorites` | `dashboard/favorites/page.tsx` | Favoriti (biznis) |
| `/dashboard/settings` | `dashboard/settings/page.tsx` | Podešavanja naloga |
| `/admin` | `admin/page.tsx` | Admin panel (~3500 LOC) |
| `/auth/verify-email` | `auth/verify-email/page.tsx` | UI za verifikaciju / resend |
| `/auth/forgot-password` | `auth/forgot-password/page.tsx` | Reset email |
| `/auth/reset-password` | `auth/reset-password/page.tsx` | Nova lozinka |
| `/auth/error` | `auth/error/page.tsx` | Auth greške |
| `/auth/callback` | `auth/callback/route.ts` | Exchange code za session (nije page) |

Layout: `src/app/layout.tsx` — `DemoProvider` + Header/Footer.

---

## 6. Dashboard i Admin — struktura tabova

### Creator dashboard (`/dashboard`)
Tabovi: `overview` | `reviews` (label „Statistika“) | `poslovi` | `poruke`

- **Overview:** edit bio, kategorije, platforme, jezici, kontakt, portfolio
- **Statistika:** profile views, jobs/invitations, reviews
- **Poslovi:** applications + invitations
- **Poruke:** chat po prijavi (`ChatModal`)

### Business dashboard (`/dashboard`)
Tabovi: `pregled` | `poslovi` | `poruke`

- **Pregled:** company profile, logo, subscription status
- **Poslovi:** CRUD + pregled prijava
- **Poruke:** chat

### Admin (`/admin`)
Tabovi: `pending` | `creators` | `businesses` | `categories` | `reviews` | `poslovi`

- Biznis-kreirani poslovi kreću kao `pending` → admin ih otvara (`open`)
- Admin-kreirani poslovi mogu odmah biti `open`

---

## 7. Auth flow (Supabase)

**Aktivno:** Supabase Auth + cookie session (`@supabase/ssr`).

| Korak | Gde / kako |
|-------|------------|
| Register creator | `POST /api/auth/register/creator` — `admin.createUser` sa `email_confirm: true` (gate je **admin approval**, ne email verify) |
| Register business | Stripe first → `/checkout/success` → `POST /api/auth/register/business` |
| Login | `/login` → `signInWithPassword` → učita `users.role` + profil → puni `DemoContext` + redirect |
| Verify email UI | `/auth/verify-email` + `POST /api/auth/resend-verification` (**Supabase** `auth.resend`, ne Resend SDK) |
| Callback | `src/app/auth/callback/route.ts` — `exchangeCodeForSession` |
| Forgot / reset | `/auth/forgot-password`, `/auth/reset-password` |
| API auth | `getAuthUser()` u `src/lib/auth-helper.ts` |

### Hibrid DemoContext
- Layout i dalje wrapuje `DemoProvider` (`src/context/DemoContext.tsx`)
- Login puni i Supabase i DemoContext
- `useSupabaseUser` = pravi Supabase user
- `useAuth` = još uvek delimično demo-oriented

### Middleware (`src/middleware.ts`) — VAŽNO
Trenutno je **DEMO MODE**:
1. Radi `updateSession` (Supabase cookie refresh)
2. **Preskače** page-level auth/subscription redirect

Zakomentarisana je produkcijska zaštita za `/dashboard`, `/admin`, `/kreatori`, `/kreator/`.  
**API rute** i dalje same proveravaju auth preko `getAuthUser()`.

Ako hoćeš pravu page zaštitu — ukloni early `return response` i prilagodi proveru na Supabase (stari komentar koristi NextAuth `getToken` stil — zastarelo).

---

## 8. Ključne features → fajlovi

| Feature | UI | API | SQL / tabela |
|---------|----|-----|--------------|
| Poslovi | `/poslovi`, dashboard | `api/jobs`, `api/admin/jobs` | `supabase-jobs-setup.sql` |
| Applications | dashboard | `api/job-applications` | `job_applications` |
| Invitations | dashboard | `api/job-invitations` | `supabase-invitations-setup.sql` |
| Messages / chat | `ChatModal`, dashboard | `api/job-messages` | `job_messages` |
| Reviews | dashboard, kreator profil | `api/reviews/*` | tabela `reviews` (nema SQL u repo-u) |
| Favorites | `/dashboard/favorites` | `api/favorites` | `saved_creators` (nema SQL u repo-u) |
| Saved jobs | poslovi UI | `api/saved-jobs` | `supabase-saved-jobs.sql` |
| Subscriptions | checkout, dashboard | `api/stripe/*`, `api/subscription/*` | polja na `businesses` |
| Portfolio upload | dashboard | `api/upload/portfolio`, `api/creators/[id]/photo` | Storage bucket `portfolio` |
| Creator views | — | `api/creator-views` | `supabase-creator-views-table.sql` |
| Categories | landing, admin | `api/categories`, `api/admin/categories` | tabela `categories` (nema SQL u repo-u) |
| Business logo | dashboard | `api/business/[id]/logo` | `supabase-business-logo-migration.sql` |
| Account delete | settings | `api/account/delete` | — |

---

## 9. Database (Supabase)

SQL fajlovi u root-u projekta — pokrenuti u Supabase SQL Editoru po potrebi:

### `supabase-setup.sql`
- `users` — id → `auth.users`, role `creator|business|admin`
- `creators` — profil, arrays, portfolio JSONB, status, profile_views
- `businesses` — company, subscription_*, stripe_*  
+ RLS + `updated_at` triggers

### `supabase-jobs-setup.sql`
- `jobs` — business_id, budget, platforms[], status (`open|in_progress|completed|closed`; u kodu i `pending`)
- `job_applications` — unique(job, creator)
- `job_messages` — po application_id

### Ostale migracije
| Fajl | Šta dodaje |
|------|------------|
| `supabase-deadline-migration.sql` | `jobs.application_deadline` |
| `supabase-invitations-setup.sql` | `job_invitations` (pending\|accepted\|rejected) |
| `supabase-saved-jobs.sql` | `saved_jobs` |
| `supabase-creator-views-table.sql` | `creator_views` unique(business, creator) |
| `supabase-business-logo-migration.sql` | `businesses.logo`, `phone` |

### Tabele koje API koristi, a nema SQL fajla u repo-u
- `reviews` (moderacija approve/reject/reply)
- `categories`
- `saved_creators` (business favorites)

**Storage:** bucket `portfolio` za slike/video.

---

## 10. Stripe pretplata (biznis) — kako radi

Cene u kodu (`src/lib/stripe.ts`): mesečno **€49**, godišnje **€490** (price ID-ovi iz env).

1. UI bira `monthly` ili `yearly`
2. `POST /api/stripe/create-checkout` → Stripe Checkout (`mode: 'subscription'`)
3. Success → `/checkout/success?session_id=...`
   - **Novi biznis:** fetch session → `POST /api/auth/register/business` → auto-login
   - **Renew:** `sessionStorage.renewBusinessId` → `POST /api/subscription/renew`
4. Webhook `POST /api/stripe/webhook` (service role):
   - `invoice.payment_succeeded` → `subscription_status: active`, update `expires_at`
   - `customer.subscription.deleted` / canceled|unpaid → `expired`
   - `customer.subscription.updated` → sync status
5. Ostalo: `create-portal`, `cancel-subscription`, `reactivate-subscription`, `change-plan`, `subscription-status`
6. Gate u API: npr. kreiranje posla traži aktivnu pretplatu (`jobs/route.ts`)

---

## 11. API mapa (kompletna lista ruta)

```
# Auth
/api/auth
/api/auth/register/creator
/api/auth/register/business
/api/auth/resend-verification

# Creators / Business
/api/creators
/api/creators/[id]
/api/creators/[id]/photo
/api/businesses
/api/business/profile
/api/business/[id]/logo

# Jobs ecosystem
/api/jobs
/api/job-applications
/api/job-invitations
/api/job-messages
/api/saved-jobs

# Social / content
/api/favorites
/api/reviews
/api/reviews/[id]
/api/reviews/[id]/approve
/api/reviews/[id]/reject
/api/reviews/[id]/reply
/api/reviews/reply
/api/categories
/api/creator-views
/api/upload/portfolio
/api/notifications
/api/dashboard
/api/account/delete

# Stripe
/api/stripe/create-checkout
/api/stripe/webhook
/api/stripe/create-portal
/api/stripe/cancel-subscription
/api/stripe/reactivate-subscription
/api/stripe/change-plan
/api/stripe/subscription-status
/api/stripe/session/[sessionId]

# Subscription helpers
/api/subscription/status
/api/subscription/renew
/api/subscription/cancel
/api/subscription/reactivate
/api/subscription/change-plan
/api/subscription/invoices

# Admin
/api/admin/creators
/api/admin/businesses
/api/admin/categories
/api/admin/jobs
/api/admin/create
/api/admin/reset-password
/api/admin/setup
```

---

## 12. Važni fajlovi (`src/lib`, hooks, components)

### `src/lib/`
| Fajl | Uloga |
|------|--------|
| `supabase/client.ts` | Browser Supabase client |
| `supabase/server.ts` | Server client + `createAdminClient` (service role) |
| `supabase/middleware.ts` | Session refresh |
| `auth-helper.ts` | **`getAuthUser()`** — glavni auth za API rute |
| `auth.ts` | Role helperi + mrtav NextAuth placeholder |
| `api-utils.ts` | `ApiError` / `ApiSuccess` / `logError` |
| `stripe.ts` | Lazy Stripe client, PRICE_IDS, PRICES |
| `cache.ts` | In-memory TTL cache |
| `email.ts` | Email helpers — **Resend zakomentarisan** |
| `emailTemplates.ts` | HTML template stringovi |
| `mockData.ts` | konstante (categories/platforms/languages) + stari demo seed |
| `db.ts` | Placeholder (Prisma/Drizzle) — nije aktivan |

### `src/hooks/`
| Hook | Napomena |
|------|----------|
| `useSupabaseUser` | Pravi Supabase user + creator/business profil |
| `useAuth` | DemoContext-based (legacy) |
| `useSubscription` | Subscription actions |
| `useCreators` | Lista/update/delete creators |

### `src/components/` (važniji)
`Header`, `Footer`, `CreatorCard`, `ChatModal`, `PortfolioModal`, `ImageCropper`, `Review*`, `StarRating`, `VideoPlayerModal`, `DemoSwitcher` (sakriven).

### Tipovi
- `src/types/index.ts` — glavni tipovi
- `src/types/subscription.ts`
- `src/types/review.ts`

---

## 13. User flows (kratko)

### Kreator
```
/register/kreator
  → POST /api/auth/register/creator
  → /register/kreator/cekanje (pending)
  → Admin odobrava u /admin
  → Login → /dashboard
  → Edit profil + portfolio
  → Browse /poslovi → apply
  → Poruke / invitations
```

### Biznis
```
/register/biznis ili /pricing
  → /checkout (Stripe)
  → /checkout/success
  → POST /api/auth/register/business
  → /dashboard
  → Browse /kreatori, favoriti
  → Kreiraj posao (pending → admin open)
  → Invite / chat / reviews
  → Portal za upravljanje pretplatom
```

### Admin
```
Login (role=admin)
  → /admin
  → Approve creators / jobs / reviews
  → Manage categories / businesses
```

---

## 14. Šta NIJE aktivno (ne gubi vreme)

| Stavka | Realnost |
|--------|----------|
| Resend SDK | Zakomentarisan u `email.ts`; nema `resend` u `package.json` |
| Transakcijski email | Auth mailovi idu preko **Supabase Auth** |
| Cloudflare R2 | Nema u kodu; upload = **Supabase Storage** |
| Sentry | Nije u projektu |
| Middleware page auth | Isključen (demo bypass) |
| NextAuth | Samo komentari / env leftovers |
| Prisma | Placeholder; stvarni DB = Supabase JS |
| Stari MD o “samo mockData” | Zastarelo — app koristi Supabase |

---

## 15. Deploy i pristupi

| Servis | Detalj |
|--------|--------|
| GitHub | `lakarijeprvovencani/istokugc` (public) — collaborator: `istokp` |
| Vercel | Team projekat `ugc-platform` → https://app.ugcexecutive.com |
| Supabase | Kod klijenta (`xupycbchatcnlvkaadcd.supabase.co`) |
| Domen | Oblak Host (kod klijenta), povezan na Vercel |
| Stripe | Kod klijenta |

**Za Claude Code / lokalni rad:**
1. Prihvati GitHub invite (ako već nisi)
2. Clone repo
3. Povuci env sa Vercela (`vercel env pull` ili ručno)
4. `npm install && npm run dev`
5. Čitaj ovaj fajl (`istok.md`) kao mapu projekta

---

## 16. Preporučeni entry points kad menjaš nešto

| Šta menjaš | Počni ovde |
|------------|------------|
| Auth / sesija | `src/lib/supabase/*`, `auth-helper.ts`, `middleware.ts` |
| Pretplata / Stripe | `src/lib/stripe.ts`, `api/stripe/webhook`, `checkout/success` |
| Job board | `api/jobs`, `api/job-*`, dashboard tabovi |
| Admin moderacija | `src/app/admin/page.tsx`, `api/admin/*` |
| Kreator profil / portfolio | `dashboard/page.tsx`, `api/upload/portfolio`, `api/creators/[id]/photo` |
| Tipovi | `src/types/*` |
| DB šema | `supabase-*.sql` + provera da li production ima `reviews`, `categories`, `saved_creators` |

---

## 17. Ostali MD u repou (kontekst, ali oprez)

| Fajl | Napomena |
|------|----------|
| `README.md` | Osnovni Next.js README — nije kompletan product docs |
| `AUDIT_REPORT.md` | Koristan za role/permission matricu, ali deo je o mock stanju |
| `DATABASE_INTEGRATION.md` | Prisma/NextAuth plan — **zastareo** u odnosu na Supabase |
| `API_ROUTES_UPDATE.md` | Istorija izmena — delimično korisno |

**Izvor istine = kod + ovaj `istok.md`.**

---

## 18. Brzi checklist za novog developera

- [ ] Clone GitHub repo
- [ ] `.env.local` sa Supabase + Stripe ključevima
- [ ] `npm install && npm run dev`
- [ ] Login kao creator / business / admin i prođi dashboard
- [ ] Proveri Supabase tabele + Storage bucket `portfolio`
- [ ] Proveri Stripe webhook endpoint na produkciji: `https://app.ugcexecutive.com/api/stripe/webhook`
- [ ] Ako diraš auth zaštitu stranica — pročitaj `middleware.ts` (trenutno bypass)
- [ ] Veliki fajlovi: `dashboard/page.tsx`, `admin/page.tsx` — pažljivo refaktorisati

---

*Poslednje ažuriranje handover dokumenta: Jul 2026*  
*Repo: lakarijeprvovencani/istokugc | App: app.ugcexecutive.com*
