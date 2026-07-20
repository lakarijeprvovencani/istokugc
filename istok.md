# ISTOK / UGC Executive — Kompletan vodič (trenutno stanje koda)

> **Izvor istine:** kod na GitHub `main` (`lakarijeprvovencani/istokugc`), provereno 20. jul 2026.  
> **Ne koristi kao istinu:** `AUDIT_REPORT.md`, `DATABASE_INTEGRATION.md`, `API_ROUTES_UPDATE.md` (zastareli — NextAuth/Prisma/demo bypass).  
> `CHANGES_LOG.md` je koristan, ali i on ima zastarele delove (npr. `/api/admin/setup` više ne postoji).  
> **Ovaj fajl je napisan po stvarnim fajlovima na disku.**

---

## 1. Šta je proizvod

Marketplace platforma koja povezuje **UGC kreatore** i **brendove (biznise)**, uz **admin** moderaciju.

| Stavka | Vrednost |
|--------|----------|
| Branding u UI | **UGC Executive** (`Header`, `Footer`, `layout` metadata) |
| Title | `UGC Executive - Pronađi savršene UGC kreatore` |
| Produkcija | https://app.ugcexecutive.com |
| GitHub | https://github.com/lakarijeprvovencani/istokugc |
| Hosting | Vercel (`ugc-platform`) |
| Auth / DB / Storage | Supabase |
| Plaćanja | Stripe subscriptions |
| Domen / DNS | Oblak Host (kod klijenta) |
| Jezik UI | `lang="sr"` |
| Font | Outfit (Google) |

---

## 2. Tech stack (tačno iz `package.json`)

| Layer | Tehnologija |
|--------|-------------|
| Framework | **Next.js 16.0.8** (App Router) |
| UI | **React 19.2.1** + **Tailwind CSS v4** |
| Auth + DB | **Supabase** (`@supabase/supabase-js`, `@supabase/ssr`) |
| Plaćanja | **Stripe** ^20.1 |
| Validacija | **Zod** ^4.3.6 |
| Monitoring | **Sentry** (`@sentry/nextjs` ^10.51) — aktivan |
| Media CDN | **Cloudflare R2** (`@aws-sdk/client-s3`) — photo/logo (+ legacy portfolio route) |
| Portfolio UI upload | **Supabase Storage** (presign ruta) |
| Mapa | `d3-geo` + `topojson-client` |
| Testovi | **Vitest** ^4.0.18 |
| Node | **20.x** (`.nvmrc`) |

**Scripts:** `dev`, `build`, `start`, `lint`, `test`, `test:watch`

**Nije u dependencies:** `resend`, `next-auth`, `prisma` / `@prisma/client`

---

## 3. Lokalni setup

```bash
git clone https://github.com/lakarijeprvovencani/istokugc.git
cd istokugc
npm install
# napravi .env.local (vrednosti sa Vercela)
npm run dev
```

### Env varijable (iz koda)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# App
NEXT_PUBLIC_SITE_URL=https://app.ugcexecutive.com
NEXT_PUBLIC_APP_URL=https://app.ugcexecutive.com

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_MONTHLY=          # ili STRIPE_PRICE_ID_MONTHLY
STRIPE_PRICE_YEARLY=            # ili STRIPE_PRICE_ID_YEARLY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=   # ako frontend Stripe.js koristi

# Cloudflare R2 (photo/logo)
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_URL=

# Sentry
SENTRY_ORG=
SENTRY_PROJECT=
SENTRY_AUTH_TOKEN=
SENTRY_DSN=
NEXT_PUBLIC_SENTRY_DSN=

