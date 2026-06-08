/**
 * Primeni .sql fajl na ZIVU bazu preko poolera.
 * Pokreni: node scripts/db/apply-sql.mjs <putanja-do-sql>
 */
import fs from 'fs';
import path from 'path';
import { makeClient } from './client.mjs';

const file = process.argv[2];
if (!file) { console.error('Usage: node scripts/db/apply-sql.mjs <file.sql>'); process.exit(1); }

const sql = fs.readFileSync(path.resolve(file), 'utf8');
const client = makeClient();

async function main() {
  await client.connect();
  console.log(`Primenjujem: ${file}`);
  await client.query('BEGIN');
  try {
    await client.query(sql);
    await client.query('COMMIT');
    console.log('✅ Uspešno primenjeno (COMMIT).');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('❌ Greška, ROLLBACK:', e.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}
main();
