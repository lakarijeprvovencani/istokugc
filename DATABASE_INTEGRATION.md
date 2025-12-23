# 🗄️ Integracija sa Bazom Podataka

Ovaj dokument opisuje kako povezati aplikaciju sa pravom bazom podataka.

## 📁 Pripremljena Struktura

```
src/
├── types/
│   └── index.ts          # ✅ Centralizovani tipovi (spremni za Prisma)
├── lib/
│   ├── db.ts             # ✅ Placeholder za bazu + Prisma schema
│   └── auth.ts           # ✅ Helper funkcije + NextAuth config
├── hooks/
│   ├── index.ts          # ✅ Centralni export
│   ├── useCreators.ts    # ✅ Hooks sa React Query placeholder
│   └── useAuth.ts        # ✅ Auth hooks sa NextAuth placeholder
└── app/api/
    ├── auth/route.ts     # ✅ Auth placeholder
    ├── creators/
    │   ├── route.ts      # ✅ GET/POST kreatori
    │   └── [id]/route.ts # ✅ GET/PUT/DELETE kreator
    └── businesses/
        └── route.ts      # ✅ GET/POST biznisi
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
```

### 2. Inicijalizacija Prisma

```bash
npx prisma init
```

Ovo kreira `prisma/schema.prisma`. Kopiraj šemu iz `src/lib/db.ts`.

### 3. Konfiguracija Baze

U `.env`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/ugc_select"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

### 4. Migracija Baze

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 5. Aktivacija Prisma Klijenta

U `src/lib/db.ts`, odkomentariši Prisma sekciju i obriši mock implementaciju.

### 6. Aktivacija NextAuth

1. Odkomentariši kod u `src/lib/auth.ts`
2. Kreiraj `src/app/api/auth/[...nextauth]/route.ts`:

```typescript
import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

3. Dodaj type augmentation u `src/types/next-auth.d.ts`

### 7. Aktivacija React Query (Opciono)

U `src/app/layout.tsx`:

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

// Wrap children sa:
<QueryClientProvider client={queryClient}>
  {children}
</QueryClientProvider>
```

### 8. Zamena Mock Implementacija

U hooks fajlovima (`useCreators.ts`, `useAuth.ts`):
- Odkomentariši React Query / NextAuth sekcije
- Obriši trenutne mock implementacije

U API routes:
- Odkomentariši Prisma sekcije
- Obriši mock implementacije

## 📋 Checklist

- [ ] Instaliraj dependencies
- [ ] Kreiraj `.env` sa DATABASE_URL
- [ ] Inicijalizuj Prisma
- [ ] Kopiraj schema iz db.ts
- [ ] Pokreni migracije
- [ ] Aktiviraj Prisma klijent u db.ts
- [ ] Aktiviraj NextAuth u auth.ts
- [ ] Kreiraj [...nextauth] route
- [ ] Ažuriraj API routes
- [ ] Ažuriraj hooks
- [ ] Testiraj sve funkcionalnosti
- [ ] Obriši DemoContext (ili ga zadrži za testiranje)

## 🔐 Privilegije (Već Implementirano)

| Uloga | Pregled kreatora | Uređivanje | Brisanje | Admin panel |
|-------|-----------------|------------|----------|-------------|
| Guest | ❌ | ❌ | ❌ | ❌ |
| Creator | ✅ | ✅ (samo svoj) | ❌ | ❌ |
| Business (neplaćen) | ❌ | ❌ | ❌ | ❌ |
| Business (plaćen) | ✅ | ❌ | ❌ | ❌ |
| Admin | ✅ (sve) | ✅ (sve) | ✅ | ✅ |

## 📊 Status Kreatora

| Status | Vidljiv u pretrazi | Admin vidi |
|--------|-------------------|------------|
| `approved` | ✅ | ✅ |
| `pending` | ❌ | ✅ |
| `deactivated` | ❌ | ✅ |

## 🎯 Preporučeni Stack

- **Baza**: PostgreSQL (Supabase, Neon, ili Railway)
- **ORM**: Prisma
- **Auth**: NextAuth.js sa Credentials + OAuth
- **Cache**: React Query
- **Validacija**: Zod
- **Deployment**: Vercel

## ⏱️ Procenjeno Vreme

| Zadatak | Vreme |
|---------|-------|
| Setup Prisma + Migracije | 1-2h |
| NextAuth integracija | 2-3h |
| API routes refaktoring | 2-3h |
| Hooks refaktoring | 1-2h |
| Testiranje | 2-3h |
| **UKUPNO** | **8-13h** |

