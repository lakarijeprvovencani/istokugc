# Plan: Sistem lokacije (canonical location + geo + mapa)

> Cilj: korisnik ne može da ukuca random mesto — bira grad iz ponude, mi čuvamo
> koordinate, pa baza tačno vuče. Plus „nearby" filter (biznis iz Niša vidi
> kreatore iz Niša/okoline) i mapa Balkana na landing-u sa brojem kreatora po gradu.
>
> Sve **besplatno i legalno** (bez plaćenih API-ja, bez scraping-a).

---

## 1. Trenutno stanje (zatečeno u kodu)

| Mesto | Stanje sad |
|------|------------|
| `src/app/register/kreator/page.tsx` | Slobodan tekst input (`location`, placeholder „Beograd, Srbija") |
| `src/app/register/biznis/page.tsx` | **Nema polje lokacije uopšte** |
| `src/app/api/creators/route.ts` | Vraća sve approved, **bez** filtera lokacije |
| `src/app/kreatori/page.tsx` | Klijentski filter; lokacija se hvata samo kroz tekst pretragu |
| DB `creators.location` | `text` (slobodan), bez `lat/lng` |
| DB `businesses` | nema lokaciju |
| Landing `src/app/page.tsx` | nema mapu |

Zaključak: lokacija je nestruktuirana → ne može pouzdan filter ni mapa.

---

## 2. Princip rešenja (kako rade veliki)

1. **Kanonski gradovi** — lokalna `cities` tabela (grad, država, `lat`, `lng`).
2. **Autocomplete pri unosu** — korisnik bira iz ponude, čuvamo `city_id` + `lat/lng`.
3. **Geo upiti** idu nad koordinatama, ne nad tekstom.

---

## 3. Zašto je ovo besplatno i bez hakova

- **Podaci o gradovima → GeoNames** (https://download.geonames.org/export/dump/).
  Licenca **CC BY 4.0** — besplatno i legalno, samo treba atribucija u footeru.
  Skinemo po državi: `RS.zip, BA.zip, HR.zip, ME.zip, MK.zip, SI.zip` (+ opc. `XK` Kosovo).
- **Geo upiti → PostGIS** — besplatna Postgres ekstenzija, ugrađena u Supabase
  (`create extension postgis`). `ST_DWithin` za radius „nearby".
- **Mapa → react-simple-maps (MIT) + Natural Earth TopoJSON (public domain)**,
  ili Leaflet + OpenStreetMap tiles (besplatno uz atribuciju).
- **Nema** Google Places, **nema** scraping-a, **nema** mesečnih troškova.

---

## 4. Šema baze (migracije)

```sql
-- 4.1 Ekstenzija
create extension if not exists postgis;

-- 4.2 Tabela gradova (seed iz GeoNames)
create table cities (
  id            bigint primary key,         -- geonameid
  name          text not null,              -- "Beograd"
  ascii_name    text not null,              -- "Beograd" (za pretragu bez kvačica)
  country_code  text not null,              -- "RS","BA","HR","ME","MK","SI"
  lat           double precision not null,
  lng           double precision not null,
  population    integer default 0,
  geom          geography(Point, 4326)      -- za ST_DWithin
);
create index cities_geom_idx on cities using gist (geom);
create index cities_search_idx on cities (lower(ascii_name));

-- 4.3 Lokacija na creators i businesses
alter table creators
  add column city_id bigint references cities(id),
  add column lat double precision,
  add column lng double precision,
  add column geom geography(Point, 4326);
create index creators_geom_idx on creators using gist (geom);

alter table businesses
  add column city_id bigint references cities(id),
  add column lat double precision,
  add column lng double precision;
```

> `lat/lng/geom` na nalogu su denormalizovani (kopija iz grada) zbog brzine geo upita.
> Stari `creators.location` (text) ZADRŽAVAMO privremeno radi migracije (vidi 6).

---

## 5. Faze implementacije

### Faza A — Cities tabela + seed (besplatno, GeoNames)
- **Nova migracija**: SQL iz tačke 4 (`postgis`, `cities`, kolone).
- **Nova skripta** `scripts/seed-cities.mjs`:
  - skine/parsira GeoNames `.txt` za RS/BA/HR/ME/MK/SI,
  - filtrira po populaciji (npr. `population >= 2000`) da izbegnemo zaseoke,
  - upiše u `cities` (+ popuni `geom = ST_MakePoint(lng,lat)`).
- Rezultat: ~par stotina relevantnih gradova, jednom i gotovo.

### Faza B — Autocomplete API
- **Nova ruta** `src/app/api/cities/route.ts` (GET `?q=beo`):
  - `select id,name,country_code,lat,lng from cities where lower(ascii_name) like 'beo%' order by population desc limit 8`.
  - javno, keširano (gradovi se ne menjaju).

### Faza C — Registracija (kreator + biznis)
- **`src/app/register/kreator/page.tsx`**: tekst input → autocomplete komponenta.
  Bira grad → čuvamo `cityId` (+ `lat/lng` denormalizovano). Bez slobodnog teksta.
- **`src/app/register/biznis/page.tsx`**: **dodati** isti picker (biznisu treba lokacija).
- **Nova komponenta** `src/components/CityAutocomplete.tsx` (reuse na oba mesta).
- **API za upis**: `src/app/api/auth/register/creator/route.ts` i biznis ruta —
  prihvataju `cityId`, povuku `lat/lng` iz `cities`, upišu `geom`.
- **Validacija** `src/lib/validations.ts`: `cityId` obavezan (umesto/uz `location`).

### Faza D — Filter + „nearby" na pretrazi kreatora
- **`src/app/api/creators/route.ts`**: dodati serverske filtere:
  - `?cityId=` → isti grad (`where city_id = ...`),
  - `?nearCityId=&radiusKm=` → `ST_DWithin(geom, (point grada), radiusKm*1000)`,
  - vraćamo i `distance` radi sortiranja „najbliži prvo".
  - (Bonus) kad biznis gleda, default `nearCityId` = njegov grad.
- **`src/app/kreatori/page.tsx`**: dodati dropdown „Grad" + „U krugu od X km";
  prebaciti filter na server (sad je klijentski) zbog tačnosti i paginacije.

### Faza E — Mapa na landing-u
- **Nova ruta** `src/app/api/stats/locations/route.ts`:
  - `select city_id, count(*) ... group by city_id` + join `cities` →
    vraća `[{ name, country, lat, lng, count }]` (samo approved kreatori).
  - keširano (npr. 5 min).
- **Nova komponenta** `src/components/CreatorsMap.tsx`:
  - `react-simple-maps` + Balkan TopoJSON; tačka/balon po gradu, veličina ~ broj.
  - klik na grad → vodi na `/kreatori?cityId=...`.
- Ubaciti u `src/app/page.tsx` (landing) sekciju „Kreatori širom regiona".

### Faza F — Migracija postojećih podataka
- Trenutno 9 kreatora ima slobodan `location` tekst.
- **Skripta** `scripts/migrate-locations.mjs`:
  - za svakog kreatora pokuša match `location` → `cities.ascii_name` (fuzzy/lower),
  - upiše `city_id/lat/lng/geom`;
  - nepoznate izlistati ručno (9 komada — par minuta).
- Posle migracije: `location` text kolona može da ostane (display) ili da se ukloni.

---

## 6. Geo upit — primer (PostGIS)

```sql
-- Kreatori u krugu od 50km od datog grada, najbliži prvo
select c.*, ST_Distance(c.geom, city.geom) as distance_m
from creators c
cross join (select geom from cities where id = :nearCityId) city
where c.status = 'approved'
  and c.geom is not null
  and ST_DWithin(c.geom, city.geom, :radiusKm * 1000)
order by distance_m asc;
```

> Pozvati kroz Supabase RPC (`create function`) ili `.rpc()` — PostGIS funkcije
> nisu dostupne kroz obični PostgREST `select`, pa pravimo SQL funkciju.

---

## 7. Besplatni izvori (linkovi)

- GeoNames dump: https://download.geonames.org/export/dump/ (CC BY 4.0)
- PostGIS u Supabase: `create extension postgis;`
- react-simple-maps: https://www.react-simple-maps.io/ (MIT)
- TopoJspon (Natural Earth, public domain): https://github.com/topojson/world-atlas

Atribucija: dodati „Geo podaci © GeoNames (CC BY)" u footer.

---

## 8. Procena truda

| Faza | Trud |
|------|------|
| A — cities + seed | ~pola dana |
| B — autocomplete API | ~1-2h |
| C — registracija (kreator+biznis) + komponenta | ~pola dana |
| D — filter + nearby (server + UI) | ~pola dana (više ako fini radius UX) |
| E — mapa landing | ~1 dan |
| F — migracija 9 postojećih | ~1-2h |
| **Ukupno** | **~2.5–3 dana** |

**MVP varijanta (bez mape/radiusa, ~1 dan):** Faze A + B + C + filter „isti grad".
Mapu i „nearby radius" dodati kasnije.

---

## 9. Rizici / napomene

- **Kosovo (XK)**: GeoNames ga vodi posebno; odluči da li uključuješ.
- **Duplikati imena** (npr. više „Novi Sad"-ova u regionu — retko): biramo po populaciji.
- **PostgREST + PostGIS**: radius upiti idu kroz SQL funkciju/RPC, ne kroz običan select.
- **Mapa tiles**: react-simple-maps koristi statički TopoJSON (nema tile troška);
  ako se ide Leaflet+OSM, poštovati OSM usage policy (za marker mapu je ok).
- Nije destruktivno: dodajemo kolone, stari `location` ostaje dok migracija ne prođe.
```
