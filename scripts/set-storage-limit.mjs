/**
 * Sinhronizuje Supabase 'portfolio' bucket limit sa MAX_IMAGE_MB iz
 * src/lib/upload-limits.ts (jedan izvor istine).
 *
 * SAMO SLIKE - video se dodaje preko linka, ne uploaduje se fajlom.
 *
 * Pokreni nakon sto promenis MAX_IMAGE_MB:
 *   node scripts/set-storage-limit.mjs
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Procitaj MAX_IMAGE_MB iz upload-limits.ts (da ne dupliramo broj)
const limitsSrc = fs.readFileSync(
  path.resolve(process.cwd(), 'src/lib/upload-limits.ts'),
  'utf8'
);
const match = limitsSrc.match(/MAX_IMAGE_MB\s*=\s*(\d+)/);
const MAX_IMAGE_MB = match ? parseInt(match[1], 10) : 10;
const bytes = MAX_IMAGE_MB * 1024 * 1024;

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

async function main() {
  console.log(`Postavljam portfolio bucket limit na ${MAX_IMAGE_MB}MB (${bytes} bytes), samo slike...`);
  const { error } = await admin.storage.updateBucket('portfolio', {
    public: true,
    fileSizeLimit: bytes,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  });
  if (error) {
    console.error('Greška:', error.message);
    process.exit(1);
  }
  const { data: b } = await admin.storage.getBucket('portfolio');
  console.log('OK. Trenutno:', JSON.stringify({ limit: b.file_size_limit, public: b.public }));
}

main();
