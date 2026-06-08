/**
 * Deljeni Postgres klijent za skripte.
 * Direktni host (db.<ref>.supabase.co) je IPv6-only i nedostupan sa ove mreze,
 * pa idemo preko Supabase poolera (IPv4, session mode 5432).
 */
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const POOLER_HOST = 'aws-1-eu-central-2.pooler.supabase.com';
const POOLER_PORT = 5432;

export function makeClient() {
  const url = new URL(process.env.DATABASE_URL);
  const ref = url.hostname.split('.')[1]; // db.<ref>.supabase.co
  return new pg.Client({
    host: POOLER_HOST,
    port: POOLER_PORT,
    user: `postgres.${ref}`,
    password: decodeURIComponent(url.password),
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
  });
}