# Email (trenutno samo log u konzoli — Resend NIJE povezan)
ADMIN_EMAIL=hello@ugcexecutive.com
FROM_EMAIL=UGC Executive <noreply@ugcexecutive.com>
```

Napomena: u kodu postoje fallback-ovi i na `localhost:3000` i na `9898` — mešavina.

---

## 4. Uloge i zaštita (kako stvarno radi)

### Izvor istine za role
Tabela `public.users.role` ∈ `creator | business | admin`  
**Nikad** `user.user_metadata` (korisnik bi mogao sam da se proglasi adminom).

### Server helper — `src/lib/auth-helper.ts`
- `getAuthUser()` — sesija + role iz DB + `creatorId` / `businessId`
- `businessHasActiveSubscription()` — `subscription_status === 'active'` i `expires_at` nije prošao
- `isAdmin` / `isCreator` / `isBusiness`

### Šta ko može

| Akcija | Guest | Creator | Business | Admin |
|--------|-------|---------|----------|-------|
| Landing, poslovi, kreatori (javno) | ✅ | ✅ | ✅ | ✅ |
| Kontakt PII kreatora (email/phone) | ❌ | svoj | ✅ ako aktivna pretplata | ✅ |
| `/dashboard` | ❌ | ✅ | ✅ | ✅ |
| `/admin` | ❌ | ❌ | ❌ | ✅ |
| Kreiraj posao | ❌ | ❌ | ✅ + aktivna pretplata | ✅ |
| Favoriti / invite / chat | ❌ | delimično | ✅ | ✅ |
| Moderacija (creators/jobs/reviews) | ❌ | ❌ | ❌ | ✅ |

---

## 5. Middleware — UKLJUČEN (nije demo bypass)

**Fajl:** `src/middleware.ts`  
**Auth page zaštita je AKTIVNA.**

Tok:
1. Supabase SSR klijent + `getUser()` (session/cookies)
2. `/api/*` → propušta (API sam radi auth)
3. Public rute → propušta
4. `/dashboard`, `/admin` → bez user-a → redirect `/login?callbackUrl=…`
5. `/admin*` → dodatno čita `users.role` iz DB; ako nije `admin` → `/dashboard`

### PUBLIC_ROUTES (tačna lista iz koda)
```
/, /login, /register, /pricing, /checkout, /poslovi,
/auth/callback, /auth/error, /auth/forgot-password,
/auth/reset-password, /auth/verify-email
```

Stranice tipa `/kreatori`, `/kreator/[id]`, legal stranice nisu u `AUTH_REQUIRED` — dostupne su bez logina (API i dalje skida PII gde treba).

> Stariji `istok.md` je greškom pisao da je middleware u demo bypass-u. To je bilo staro stanje; na trenutnom `main` je uključeno (security hardening).

---

## 6. Auth flow

| Korak | Implementacija |
|-------|----------------|
| Login | `/login` → `signInWithPassword` → role iz `users` → puni `DemoContext` → redirect |
| Creator register | `/register/kreator` → `POST /api/auth/register/creator` (Zod + rate limit) → pending approval |
| Business register | Pricing → Stripe Checkout → `/checkout/success` → `POST /api/auth/register/business` sa **obaveznim `sessionId`** (server validira plaćanje preko Stripe API) |
| Email verify / recovery | `/auth/callback` → `exchangeCodeForSession` |
| Forgot / reset | `/auth/forgot-password`, `/auth/reset-password` |
| Resend verification | `POST /api/auth/resend-verification` — **Supabase Auth**, ne Resend SaaS |
| Logout | `DemoContext.logout` + `supabase.auth.signOut` |

**NextAuth se ne koristi.**  
`GET /api/auth` je stari placeholder — ne oslanjati se na njega.

---

## 7. DemoContext — šta stvarno jeste

`src/context/DemoContext.tsx` + `DemoProvider` u `layout.tsx`:

- **Ime je legacy**, ali radi sa **pravim Supabase Auth**
- Sinhronizuje sesiju (`checkSupabaseSession`, `onAuthStateChange`)
- Drži UI state (tip usera, creatorId, businessId, favorites lokalno…)
- **DemoSwitcher je ugašen** (zakomentarisan u layoutu)
- Nema mock kreatora kao izvor podataka — liste idu preko API/Supabase

Paralelno postoji `useSupabaseUser` (korišćen na nekim stranicama). Većina UI-ja i dalje ide preko `useDemo()`.

---

## 8. Frontend stranice

| Path | Svrha |
|------|--------|
| `/` | Landing — hero, kategorije, featured kreatori, mapa lokacija |
| `/login` | Prijava |
| `/register` | Izbor tipa naloga |
| `/register/kreator` | Registracija kreatora |
| `/register/kreator/cekanje` | Čeka admin approval |
| `/register/biznis` | Biznis forma / ulaz u checkout |
| `/pricing` | Planovi pretplate |
| `/checkout` | Stripe Checkout start |
| `/checkout/success` | Posle plaćanja — create business |
| `/checkout/cancel` | Otkazan checkout |
| `/kreatori` | Marketplace kreatora (filteri, nearby/mapa) |
| `/kreator/[id]` | Javni profil |
| `/poslovi` | Job board |
| `/poslovi/[id]` | Detalj posla + apply |
| `/dashboard` | Glavni panel (creator ili business) — veliki fajl |
| `/dashboard/favorites` | Favoriti (business) |
| `/dashboard/reviews` | Recenzije |
| `/dashboard/settings` | Podešavanja |
| `/admin` | Admin panel |
| `/auth/*` | verify / forgot / reset / error |
| `/politika-privatnosti` | Privacy |
| `/uslovi-koriscenja` | Terms |
| `/gdpr` | GDPR |

Route handler (nije page): `src/app/auth/callback/route.ts`

---

## 9. Dashboard i Admin tabovi

### Creator (`/dashboard`)
Tabovi: **Pregled** · **Statistika** · **Poslovi** · **Poruke**  
Poslovi subtabovi: prijave · pozivi · angažovan · završeno · odbijeno · sačuvano

### Business (`/dashboard`)
Tabovi: **Pregled** · **Poslovi** · **Poruke**  
Ako nema aktivne pretplate → `BusinessPaywallScreen`

### Admin (`/admin`)
```
pending | creators | businesses | categories | reviews | poslovi
```

---

## 10. Features

| Feature | Gde |
|---------|-----|
| Poslovi | `/poslovi`, `/api/jobs`, admin jobs, dashboard |
| Applications | `/api/job-applications` |
| Invitations | `/api/job-invitations` |
| Messages / chat | `/api/job-messages`, `ChatModal` |
| Reviews | `/api/reviews/*` + admin approve/reject + creator reply |
| Favorites | `/api/favorites` → `saved_creators` |
| Saved jobs | `/api/saved-jobs` |
| Portfolio | Supabase Storage via `/api/upload/portfolio/presign` (+ legacy R2 ruta) |
| Photo / logo | R2 via `/api/creators/[id]/photo`, `/api/business/[id]/logo` |
| Creator views | `/api/creator-views` |
| Categories | `/api/categories`, `/api/admin/categories` |
| Cities / nearby / mapa | `/api/cities`, `/api/stats/locations`, PostGIS RPC |
| Account delete | `/api/account/delete` |
| Legal | privacy, terms, GDPR stranice |

---

## 11. Stripe pretplata

Cene u `src/lib/stripe.ts`:
- Mesečno: **$99** (`amount: 9900`)
- Godišnje: **$948** (`amount: 94800`, ~$79/mes sa 20% popustom)

Flow:
1. `POST /api/stripe/create-checkout` → Stripe Checkout (`subscription`)
2. Success → `/checkout/success` → `POST /api/auth/register/business` sa `sessionId` (server validira paid)
3. Webhook `POST /api/stripe/webhook` — signature + **idempotency** (`webhook_events`)
4. U app-u: cancel / reactivate / change-plan / portal / subscription-status (`/api/stripe/*`)
5. Renew istekle: `POST /api/subscription/renew` (jedini endpoint pod `/api/subscription/*`)

---

## 12. API rute — tačna lista (45 `route.ts` na disku)

### Auth
```
/api/auth                          ← placeholder, ne koristiti
/api/auth/register/creator
/api/auth/register/business
/api/auth/resend-verification
```

### Creators / Business
```
/api/creators
/api/creators/[id]
/api/creators/[id]/photo
/api/businesses
/api/business/profile
/api/business/[id]/logo
```

### Jobs ecosystem
```
/api/jobs
/api/job-applications
/api/job-invitations
/api/job-messages
/api/saved-jobs
```

### Content / social
```
/api/favorites
/api/reviews
/api/reviews/[id]
/api/reviews/[id]/approve
/api/reviews/[id]/reject
/api/reviews/[id]/reply
/api/categories
/api/creator-views
/api/cities
/api/cities/[id]
/api/stats/locations
/api/upload/portfolio
/api/upload/portfolio/presign
/api/notifications
/api/dashboard
/api/account/delete
```

### Stripe + renew
```
/api/stripe/create-checkout
/api/stripe/webhook
/api/stripe/create-portal
/api/stripe/cancel-subscription
/api/stripe/reactivate-subscription
/api/stripe/change-plan
/api/stripe/subscription-status
/api/stripe/session/[sessionId]
/api/subscription/renew
```

### Admin
```
/api/admin/creators
/api/admin/businesses
/api/admin/categories
/api/admin/jobs
/api/admin/reset-password
```

### Više NE postoji na disku (stari docs ih pominju)
- `/api/admin/create`
- `/api/admin/setup`
- `/api/reviews/reply` (ostalo samo `/api/reviews/[id]/reply`)
- `/api/subscription/cancel|status|change-plan|reactivate|invoices` (osim `renew`)

---

## 13. Database

### Root SQL
| Fajl | Svrha |
|------|--------|
| `supabase-setup.sql` | users, creators, businesses + RLS |
| `supabase-jobs-setup.sql` | jobs, job_applications, job_messages |
| `supabase-invitations-setup.sql` | job_invitations |
| `supabase-saved-jobs.sql` | saved_jobs |
| `supabase-creator-views-table.sql` | creator_views |
| `supabase-business-logo-migration.sql` | logo (+ phone) |
| `supabase-deadline-migration.sql` | application_deadline |
| `supabase-rate-limits-table.sql` | rate_limits |
| `supabase-webhook-events-table.sql` | webhook_events |
| `supabase-rls-fixes.sql` / `supabase-rls-missing-tables.sql` | RLS reviews, saved_creators, categories |
| `supabase-full-backup.sql` | kanonski snapshot šeme |

### Migracije (`supabase/migrations/`)
| Fajl | Svrha |
|------|--------|
| `20260506_lock_sensitive_columns.sql` | Trigger lock: `users.role` + subscription/Stripe kolone (samo service_role) |
| `20260506_revoke_lock_function_grants.sql` | Revoke EXECUTE |
| `20260608_lock_creators_pii.sql` | Anon ne čita `creators` PII; RPC revoke |

### Glavne tabele
`users`, `creators`, `businesses`, `categories`, `jobs`, `job_applications`, `job_messages`, `job_invitations`, `reviews`, `creator_views`, `saved_creators`, `saved_jobs`, `rate_limits`, `webhook_events`, `cities`

---

## 14. Security hardening (šta je urađeno)

| Mera | Gde |
|------|-----|
| Middleware auth + admin role iz DB | `src/middleware.ts` |
| API `getAuthUser` / ownership | skoro sve zaštićene rute |
| Zod validacija | `src/lib/validations.ts` |
| Rate limiting (fail-closed) | `src/lib/rate-limit.ts` + tabela `rate_limits` |
| Webhook idempotency | `webhook_events` |
| CSP + HSTS + security headers | `next.config.ts` |
| PII lockdown creators | migracija `20260608_*` |
| Column locks (role/subscription) | migracija `20260506_*` |
| Paywall na kontaktima | `businessHasActiveSubscription` |
| Business register zahteva Stripe session | register/business |
| Sentry | `withSentryConfig`, `sentry.*.config.ts`, `instrumentation*.ts` |
| Regresioni testovi | `tests/api/*` |

---

## 15. Lib / hooks — živo vs mrtvo

### Aktivno
| Fajl | Uloga |
|------|--------|
| `auth-helper.ts` | Glavni API auth |
| `supabase/*` | Client / server / admin |
| `stripe.ts` | Stripe helperi + cene |
| `rate-limit.ts` | Rate limit |
| `validations.ts` | Zod šeme |
| `r2.ts` | Photo/logo upload |
| `upload-client.ts` | Presign → Supabase Storage |
| `upload-limits.ts` | Limit tipova/veličina |
| `image-compress.ts` | Client compress |
| `sentry-user.ts` | Sentry user context |
| `mockData.ts` | konstante (categories/platforms/languages), ne mock baza |
| `email.ts` / `emailTemplates.ts` | samo console log (Resend nije povezan) |

### Mrtvo / zbunjujuće
| Fajl | Problem |
|------|---------|
| `auth.ts` | NextAuth placeholder |
| `db.ts` | Prisma placeholder (nema Prisma) |
| `cache.ts` | in-memory — praktično nekorišćen |
| `supabase/middleware.ts` | duplikat; pravi je `src/middleware.ts` |
| `useSubscription` | nije ušiven u UI |
| `GET /api/auth` | stari placeholder |

### Hooks
- `useSupabaseUser` — aktivan (neke stranice)
- `useDemo` — aktivan skoro svuda
- `useAuth` / `useCreators` — legacy oko DemoContext

---

## 16. Testovi

Folder `tests/api/` (Vitest):

| Fajl | Fokus |
|------|--------|
| `security-fixes.test.ts` | kritične security popravke |
| `auth-protection.test.ts` | auth na rutama |
| `admin-routes.test.ts` | admin only |
| `data-isolation.test.ts` | izolacija podataka |
| `public-routes.test.ts` | javni endpointi |
| `validation.test.ts` | Zod |
| `stripe-routes.test.ts` | Stripe rute |
| `stripe-webhook.test.ts` | webhook |

```bash
npm run dev   # često potreban running server
npm test
```

---

## 17. User flows

### Kreator
```
/register/kreator → API register → /register/kreator/cekanje
→ Admin approve → Login → /dashboard
→ Profil + portfolio → /poslovi → apply → poruke/invite
```

### Biznis
```
/pricing ili /register/biznis → Stripe Checkout → /checkout/success
→ register/business (sessionId) → /dashboard
→ (paywall ako nema active) → kreatori / poslovi / invite / chat / reviews
→ Stripe portal / change-plan / renew
```

### Admin
```
Login (role=admin) → /admin
→ pending creators, jobs, reviews, categories, businesses
```

---

## 18. Šta NIJE aktivno

| Stavka | Realnost |
|--------|----------|
| Resend SaaS | Nije u deps; email.ts samo log |
| NextAuth | Nije u upotrebi |
| Prisma | Nije u upotrebi |
| DemoSwitcher UI | Ugašen |
| Middleware demo bypass | **UKLONJEN** — auth je ON |
| Mock kreatori kao baza | Nema — ide Supabase |

| Stavka | Realnost |
|--------|----------|
| Sentry | **AKTIVAN** |
| Cloudflare R2 | **AKTIVAN** (photo/logo) |
| Supabase Storage | **AKTIVAN** (portfolio presign) |

---

## 19. Entry points za Claude Code

| Šta menjaš | Počni ovde |
|------------|------------|
| Auth / page zaštita | `src/middleware.ts`, `src/lib/auth-helper.ts` |
| Pretplata | `src/lib/stripe.ts`, `api/stripe/*`, `checkout/success` |
| Jobs | `api/jobs`, `api/job-*`, dashboard tabovi |
| Admin | `src/app/admin/page.tsx`, `api/admin/*` |
| Upload | `lib/r2.ts`, `lib/upload-client.ts`, `api/upload/*` |
| Validacija / rate limit | `lib/validations.ts`, `lib/rate-limit.ts` |
| Lokacije / mapa | `api/cities`, `api/stats/locations`, landing |
| Tipovi | `src/types/*` |
| DB | `supabase-*.sql`, `supabase/migrations/*` |
| Testovi | `tests/api/*` |

### Gotchas
1. Role samo iz `public.users` — nikad metadata  
2. Svaka nova API ruta mora zvati `getAuthUser` sama  
3. Creators PII — anon ne čita tabelu direktno; ide kroz API  
4. Subscription kolone — samo service_role (DB trigger)  
5. Dva upload path-a: R2 (photo/logo) vs Supabase Storage (portfolio UI)  
6. `dashboard/page.tsx` je monolit — pažljivo  
7. Ime `DemoContext` zvuči kao demo, ali je produkcijski UI state  
8. CSP u `next.config.ts` mora se ažurirati za nove third-party domenе  
9. Email notifikacije ne stižu dok se Resend (ili drugi provider) ne poveže  

---

## 20. Deploy / pristupi

| Servis | Detalj |
|--------|--------|
| GitHub | `lakarijeprvovencani/istokugc` — collaborator `istokp` |
| Vercel | projekat `ugc-platform` → https://app.ugcexecutive.com |
| Supabase | kod klijenta |
| Stripe | kod klijenta |
| Domen | Oblak Host (kod klijenta) |
| R2 / Sentry | env na Vercelu |

**Za novog developera:**
1. Prihvati GitHub (+ Vercel) invite  
2. Clone repo  
3. Povuci env sa Vercela  
4. `npm install && npm run dev`  
5. Čitaj **ovaj** `istok.md` kao mapu projekta  

---

*Ažurirano: 20. jul 2026 — po stvarnom kodu na `main` (uključujući security hardening, lokacije/mapu, nove cene $99/$948).*  
*Repo: https://github.com/lakarijeprvovencani/istokugc*  
*App: https://app.ugcexecutive.com*
