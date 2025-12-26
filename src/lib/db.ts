/**
 * Database Configuration
 * 
 * Ovaj fajl je placeholder za buduću integraciju sa bazom podataka.
 * Kada se odluči koja baza će se koristiti (Prisma, Drizzle, itd.),
 * ovde će biti konfiguracija i klijent.
 * 
 * OPCIJE:
 * 1. Prisma + PostgreSQL/MySQL - najčešći izbor za Next.js
 * 2. Drizzle + PostgreSQL - moderniji, type-safe
 * 3. MongoDB + Mongoose - za NoSQL pristup
 * 4. Supabase - PostgreSQL sa real-time i auth
 * 5. PlanetScale - serverless MySQL
 */

// ============================================
// PLACEHOLDER - Prisma primer
// ============================================

/*
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
*/

// ============================================
// PLACEHOLDER - Drizzle primer
// ============================================

/*
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });
*/

// ============================================
// TRENUTNA IMPLEMENTACIJA - Mock data
// ============================================

// Dok se baza ne poveže, koristimo localStorage za persistenciju
// Sve funkcije za rad sa podacima su u DemoContext.tsx

export const DB_CONFIG = {
  // Ovo će se koristiti kada se doda prava baza
  isProduction: false,
  useMockData: true,
  
  // Buduće konfiguracije
  // DATABASE_URL: process.env.DATABASE_URL,
  // DIRECT_URL: process.env.DIRECT_URL, // Za Prisma
};

/**
 * Pomoćna funkcija za proveru da li se koristi prava baza
 * Korisno za uslovno izvršavanje koda
 */
export function isUsingRealDatabase(): boolean {
  return !DB_CONFIG.useMockData && !!process.env.DATABASE_URL;
}

/**
 * Placeholder funkcija za inicijalizaciju baze
 * Poziva se pri pokretanju aplikacije
 */
export async function initializeDatabase(): Promise<void> {
  if (isUsingRealDatabase()) {
    // Provera konekcije sa bazom
    console.log('🗄️ Connecting to database...');
    // await prisma.$connect();
    console.log('✅ Database connected successfully');
  } else {
    console.log('📦 Using mock data (localStorage)');
  }
}

// ============================================
// PRISMA SCHEMA TEMPLATE
// ============================================

/*
Kada se bude dodavala baza, evo šeme za prisma/schema.prisma:

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserRole {
  GUEST
  CREATOR
  BUSINESS
  ADMIN
}

enum CreatorStatus {
  PENDING
  APPROVED
  DEACTIVATED
}

enum SubscriptionStatus {
  ACTIVE
  EXPIRED
  NONE
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  name      String
  role      UserRole @default(GUEST)
  
  creator   Creator?
  business  Business?
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Creator {
  id         String        @id @default(cuid())
  userId     String        @unique
  user       User          @relation(fields: [userId], references: [id])
  
  name       String
  photo      String?
  bio        String
  categories String[]
  platforms  String[]
  languages  String[]
  location   String
  priceFrom  Int
  email      String
  phone      String?
  instagram  String?
  
  status     CreatorStatus @default(PENDING)
  approved   Boolean       @default(false)
  
  portfolio  PortfolioItem[]
  
  createdAt  DateTime      @default(now())
  updatedAt  DateTime      @updatedAt
}

model PortfolioItem {
  id        String   @id @default(cuid())
  creatorId String
  creator   Creator  @relation(fields: [creatorId], references: [id], onDelete: Cascade)
  
  type      String   // 'youtube' | 'tiktok' | 'instagram'
  url       String
  thumbnail String
  
  createdAt DateTime @default(now())
}

model Business {
  id                 String             @id @default(cuid())
  userId             String             @unique
  user               User               @relation(fields: [userId], references: [id])
  
  companyName        String
  email              String
  subscriptionType   String?            // 'monthly' | 'yearly'
  subscriptionStatus SubscriptionStatus @default(NONE)
  subscribedAt       DateTime?
  expiresAt          DateTime?
  
  createdAt          DateTime           @default(now())
  updatedAt          DateTime           @updatedAt
}
*/

export default DB_CONFIG;


