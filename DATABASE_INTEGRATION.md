# 🗄️ Integracija sa Bazom Podataka

Ovaj dokument opisuje kako povezati aplikaciju sa pravom bazom podataka (Supabase/PostgreSQL).

## ✅ Trenutni Status

Aplikacija je **potpuno spremna** za integraciju sa bazom. Sve funkcionalnosti rade u demo modu sa localStorage i mogu se prebaciti na bazu sa minimalnim izmenama.

## 📁 Pripremljena Struktura

```
src/
├── types/
│   ├── index.ts              # ✅ Centralizovani tipovi (spremni za Prisma)
│   ├── subscription.ts       # ✅ Subscription tipovi
│   └── review.ts             # ✅ Review tipovi
├── lib/
│   ├── db.ts                 # ✅ Placeholder za bazu + Prisma schema
│   ├── auth.ts               # ✅ Helper funkcije + NextAuth config
│   ├── email.ts              # ✅ Email servis (Resend)
│   ├── emailTemplates.ts     # ✅ HTML email template-i
│   └── mockData.ts           # ✅ Mock podaci (zameniće se bazom)
├── hooks/
│   ├── index.ts              # ✅ Centralni export
│   ├── useCreators.ts        # ✅ Hooks sa React Query placeholder
│   ├── useAuth.ts            # ✅ Auth hooks sa NextAuth placeholder
│   └── useSubscription.ts    # ✅ Subscription hooks
├── context/
│   └── DemoContext.tsx       # ✅ Demo state management (zameniće se bazom)
└── app/api/
    ├── auth/route.ts         # ✅ Auth placeholder
    ├── creators/
    │   ├── route.ts          # ✅ GET/POST kreatori
    │   └── [id]/route.ts     # ✅ GET/PUT/DELETE kreator
    ├── businesses/route.ts   # ✅ GET/POST biznisi
    ├── reviews/
    │   ├── route.ts          # ✅ GET/POST recenzije
    │   └── [id]/
    │       ├── route.ts      # ✅ GET/PUT/DELETE recenzija
    │       ├── approve/      # ✅ POST approve
    │       ├── reject/       # ✅ POST reject
    │       └── reply/        # ✅ POST reply
    ├── favorites/route.ts    # ✅ GET/POST/DELETE omiljeni
    ├── recently-viewed/      # ✅ GET/POST nedavno pregledani
    ├── notifications/route.ts # ✅ POST slanje notifikacija
    ├── settings/
    │   ├── route.ts          # ✅ GET/PUT podešavanja
    │   └── password/         # ✅ POST promena lozinke
    ├── stripe/
    │   ├── create-checkout/  # ✅ POST kreiraj checkout
    │   ├── portal/           # ✅ POST customer portal
    │   └── webhook/          # ✅ POST Stripe webhook
    └── subscription/
        ├── status/           # ✅ GET status pretplate
        ├── cancel/           # ✅ POST otkaži
        ├── reactivate/       # ✅ POST reaktiviraj
        ├── change-plan/      # ✅ POST promeni plan
        └── invoices/         # ✅ GET fakture
```

## 🗃️ Database Schema (Prisma)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ==========================================
// USER & AUTH
// ==========================================

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  password      String
  name          String
  role          UserRole  @default(GUEST)
  
  // Relations
  creator       Creator?
  business      Business?
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

enum UserRole {
  GUEST
  CREATOR
  BUSINESS
  ADMIN
}

// ==========================================
// CREATORS
// ==========================================

model Creator {
  id            String         @id @default(cuid())
  userId        String         @unique
  user          User           @relation(fields: [userId], references: [id])
  
  name          String
  photo         String?
  bio           String
  categories    String[]
  platforms     String[]
  languages     String[]
  location      String
  priceFrom     Float
  email         String
  phone         String?
  instagram     String?
  
  status        CreatorStatus  @default(PENDING)
  approved      Boolean        @default(false)
  
  // Relations
  portfolio     Portfolio[]
  reviews       Review[]
  favorites     Favorite[]
  recentViews   RecentView[]
  
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
}

enum CreatorStatus {
  PENDING
  APPROVED
  DEACTIVATED
}

