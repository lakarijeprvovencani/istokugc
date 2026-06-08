/**
 * Seed cities tabele iz GeoNames cities500 dumpa.
 * Filtrira na region: RS, BA, HR, ME, MK, SI, AL, XK (Kosovo).
 *
 * Preduslov: /tmp/cities500.txt (skinuto sa download.geonames.org).
 * Pokreni: node scripts/db/seed-cities.mjs
 *
 * Idempotentno: on conflict (id) do nothing.
 * Geo podaci © GeoNames (CC BY 4.0).
 */
import fs from 'fs';
import readline from 'readline';
import { makeClient } from './client.mjs';

const COUNTRIES = new Set(['RS', 'BA', 'HR', 'ME', 'MK', 'SI', 'AL', 'XK']);
const SRC = '/tmp/cities500.txt';

async function main() {
  if (!fs.existsSync(SRC)) {
    console.error('❌ Nema', SRC, '- skini cities500.zip prvo.');
    process.exit(1);
  }

  const rows = [];
  const rl = readline.createInterface({ input: fs.createReadStream(SRC), crlfDelay: Infinity });
  for await (const line of rl) {
    const f = line.split('\t');
    const country = f[8];
    if (!COUNTRIES.has(country)) continue;
    const id = parseInt(f[0], 10);
    const name = f[1];
    const ascii = f[2] || f[1];
    const lat = parseFloat(f[4]);
    const lng = parseFloat(f[5]);
    const pop = parseInt(f[14], 10) || 0;
    // alternativna imena (lokalni nazivi, npr. "Beograd" za Belgrade) - za pretragu
    const alt = (f[3] || '').toLowerCase();
    if (!id || isNaN(lat) || isNaN(lng)) continue;
    rows.push({ id, name, ascii, country, lat, lng, pop, alt });
  }
  console.log(`Filtrirano ${rows.length} gradova iz regiona.`);

  const client = makeClient();
  await client.connect();

  await client.query(`alter table public.cities add column if not exists alt_names text;`);

  const CHUNK = 300;
  let inserted = 0;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const batch = rows.slice(i, i + CHUNK);
    const values = [];
    const params = [];
    let p = 1;
    for (const r of batch) {
      // tekst parametrizovan; numerika inline (sigurno, parsirani brojevi)
      values.push(
        `(${r.id}, $${p++}, $${p++}, $${p++}, ${r.lat}, ${r.lng}, ${r.pop}, $${p++}, ` +
        `ST_SetSRID(ST_MakePoint(${r.lng}, ${r.lat}), 4326)::geography)`
      );
      params.push(r.name, r.ascii, r.country, r.alt);
    }
    const sql =
      `insert into public.cities (id, name, ascii_name, country_code, lat, lng, population, alt_names, geom) ` +
      `values ${values.join(',')} ` +
      `on conflict (id) do update set alt_names = excluded.alt_names, population = excluded.population;`;
    const res = await client.query(sql, params);
    inserted += res.rowCount;
  }

  // Display override za poznate gradove gde GeoNames koristi englesko ime
  const OVERRIDES = [
    ['Beograd', 'Belgrade', 'RS'],
  ];
  for (const [local, eng, cc] of OVERRIDES) {
    await client.query(
      `update public.cities set name=$1 where name=$2 and country_code=$3`,
      [local, eng, cc]
    );
  }
  await client.query(`create index if not exists cities_alt_idx on public.cities (alt_names text_pattern_ops);`);

  const { rows: cnt } = await client.query(
    `select country_code, count(*)::int n from public.cities group by country_code order by country_code;`
  );
  console.log('✅ Upisano (novih):', inserted);
  console.log('Po zemlji:', cnt.map(c => `${c.country_code}=${c.n}`).join(', '));
  await client.end();
}

main().catch((e) => { console.error('❌', e.message); process.exit(1); });
