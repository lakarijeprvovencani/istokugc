/**
 * Faza F: mapira postojeću slobodnu lokaciju kreatora -> city_id/lat/lng.
 * Trigger automatski popuni geom. Nepoznate izlistava za ručno rešavanje.
 * Pokreni: node scripts/db/migrate-creator-locations.mjs
 */
import { makeClient } from './client.mjs';

function cityToken(location) {
  if (!location) return '';
  // "Beograd, Srbija" -> "Beograd"; skini višak
  return location.split(',')[0].trim();
}

async function main() {
  const client = makeClient();
  await client.connect();

  const { rows: creators } = await client.query(
    `select id, name, location from public.creators where city_id is null`
  );
  console.log(`Kreatora bez city_id: ${creators.length}`);

  let matched = 0;
  const unmatched = [];

  for (const c of creators) {
    const token = cityToken(c.location);
    if (!token) { unmatched.push(`${c.name} (prazno)`); continue; }

    const { rows } = await client.query(
      `select id, lat, lng, name, country_code from public.cities
       where lower(ascii_name) = lower($1)
          or lower(name) = lower($1)
          or alt_names ~* ('(^|,)' || $1 || '(,|$)')
       order by (country_code='RS') desc, population desc
       limit 1`,
      [token]
    );

    if (rows.length === 0) {
      unmatched.push(`${c.name} -> "${c.location}"`);
      continue;
    }

    const city = rows[0];
    await client.query(
      `update public.creators set city_id=$1, lat=$2, lng=$3 where id=$4`,
      [city.id, city.lat, city.lng, c.id]
    );
    matched++;
    console.log(`✓ ${c.name}: "${c.location}" -> ${city.name} (${city.country_code})`);
  }

  console.log(`\n✅ Mapirano: ${matched}/${creators.length}`);
  if (unmatched.length) {
    console.log('⚠️  Nije mapirano (ručno rešiti):');
    unmatched.forEach((u) => console.log('   -', u));
  }

  // Provera: koliko kreatora sad ima geom
  const { rows: geo } = await client.query(
    `select count(*)::int n from public.creators where geom is not null`
  );
  console.log(`Kreatora sa geom: ${geo[0].n}`);
  await client.end();
}

main().catch((e) => { console.error('❌', e.message); process.exit(1); });
