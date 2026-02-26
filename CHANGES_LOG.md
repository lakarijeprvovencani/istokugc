# UGC Platform — Kompletna Dokumentacija

> **Ovo je najvažniji dokument u projektu.**
> Svaki agent/developer MORA da pročita ovaj fajl pre bilo kakve izmene.
> Poslednje ažuriranje: 26. februar 2026.

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
| Backend/DB | Supabase (PostgreSQL + Auth + Realtime) |
| Slike/CDN | Cloudflare R2 (S3 kompatibilan, 0 egress troškova) |
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
| `R2_ACCOUNT_ID` | Cloudflare Account ID | R2 upload |
| `R2_ACCESS_KEY_ID` | R2 API ključ | R2 upload |
| `R2_SECRET_ACCESS_KEY` | R2 tajni ključ | R2 upload |
| `R2_BUCKET_NAME` | Ime R2 bucket-a (`ugc-platform-media`) | R2 upload |
| `R2_PUBLIC_URL` | Javni URL za R2 bucket | Prikaz slika |

**VAŽNO za produkciju:**
- Promeni `NEXT_PUBLIC_SITE_URL` na pravi domen
- Promeni Stripe ključeve na live mode (videti sekciju ispod)
- `ADMIN_SETUP_*` varijable nisu potrebne u produkciji

---

## Prelazak na Klijentov Stripe Live Account (TODO)

Trenutno je povezan test Stripe account. Kad klijent da pristup svom live nalogu, treba:

### Šta je potrebno od klijenta:
1. **Live Secret Key** (`sk_live_...`) — sa Stripe Dashboard → Developers → API keys
2. **Live Publishable Key** (`pk_live_...`) — isto mesto
3. **Dva Price ID-a** za mesečni i godišnji plan — klijent kreira produkte/cene u svom Stripe-u, ili mi kreiramo
4. **Webhook Endpoint Secret** (`whsec_...`) — kreira se kad se doda webhook u klijentovom Stripe-u

### Koraci za prebacivanje:
```
1. U klijentovom Stripe Dashboard-u:
   - Developers → Webhooks → Add endpoint
   - URL: https://PRODUKCIJSKI-DOMEN/api/stripe/webhook
   - Events: invoice.payment_succeeded, invoice.payment_failed,
             customer.subscription.deleted, customer.subscription.updated
   - Kopiraj Signing Secret (whsec_...)

2. Klijent kreira Products + Prices (ili mi):
   - Product: "UGC Platform Pretplata"
   - Price 1: Mesečni (recurring monthly) → kopiraj price_id
   - Price 2: Godišnji (recurring yearly) → kopiraj price_id

3. Ažuriraj env varijable na Vercelu (Settings → Environment Variables):
   STRIPE_SECRET_KEY        = sk_live_...
   STRIPE_WEBHOOK_SECRET    = whsec_... (novi sa live naloga)
   STRIPE_PRICE_MONTHLY     = price_... (novi mesečni)
   STRIPE_PRICE_YEARLY      = price_... (novi godišnji)
   NEXT_PUBLIC_STRIPE_KEY   = pk_live_...

4. Redeploy na Vercelu (automatski ili ručno)

5. Testiraj jednu pravu uplatu
```

### Šta se NE menja u kodu:
- Webhook handler (`src/app/api/stripe/webhook/route.ts`) — ostaje isti
- Checkout flow — ostaje isti
- Subscription logika — ostaje ista
- Samo env varijable se menjaju, **nula promena u kodu**

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

## Kapacitet i Skaliranje

Platforma u trenutnom stanju (bez dodatnih optimizacija) podržava:

| Metrika | Kapacitet | Napomena |
|---------|-----------|----------|
| Registrovanih korisnika | ~5.000+ | Baza lako gura desetine hiljada redova |
| Aktivnih dnevno | ~100-200 | Bez ikakvih problema |
| Istovremeno na chatu | ~200 | Supabase Realtime Free limit |
| Supabase egress | ~2GB/mes (Free) | R2 za slike eliminiše glavni izvor |

**Kad treba Pro plan ($25/mes):** 500+ aktivnih dnevno ili 200+ istovremenih chat konekcija.

---

## Buduće Optimizacije (kad bude potrebno)

Ove stavke NE blokiraju lansiranje. Radi se kad app poraste.

| # | Optimizacija | Kad uraditi | Uticaj |
|---|-------------|-------------|--------|
| 1 | **Code splitting dashboarda** — razbiti 8000-linijski fajl na dinamičke importe | Kad korisnici prijave sporo učitavanje na mobilnom | Brže inicijalno učitavanje |
| 2 | **Rate limiting na sve javne rute** — dodati `checkRateLimit()` na `/api/creators`, `/api/jobs` itd. | Pre nego što app postane popularna | Zaštita od spam/abuse |
| 3 | **Memoizacija u dashboardu** — `React.memo`, `useCallback`, `useMemo` | Kad dashboard postane sporiji | Manje nepotrebnih re-rendera |
| 4 | **Razdvajanje DemoContext-a** — podeliti na auth, creators, settings kontekste | Kad se dodaju novi feature-ovi | Bolji performance, lakše održavanje |
| 5 | **Obični Supabase client umesto admin** — koristiti RLS umesto admin client za korisničke operacije | Kad bude vremena za refaktoring | Drugi sloj zaštite na nivou baze |