model Portfolio {
  id            String    @id @default(cuid())
  creatorId     String
  creator       Creator   @relation(fields: [creatorId], references: [id], onDelete: Cascade)
  
  type          String    // 'youtube' | 'tiktok' | 'instagram'
  url           String
  thumbnail     String
  
  createdAt     DateTime  @default(now())
}

// ==========================================
// BUSINESSES & SUBSCRIPTIONS
// ==========================================

model Business {
  id                String         @id @default(cuid())
  userId            String         @unique
  user              User           @relation(fields: [userId], references: [id])
  
  companyName       String
  email             String
  website           String?
  industry          String?
  
  // Stripe
  stripeCustomerId  String?        @unique
  
  // Relations
  subscription      Subscription?
  reviews           Review[]
  favorites         Favorite[]
  recentViews       RecentView[]
  settings          BusinessSettings?
  
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt
}

model Subscription {
  id                    String             @id @default(cuid())
  businessId            String             @unique
  business              Business           @relation(fields: [businessId], references: [id])
  
  stripeSubscriptionId  String             @unique
  stripePriceId         String
  
  plan                  SubscriptionPlan
  status                SubscriptionStatus
  
  currentPeriodStart    DateTime
  currentPeriodEnd      DateTime
  cancelAt              DateTime?
  canceledAt            DateTime?
  endedAt               DateTime?
  
  trialStart            DateTime?
  trialEnd              DateTime?
  
  // Relations
  invoices              Invoice[]
  
  createdAt             DateTime           @default(now())
  updatedAt             DateTime           @updatedAt
}

enum SubscriptionPlan {
  MONTHLY
  YEARLY
}

enum SubscriptionStatus {
  ACTIVE
  PAST_DUE
  UNPAID
  CANCELED
  EXPIRED
  TRIALING
  INCOMPLETE
  INCOMPLETE_EXPIRED
}

model Invoice {
  id                String       @id @default(cuid())
  subscriptionId    String
  subscription      Subscription @relation(fields: [subscriptionId], references: [id])
  
  stripeInvoiceId   String       @unique
  amountDue         Int
  amountPaid        Int
  status            String
  hostedInvoiceUrl  String?
  invoicePdf        String?
  
  periodStart       DateTime
  periodEnd         DateTime
  dueDate           DateTime?
  paidAt            DateTime?
  
  createdAt         DateTime     @default(now())
}

// ==========================================
// REVIEWS
// ==========================================

model Review {
  id              String        @id @default(cuid())
  creatorId       String
  creator         Creator       @relation(fields: [creatorId], references: [id], onDelete: Cascade)
  businessId      String
  business        Business      @relation(fields: [businessId], references: [id])
  
  rating          Int           // 1-5
  comment         String
  status          ReviewStatus  @default(PENDING)
  
  creatorReply    String?
  creatorReplyAt  DateTime?
  rejectionReason String?
  
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  
  @@unique([creatorId, businessId]) // One review per business per creator
}

enum ReviewStatus {
  PENDING
  APPROVED
  REJECTED
}

// ==========================================
// FAVORITES & RECENTLY VIEWED
// ==========================================

model Favorite {
  id          String    @id @default(cuid())
  businessId  String
  business    Business  @relation(fields: [businessId], references: [id], onDelete: Cascade)
  creatorId   String
  creator     Creator   @relation(fields: [creatorId], references: [id], onDelete: Cascade)
  
  createdAt   DateTime  @default(now())
  
  @@unique([businessId, creatorId])
}

model RecentView {
  id          String    @id @default(cuid())
  businessId  String
  business    Business  @relation(fields: [businessId], references: [id], onDelete: Cascade)
  creatorId   String
  creator     Creator   @relation(fields: [creatorId], references: [id], onDelete: Cascade)
  
  viewedAt    DateTime  @default(now())
  
  @@unique([businessId, creatorId])
}

// ==========================================
// SETTINGS
// ==========================================

