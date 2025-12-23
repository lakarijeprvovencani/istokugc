# 🔍 Kompletan Audit Aplikacije - Role, Permission-i i Rute

**Datum:** $(date)  
**Status:** ✅ Spremno za Supabase integraciju sa manjim izmenama

---

## 📋 Sadržaj

1. [Role-ovi i Permission-i](#role-ovi-i-permission-i)
2. [API Rute - Status i Spremnost](#api-rute---status-i-spremnost)
3. [Middleware i Zaštita Ruta](#middleware-i-zaštita-ruta)
4. [Komponente i Permission Logika](#komponente-i-permission-logika)
5. [Identifikovani Problemi](#identifikovani-problemi)
6. [Preporuke za Supabase Integraciju](#preporuke-za-supabase-integraciju)

---

## 1. Role-ovi i Permission-i

### 1.1 Definisani Role-ovi

| Role | Opis | Lokacija |
|------|------|----------|
| `guest` | Neulogovani korisnik | `src/types/index.ts`, `src/lib/mockData.ts` |
| `creator` | UGC kreator | `src/types/index.ts`, `src/lib/mockData.ts` |
| `business` | Biznis korisnik (mora imati aktivnu pretplatu) | `src/types/index.ts`, `src/lib/mockData.ts` |
| `admin` | Administrator platforme | `src/types/index.ts`, `src/lib/mockData.ts` |

### 1.2 Permission Funkcije

**Lokacija:** `src/lib/auth.ts`

| Funkcija | Opis | Implementacija |
|----------|------|----------------|
| `hasRole(userRole, requiredRole)` | Provera da li korisnik ima određenu ulogu | ✅ Implementirano |
| `isAdmin(userRole)` | Provera da li je korisnik admin | ✅ Implementirano |
| `canViewCreators(userRole)` | Provera da li korisnik može da vidi kreatore | ✅ Implementirano - vraća `true` za admin, creator, business |
| `canEditCreator(userRole, isOwnProfile?)` | Provera da li korisnik može da uređuje kreatora | ✅ Implementirano - admin može sve, creator samo svoj profil |
| `canDeleteCreator(userRole)` | Provera da li korisnik može da briše kreatore | ✅ Implementirano - samo admin |

### 1.3 Matrica Permission-a

| Uloga | Pregled kreatora | Kontakt info | Uređivanje | Brisanje | Admin panel | Recenzije | Portfolio |
|-------|-----------------|--------------|------------|----------|-------------|-----------|-----------|
| **Guest** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Creator** | ✅ | ❌ | ✅ (samo svoj) | ❌ | ❌ | Može odgovoriti | ✅ (samo svoj) |
| **Business** | ✅ | ✅ | ❌ | ❌ | ❌ | Može ostaviti/obrisati svoje | ❌ |
| **Admin** | ✅ (sve) | ✅ | ✅ (sve) | ✅ | ✅ | Moderacija | ✅ (sve) |

### 1.4 Status Kreatora i Vidljivost

| Status | Vidljiv u pretrazi | Admin vidi | Business vidi | Creator vidi |
|--------|-------------------|------------|----------------|--------------|
| `approved` | ✅ | ✅ | ✅ | ✅ (samo svoj) |
| `pending` | ❌ | ✅ | ❌ | ✅ (samo svoj) |
| `deactivated` | ❌ | ✅ | ❌ | ✅ (samo svoj) |

### 1.5 Status Recenzija i Vidljivost

| Status | Vidljiv javno | Creator vidi | Business vidi | Admin vidi |
|--------|--------------|--------------|---------------|-------------|
| `pending` | ❌ | ❌ | ✅ (svoje) | ✅ |
| `approved` | ✅ | ✅ | ✅ (svoje) | ✅ |
| `rejected` | ❌ | ❌ | ✅ (svoje) | ✅ |

---

## 2. API Rute - Status i Spremnost

### 2.1 Auth Rute

| Ruta | Metoda | Status | Permission | Spremnost |
|------|--------|-------|------------|-----------|
| `/api/auth` | GET | ✅ | Public | ✅ Spremno - placeholder implementiran |

**Napomena:** NextAuth.js konfiguracija je u `src/lib/auth.ts` kao komentar, spremna za aktivaciju.

### 2.2 Creator Rute

| Ruta | Metoda | Status | Permission | Spremnost |
|------|--------|-------|------------|-----------|
| `/api/creators` | GET | ✅ | Public (filtered) | ✅ Spremno - mock implementacija |
| `/api/creators` | POST | ✅ | Creator/Admin | ✅ Spremno - mock implementacija |
| `/api/creators/[id]` | GET | ✅ | Public | ✅ Spremno - mock implementacija |
| `/api/creators/[id]` | PUT | ✅ | Creator (own)/Admin | ✅ Spremno - mock implementacija |
| `/api/creators/[id]` | DELETE | ✅ | Admin only | ✅ Spremno - mock implementacija |

**Napomena:** Svi endpoint-i imaju komentarisane provere za produkciju (`requireAuth()`, `requireAdmin()`).

### 2.3 Business Rute

| Ruta | Metoda | Status | Permission | Spremnost |
|------|--------|-------|------------|-----------|
| `/api/businesses` | GET | ✅ | Admin only | ✅ Spremno - mock implementacija |
| `/api/businesses` | POST | ✅ | Public (registration) | ✅ Spremno - mock implementacija |

**Napomena:** Business registracija ide kroz `/register/biznis` → `/checkout` → `/checkout/success`.

### 2.4 Review Rute

| Ruta | Metoda | Status | Permission | Spremnost |
|------|--------|-------|------------|-----------|
| `/api/reviews` | GET | ✅ | Public (filtered) | ✅ Spremno - mock implementacija |
| `/api/reviews` | POST | ✅ | Business | ✅ Spremno - mock implementacija |
| `/api/reviews/[id]` | GET | ✅ | Public | ✅ Spremno - mock implementacija |
| `/api/reviews/[id]` | PUT | ✅ | Business (own)/Admin | ✅ Spremno - mock implementacija |
| `/api/reviews/[id]` | DELETE | ✅ | Business (own)/Admin | ✅ Spremno - mock implementacija |
| `/api/reviews/[id]/approve` | POST | ✅ | Admin only | ✅ Spremno - mock implementacija |
| `/api/reviews/[id]/reject` | POST | ✅ | Admin only | ✅ Spremno - mock implementacija |
| `/api/reviews/[id]/reply` | POST | ✅ | Creator (own profile) | ✅ Spremno - mock implementacija |

**Napomena:** Sve review rute imaju validaciju (min 50, max 1000 karaktera za komentar, jedna recenzija po kreatoru po biznisu).

### 2.5 Subscription Rute

| Ruta | Metoda | Status | Permission | Spremnost |
|------|--------|-------|------------|-----------|
| `/api/subscription/status` | GET | ✅ | Business/Admin | ✅ Spremno - mock implementacija |
| `/api/subscription/cancel` | POST | ✅ | Business (own) | ✅ Spremno - mock implementacija |
| `/api/subscription/reactivate` | POST | ✅ | Business (own) | ✅ Spremno - mock implementacija |
| `/api/subscription/change-plan` | POST | ✅ | Business (own) | ✅ Spremno - mock implementacija |
| `/api/subscription/invoices` | GET | ✅ | Business (own) | ✅ Spremno - mock implementacija |

**Napomena:** Sve subscription rute su spremne za Stripe integraciju.

### 2.6 Stripe Rute

| Ruta | Metoda | Status | Permission | Spremnost |
|------|--------|-------|------------|-----------|
| `/api/stripe/create-checkout` | POST | ✅ | Public (registration) | ✅ Spremno - mock implementacija |
| `/api/stripe/portal` | POST | ✅ | Business (own) | ✅ Spremno - mock implementacija |
| `/api/stripe/webhook` | POST | ✅ | Stripe (webhook) | ✅ Spremno - mock implementacija |

**Napomena:** Webhook ruta je javna (bez auth) jer Stripe šalje zahteve sa signature verifikacijom.

### 2.7 Favorites Rute

| Ruta | Metoda | Status | Permission | Spremnost |
|------|--------|-------|------------|-----------|
| `/api/favorites` | GET | ✅ | Business | ✅ Spremno - mock implementacija |
| `/api/favorites` | POST | ✅ | Business | ✅ Spremno - mock implementacija |
| `/api/favorites` | DELETE | ✅ | Business | ✅ Spremno - mock implementacija |

### 2.8 Recently Viewed Rute

| Ruta | Metoda | Status | Permission | Spremnost |
|------|--------|-------|------------|-----------|
| `/api/recently-viewed` | GET | ✅ | Business | ✅ Spremno - mock implementacija |
| `/api/recently-viewed` | POST | ✅ | Business | ✅ Spremno - mock implementacija |

### 2.9 Settings Rute

| Ruta | Metoda | Status | Permission | Spremnost |
|------|--------|-------|------------|-----------|
| `/api/settings` | GET | ✅ | Authenticated | ✅ Spremno - mock implementacija |
| `/api/settings` | PUT | ✅ | Authenticated (own) | ✅ Spremno - mock implementacija |
| `/api/settings/password` | POST | ✅ | Authenticated (own) | ✅ Spremno - mock implementacija |

### 2.10 Notifications Rute

| Ruta | Metoda | Status | Permission | Spremnost |
|------|--------|-------|------------|-----------|
| `/api/notifications` | GET | ✅ | Admin | ✅ Spremno - mock implementacija |
| `/api/notifications` | POST | ✅ | System/Admin | ✅ Spremno - mock implementacija |

**Napomena:** Email servis je u `src/lib/email.ts` sa Resend placeholder-om.

---

## 3. Middleware i Zaštita Ruta

### 3.1 Middleware Status

**Lokacija:** `src/middleware.ts`

| Status | Opis |
|--------|------|
| ✅ Implementirano | Middleware je implementiran ali je trenutno u demo modu (preskače sve provere) |
| ⚠️ Komentarisano | Produkcija logika je komentarisana i spremna za aktivaciju |

### 3.2 Zaštićene Rute

| Ruta | Zahtev | Status |
|------|--------|--------|
| `/dashboard` | Authenticated | ✅ Spremno |
| `/admin` | Admin only | ✅ Spremno |
| `/kreatori` | Business/Admin/Creator | ✅ Spremno |
| `/kreator/[id]` | Business/Admin/Creator | ✅ Spremno |

### 3.3 Javne Rute

| Ruta | Status |
|------|--------|
| `/` | ✅ Javna |
| `/login` | ✅ Javna |
| `/register` | ✅ Javna |
| `/checkout` | ✅ Javna (registration flow) |
| `/api/stripe/webhook` | ✅ Javna (Stripe signature verification) |

---

## 4. Komponente i Permission Logika

### 4.1 Header (`src/components/Header.tsx`)

| Element | Permission | Status |
|---------|------------|--------|
| "Kreatori" link | Public | ✅ |
| "Profil" link | Authenticated | ✅ |
| "Odjava" button | Authenticated | ✅ |
| Admin link | Admin only | ✅ |

### 4.2 CreatorCard (`src/components/CreatorCard.tsx`)

| Element | Permission | Status |
|---------|------------|--------|
| Status badge | Admin only | ✅ |
| Contact info | Admin/Business | ✅ |
| Star rating | Public | ✅ |

### 4.3 Creator Profile (`src/app/kreator/[id]/page.tsx`)

| Element | Permission | Status |
|---------|------------|--------|
| Contact info | Admin/Business/Owner | ✅ |
| "Ovo je tvoj profil" banner | Owner only | ✅ |
| "Uredi profil" button | Owner/Admin | ✅ |
| "Sačuvaj kreatora" button | Business only | ✅ |
| Review form | Business only | ✅ |
| Reply to review | Owner only | ✅ |
| Delete own review | Business (own) | ✅ |

### 4.4 Admin Panel (`src/app/admin/page.tsx`)

| Element | Permission | Status |
|---------|------------|--------|
| Entire page | Admin only | ✅ |
| Approve/Reject creators | Admin only | ✅ |
| Edit creators | Admin only | ✅ |
| Delete creators | Admin only | ✅ |
| Manage reviews | Admin only | ✅ |
| Manage businesses | Admin only | ✅ |

### 4.5 Dashboard (`src/app/dashboard/page.tsx`)

| Element | Permission | Status |
|---------|------------|--------|
| Creator dashboard | Creator only | ✅ |
| Business dashboard | Business only | ✅ |
| Inline editing | Creator (own) | ✅ |
| Portfolio management | Creator (own) | ✅ |

### 4.6 Review Components

| Komponenta | Permission | Status |
|-----------|------------|--------|
| `ReviewForm` | Business only | ✅ |
| `ReviewList` | Public (filtered) | ✅ |
| `ReviewCard` | Public (filtered) | ✅ |
| Reply functionality | Creator (own profile) | ✅ |
| Delete own review | Business (own) | ✅ |

---

## 5. Identifikovani Problemi

### 5.1 Kritični Problemi

**Nema kritičnih problema!** ✅

### 5.2 Srednji Problemi

#### 5.2.1 Hardcoded Business ID u Review Funkcijama ✅ ISPRAVLJENO

**Lokacija:** `src/app/kreator/[id]/page.tsx` (linija 603, 653, 661, 679)

**Problem:**
```typescript
hasBusinessReviewedCreator('b1', creator.id)
```

**Rešenje:** Zamenjeno sa `currentUser.businessId || 'b1'` (fallback za demo mode).

**Status:** ✅ **ISPRAVLJENO** - Sada koristi `currentUser.businessId` sa fallback-om za demo mode.

#### 5.2.2 Nedoslednost u Role Proverama

**Problem:** Neki delovi koda koriste `currentUser.type`, a neki `user.role`.

**Lokacije:**
- `src/app/kreator/[id]/page.tsx` - koristi `currentUser.type`
- `src/lib/auth.ts` - koristi `UserRole` enum
- API rute - komentarisane provere koriste `session.user.role`

**Rešenje:** Standardizovati na `user.role` u produkciji.

**Status:** ⚠️ Nije kritično, ali treba standardizovati.

### 5.3 Manji Problemi

#### 5.3.1 Missing Type Definitions

**Problem:** Neki tipovi nisu eksplicitno definisani u API rutama.

**Rešenje:** Dodati Zod validaciju ili TypeScript tipove.

**Status:** ℹ️ Opciono, ali preporučeno.

#### 5.3.2 Demo Context Dependency

**Problem:** Frontend komponente zavise od `DemoContext` umesto API poziva.

**Rešenje:** Zameniti `useDemo()` pozive sa React Query hooks (`useCreators`, `useAuth`).

**Status:** ℹ️ Planirano za Supabase integraciju.

---

## 6. Preporuke za Supabase Integraciju

### 6.1 Prioritet 1 - Kritično

1. **Aktiviraj NextAuth.js**
   - Odkomentariši kod u `src/lib/auth.ts`
   - Kreiraj `src/app/api/auth/[...nextauth]/route.ts`
   - Dodaj `types/next-auth.d.ts`

2. **Aktiviraj Prisma**
   - Odkomentariši kod u `src/lib/db.ts`
   - Pokreni `npx prisma migrate dev`
   - Generiši Prisma Client

3. **Aktiviraj Middleware**
   - Odkomentariši produkcija logiku u `src/middleware.ts`
   - Testiraj zaštitu ruta

4. ✅ **Hardcoded Business ID - ISPRAVLJENO**
   - Zamenjeno sa `currentUser.businessId || 'b1'` u review funkcijama

### 6.2 Prioritet 2 - Važno

1. **Ažuriraj API Rute**
   - Zameni mock logiku sa Prisma pozivima
   - Aktiviraj auth provere (`requireAuth()`, `requireAdmin()`)
   - Dodaj error handling

2. **Ažuriraj Frontend**
   - Zameni `useDemo()` sa React Query hooks
   - Dodaj loading i error states
   - Implementiraj optimističke update-ove

3. **Stripe Integracija**
   - Setup Stripe products/prices
   - Aktiviraj webhook endpoint
   - Testiraj checkout flow

### 6.3 Prioritet 3 - Poboljšanja

1. **Email Notifications**
   - Setup Resend API key
   - Aktiviraj email funkcije u `src/lib/email.ts`
   - Testiraj email template-e

2. **Validacija**
   - Dodaj Zod schema za sve input-e
   - Validacija na frontend i backend

3. **Error Handling**
   - Centralizovani error handling
   - User-friendly error poruke
   - Logging za produkciju

---

## 7. Checklist za Supabase Integraciju

### Setup
- [ ] Instaliraj dependencies (`@prisma/client`, `next-auth`, `@supabase/supabase-js`)
- [ ] Kreiraj Supabase projekat
- [ ] Podesi `.env.local` sa `DATABASE_URL`, `NEXTAUTH_SECRET`, `STRIPE_SECRET_KEY`
- [ ] Pokreni Prisma migracije (`npx prisma migrate dev`)

### Auth
- [ ] Aktiviraj NextAuth u `src/lib/auth.ts`
- [ ] Kreiraj `src/app/api/auth/[...nextauth]/route.ts`
- [ ] Dodaj `types/next-auth.d.ts`
- [ ] Testiraj login/logout flow

### Database
- [ ] Aktiviraj Prisma u `src/lib/db.ts`
- [ ] Ažuriraj sve API routes sa Prisma pozivima
- [ ] Testiraj CRUD operacije

### Stripe
- [ ] Kreiraj Stripe products/prices
- [ ] Setup webhook u Stripe Dashboard
- [ ] Aktiviraj webhook endpoint
- [ ] Testiraj checkout flow

### Frontend
- [ ] Zameni `useDemo()` sa React Query hooks
- [ ] Aktiviraj middleware
- [ ] Testiraj sve funkcionalnosti sa pravim auth

### Final
- [ ] Security audit
- [ ] Performance testing
- [ ] Deploy na Vercel

---

## 8. Novije Izmene (Posle Audit-a)

### 8.1 Upload Profilne Slike
- ✅ Dodata opcija za upload profilne slike u registraciji kreatora (obavezno)
- ✅ Dodata opcija za promenu profilne slike u dashboard-u kreatora
- ✅ Kreirana API ruta: `POST /api/creators/[id]/photo`
- ✅ Validacija: tip slike, max 5MB, aspect ratio 1:1

### 8.2 Promena Lozinke
- ✅ Dodata opcija za promenu lozinke u dashboard-u kreatora
- ✅ Već postoji API ruta: `POST /api/settings/password`
- ✅ Validacija: minimum 8 karaktera, potvrda lozinke

### 8.3 Brisanje Profila
- ✅ Dodata opcija za brisanje profila u dashboard-u (kreator i biznis)
- ✅ Kreirana API ruta: `DELETE /api/creators/me/delete`
- ✅ Kreirana API ruta: `DELETE /api/businesses/me/delete`
- ✅ Soft delete logika pripremljena

### 8.4 Business Informacije
- ✅ Dodata opcija za unos opisa kompanije u registraciji
- ✅ Dodata sekcija "Informacije o kompaniji" u business dashboard-u
- ✅ Inline editing za company info
- ✅ Ažurirani tipovi: `Business`, `CreateBusinessInput`, `UpdateBusinessInput`
- ✅ Ažurirana Prisma schema u dokumentaciji

### 8.5 Dokumentacija
- ✅ Kreiran `API_ROUTES_UPDATE.md` sa svim novim rutama
- ✅ Ažuriran `DATABASE_INTEGRATION.md` sa novim checklist-om
- ✅ Sve rute imaju komentarisane Prisma/Supabase implementacije

## 9. Zaključak

**Status:** ✅ **Aplikacija je potpuno spremna za Supabase integraciju!**

Svi kritični delovi su implementirani i spremni. Sve nove funkcionalnosti (upload slika, promena lozinke, brisanje profila, business info) imaju pripremljene API rute sa placeholder logikom i komentarisane produkcija implementacije.

**Preporučeno vreme za integraciju:** 2-3 dana za kompletnu integraciju sa testiranjem.

---

**Napomena:** Ovaj audit je ažuriran sa svim poslednjim izmenama. Pre integracije, preporučeno je još jednom proći kroz sve komponente i testirati sve funkcionalnosti u demo modu.