---

## Istorija Promena

### 26. februar 2026 — Egress Optimizacija + CDN + Realtime + Security Hardening

**Cloudflare R2 integracija (CDN za slike):**
- Svi novi upload-i (portfolio, profilna slika, biznis logo) idu na R2 umesto Supabase Storage
- R2 ima 0 egress troškova — eliminisan glavni izvor Supabase egress-a
- Dodat `src/lib/r2.ts` helper sa `uploadToR2()` funkcijom
- `next.config.ts` ažuriran sa R2 domenom u `remotePatterns` i CSP headerima
- Postojeće slike iz Supabase i dalje rade (Next.js Image Optimization kešira)

**Realtime poruke (umesto polling-a):**
- `ChatModal.tsx` prebačen sa 5s polling na Supabase Realtime (Postgres Changes)
- Dashboard inline chat (biznis + kreator strana) prebačen sa 5s polling na Realtime
- Poruke stižu instant bez osvežavanja stranice
- Eliminisano ~720 requestova/sat po aktivnom chatu

**Dashboard polling za badge-eve:**
- Kreator: prijave i nepročitane poruke se osvežavaju na 30s (bilo je samo na mount)
- Biznis: nove prijave i nepročitane poruke se osvežavaju na 30s
- Pozivi (invitations) već su imali 30s polling — ostaje

**Stripe webhook popravke:**
- `invoice.payment_failed` — SAD ažurira subscription na `expired` kad Stripe kaže `past_due`/`unpaid` ili posle 3+ neuspelih naplate
- `subscription.updated` — SAD hvata i `past_due` status
- Event se markira kao obrađen TEK POSLE uspešne obrade — ako obrada padne, vraća 500 pa Stripe ponovo šalje
- Ranije: event se markirao pre obrade, neuspeli event se nikad ne bi ponovo obradio

**Zaštita statusa prijava:**
- Dodata validacija prelaza statusa u `PUT /api/job-applications`:
  - `pending` → accepted, rejected, withdrawn, cancelled
  - `accepted` → engaged, rejected, withdrawn, cancelled
  - `engaged` → completed, cancelled
  - `completed`, `cancelled`, `rejected`, `withdrawn` → terminalni (ne mogu se menjati)
  - Admin može zaobići validaciju
- Engage sad odbija i `accepted` prijave (ne samo `pending`)

**Database constraint (race condition zaštita):**
- Dodat unique partial index `idx_one_engaged_per_job` na `job_applications(job_id) WHERE status='engaged'`
- Baza fizički sprečava da dva kreatora budu engaged za isti posao

**Privatnost:**
- Email i telefon uklonjeni iz javnog `GET /api/creators` — kontakt info vidljiv samo na profilu kreatora
- `SELECT *` zamenjeni specifičnim kolonama u `/api/creators`, `/api/jobs`, `/api/dashboard`

**Review validacija:**
- `POST /api/reviews` sad zahteva `completed` ili `engaged` posao između biznisa i kreatora
- Biznis ne može ostaviti review kreatoru sa kojim nikad nije sarađivao

### 19. februar 2026 — Supabase Security Fix (via MCP Plugin)
- Obrisano 10 prekomerno permisivnih RLS politika koje su zaobilazile ispravne politike:
  - `businesses` INSERT (true), `creators` INSERT (true)
  - `creator_views` INSERT/UPDATE/SELECT (true) — duplikati ispravnih politika
  - `reviews` INSERT/UPDATE/DELETE (true) + broken SELECT (`approved OR true`)
  - `saved_creators` ALL (true) — zaobilazila 3 ispravne politike
- Popravljene 3 funkcije — dodat `SET search_path = ''`:
  - `update_updated_at`, `cleanup_old_rate_limits`, `cleanup_old_webhook_events`
- Dodat missing index: `idx_saved_creators_creator_id` na `saved_creators(creator_id)`
- Dodata RLS politika na `rate_limits` tabelu (service_role only)
- Supabase Security Advisor: sve WARN/INFO rezolvirano (ostaje samo Leaked Password Protection — podešava se u Dashboard-u)
- **67/67 testova prolazi** — nijedan fajl koda nije menjan, samo baza

### 19. februar 2026 — Cursor Plugini
- Instalirani Cursor Marketplace plugini za direktan pristup servisima:
  - **Supabase** — upravljanje tabelama, upit podataka, konfiguracija direktno iz Cursora
  - **Stripe** — Stripe integracija + best practices + upgrade vodič
  - **Vercel** — React/Next.js best practices + deploy komanda iz Cursora
- Plugini omogućavaju agentu da direktno pristupa bazi, Stripe nalogu i deploy-u

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
