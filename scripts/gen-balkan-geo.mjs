/**
 * Generiše mali lokalni Balkan GeoJSON iz world-atlas (110m) dataseta.
 * Output: src/data/balkan-geo.json (bundle-uje se, bez CDN-a u produkciji).
 * Pokreni: node scripts/gen-balkan-geo.mjs
 * Geo podaci: Natural Earth (public domain) preko world-atlas.
 */
import { feature } from 'topojson-client';
import fs from 'fs';
import path from 'path';

// ISO numeric id-evi: RS, BA, HR, ME, MK, SI, AL (neki imaju vodeće nule)
const BALKAN = new Set([688, 70, 191, 499, 807, 705, 8]);

async function main() {
  const res = await fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json');
  const topo = await res.json();
  const fc = feature(topo, topo.objects.countries);
  const features = fc.features
    .filter((f) => BALKAN.has(Number(f.id)))
    .map((f) => ({
      type: 'Feature',
      id: f.id,
      properties: { name: f.properties?.name || '' },
      geometry: f.geometry,
    }));

  const out = { type: 'FeatureCollection', features };
  const dir = path.resolve(process.cwd(), 'src/data');
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'balkan-geo.json');
  fs.writeFileSync(file, JSON.stringify(out));
  console.log(`✅ ${features.length} zemalja -> ${file} (${(fs.statSync(file).size / 1024).toFixed(1)} KB)`);
  console.log('Zemlje:', features.map((f) => f.properties.name).join(', '));
}
main().catch((e) => { console.error('❌', e.message); process.exit(1); });