model BusinessSettings {
  id            String    @id @default(cuid())
  businessId    String    @unique
  business      Business  @relation(fields: [businessId], references: [id], onDelete: Cascade)
  
  // Notification preferences
  emailNotifications    Boolean @default(true)
  newCreatorAlerts      Boolean @default(true)
  promotionalEmails     Boolean @default(false)
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

// ==========================================
// WEBHOOK LOGS (for debugging)
// ==========================================

model WebhookEvent {
  id            String    @id @default(cuid())
  stripeEventId String    @unique
  type          String
  processed     Boolean   @default(false)
  error         String?
  
  createdAt     DateTime  @default(now())
}
```

## 🚀 Koraci za Integraciju

### 1. Instalacija Dependencies

```bash
# Prisma ORM
npm install prisma @prisma/client

# NextAuth.js
npm install next-auth

# React Query (opciono, za keširanje)
npm install @tanstack/react-query

# Za password hashing
npm install bcryptjs
npm install -D @types/bcryptjs

# Zod za validaciju
npm install zod

# Stripe
npm install stripe
```

### 2. Setup Supabase (ili drugog PostgreSQL providera)

1. Kreiraj projekat na [supabase.com](https://supabase.com)
2. Kopiraj DATABASE_URL iz Settings > Database

### 3. Environment Variables

Kreiraj `.env.local`:

```env
# Database
DATABASE_URL="postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres"

# NextAuth
NEXTAUTH_SECRET="your-super-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Stripe Price IDs (kreirati u Stripe Dashboard)
STRIPE_PRICE_MONTHLY="price_..."
STRIPE_PRICE_YEARLY="price_..."

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. Inicijalizacija Prisma

```bash
npx prisma init
# Kopiraj schema iznad u prisma/schema.prisma
npx prisma migrate dev --name init
npx prisma generate
```

### 5. Aktivacija Koda

#### 5.1 Aktiviraj Prisma Klijent

U `src/lib/db.ts`:
- Odkomentariši Prisma sekciju
- Obriši mock sekciju

#### 5.2 Aktiviraj NextAuth

1. Odkomentariši kod u `src/lib/auth.ts`
2. Kreiraj `src/app/api/auth/[...nextauth]/route.ts`:

```typescript
import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

3. Dodaj type augmentation u `src/types/next-auth.d.ts`

#### 5.3 Aktiviraj API Routes

U svakom API route fajlu:
- Odkomentariši "PRODUKCIJA" sekciju
- Obriši "DEMO MODE" sekciju

#### 5.4 Aktiviraj Middleware

U `src/middleware.ts`:
- Odkomentariši produkcijsku sekciju
- Obriši `return NextResponse.next()` na vrhu

#### 5.5 Zameni DemoContext

Komponente koje koriste `useDemo()` treba da koriste:
- `useAuth()` za auth funkcije
- `useQuery/useMutation` za data fetching
- Ili kreiraj nove context provajdere koji pozivaju API

### 6. Stripe Setup

1. Kreiraj Stripe nalog na [stripe.com](https://stripe.com)
2. Kreiraj Products i Prices u Stripe Dashboard:
   - Mesečni plan: €49/mesec
   - Godišnji plan: €490/godina
3. Kopiraj Price IDs u `.env.local`
4. Setup webhook u Stripe Dashboard:
   - Endpoint: `https://your-domain.com/api/stripe/webhook`
   - Events: checkout.session.completed, customer.subscription.*, invoice.*

## 📋 Checklist za Produkciju

### Setup
- [ ] Instaliraj dependencies
- [ ] Kreiraj Supabase projekat
- [ ] Podesi `.env.local`
- [ ] Pokreni Prisma migracije

### Auth
- [ ] Aktiviraj NextAuth u auth.ts
- [ ] Kreiraj [...nextauth] route
- [ ] Dodaj next-auth.d.ts

### Database
- [ ] Aktiviraj Prisma u db.ts
- [ ] Ažuriraj sve API routes

### Stripe
- [ ] Kreiraj Stripe products/prices
- [ ] Setup webhook
- [ ] Testiraj checkout flow

### Frontend
- [ ] Zameni DemoContext pozive
- [ ] Aktiviraj middleware
- [ ] Testiraj sve funkcionalnosti

### Final
- [ ] Security audit
- [ ] Performance testing
- [ ] Deploy na Vercel

## 🔐 Privilegije (Implementirano)

| Uloga | Pregled kreatora | Kontakt info | Uređivanje | Brisanje | Admin panel | Recenzije |
|-------|-----------------|--------------|------------|----------|-------------|-----------|
| Guest | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Creator | ✅ | ❌ | ✅ (samo svoj) | ❌ | ❌ | Može odgovoriti |
| Business | ✅ | ✅ | ❌ | ❌ | ❌ | Može ostaviti/obrisati |
| Admin | ✅ (sve) | ✅ | ✅ (sve) | ✅ | ✅ | Moderacija |

## 📊 Status Kreatora

| Status | Vidljiv u pretrazi | Admin vidi |
|--------|-------------------|------------|
| `approved` | ✅ | ✅ |
| `pending` | ❌ | ✅ |
| `deactivated` | ❌ | ✅ |

## 📊 Status Recenzija

| Status | Vidljiv javno | Creator vidi | Admin vidi |
|--------|--------------|--------------|------------|
| `pending` | ❌ | ❌ | ✅ |
| `approved` | ✅ | ✅ | ✅ |
| `rejected` | ❌ | ❌ | ✅ |

## 🎯 Preporučeni Stack

- **Baza**: PostgreSQL (Supabase)
- **ORM**: Prisma
- **Auth**: NextAuth.js
- **Payments**: Stripe
- **Cache**: React Query
- **Validacija**: Zod
- **Deployment**: Vercel

## ⏱️ Procenjeno Vreme za Integraciju

| Zadatak | Vreme |
|---------|-------|
| Setup Prisma + Migracije | 1-2h |
| NextAuth integracija | 2-3h |
| Stripe setup | 2-3h |
| API routes refaktoring | 3-4h |
| Frontend refaktoring | 2-3h |
| Testiranje | 3-4h |
| **UKUPNO** | **13-19h** |

---

## 📧 Email Notifikacije

### Pripremljeni Fajlovi

```
src/lib/
├── email.ts           # ✅ Centralni email servis
└── emailTemplates.ts  # ✅ HTML template-i za emailove

src/app/api/
└── notifications/route.ts  # ✅ API za slanje notifikacija (test)
```

### Podržane Notifikacije

| Tip | Primatelj | Trigger |
|-----|-----------|---------|
| `admin_new_creator` | Admin | Novi kreator aplicira |
| `admin_new_review` | Admin | Nova recenzija čeka odobrenje |
| `creator_approved` | Kreator | Admin odobri profil |
| `creator_rejected` | Kreator | Admin odbije profil |
| `creator_new_review` | Kreator | Dobije novu recenziju |
| `business_welcome` | Biznis | Uspešno plaćanje |
| `business_review_approved` | Biznis | Recenzija odobrena |
| `business_subscription_expiring` | Biznis | Pretplata ističe (7/3/1 dan pre) |

### Setup Email Servisa (Resend)

```bash
# 1. Instaliraj Resend
npm install resend

# 2. Dodaj u .env
RESEND_API_KEY=re_xxx
ADMIN_EMAIL=admin@ugcselect.com
FROM_EMAIL="UGC Select <noreply@ugcselect.com>"
```

### Aktiviranje u Produkciji

U `src/lib/email.ts`, odkomentariši Resend import i zakomentariši demo logove:

```typescript
// Promeni ovo:
import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);

// Zakomentariši DEMO MODE blok i odkomentariši PRODUKCIJA blok
```

### Cron Job za Subscription Expiry

Za automatsko obaveštavanje o isteku pretplate, koristi Vercel Cron ili sličan servis:

```typescript
// src/app/api/cron/subscription-expiry/route.ts
// Poziva se svaki dan u 9:00

export async function GET() {
  // 1. Dohvati sve pretplate koje ističu za 7, 3 ili 1 dan
  // 2. Pošalji email notifikaciju svakom biznis korisniku
  // 3. Logiraj rezultate
}
```

### Vreme za Setup

| Zadatak | Vreme |
|---------|-------|
| Resend account + domen verifikacija | 30 min |
| Aktivacija email funkcija | 30 min |
| Kreiranje cron job-a | 1h |
| Testiranje | 1h |
| **UKUPNO EMAIL** | **3h** |

---

## 📝 Notes

- Svi API routes imaju zakomentarisanu produkcijsku verziju
- DemoContext služi za testiranje bez baze
- Sve funkcionalnosti su testirane u demo modu
- Stripe webhook handler pokriva sve subscription lifecycle evente
- Review sistem uključuje admin moderaciju i creator replies
- Favorites i Recently Viewed su spremni za sinhronizaciju
- **Email servis** je spreman - samo treba odkomentarisati Resend kod
