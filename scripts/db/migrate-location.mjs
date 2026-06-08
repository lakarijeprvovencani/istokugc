/**
 * Faza A migracija: PostGIS + cities tabela + lat/lng/city_id na creators i
 * businesses + RPC funkcije (nearby, agregacija za mapu).
 *
 * ADITIVNO i idempotentno - ne dira postojece redove/kolone.
 * Pokreni: node scripts/db/migrate-location.mjs
 */
import { makeClient } from './client.mjs';

const SQL = `
-- 1) PostGIS
create extension if not exists postgis;

-- 2) Cities (kanonski gradovi)
create table if not exists public.cities (
  id            bigint primary key,
  name          text not null,
  ascii_name    text not null,
  country_code  text not null,
  lat           double precision not null,
  lng           double precision not null,
  population    integer default 0,
  geom          geography(Point, 4326)
);
create index if not exists cities_geom_idx   on public.cities using gist (geom);
create index if not exists cities_search_idx on public.cities (lower(ascii_name));
create index if not exists cities_country_idx on public.cities (country_code);

alter table public.cities enable row level security;
drop policy if exists "cities_public_read" on public.cities;
create policy "cities_public_read" on public.cities for select using (true);

-- 3) Lokacija na creators
alter table public.creators add column if not exists city_id bigint references public.cities(id);
alter table public.creators add column if not exists lat double precision;
alter table public.creators add column if not exists lng double precision;
alter table public.creators add column if not exists geom geography(Point, 4326);
create index if not exists creators_geom_idx on public.creators using gist (geom);
create index if not exists creators_city_idx on public.creators (city_id);

-- 4) Lokacija na businesses
alter table public.businesses add column if not exists city_id bigint references public.cities(id);
alter table public.businesses add column if not exists lat double precision;
alter table public.businesses add column if not exists lng double precision;

-- 4b) Trigger: auto-popuni creators.geom iz lat/lng (app salje samo lat/lng)
create or replace function public.set_creator_geom()
returns trigger language plpgsql as $$
begin
  if new.lat is not null and new.lng is not null then
    new.geom := ST_SetSRID(ST_MakePoint(new.lng, new.lat), 4326)::geography;
  else
    new.geom := null;
  end if;
  return new;
end;
$$;
drop trigger if exists creators_set_geom on public.creators;
create trigger creators_set_geom before insert or update of lat, lng on public.creators
  for each row execute function public.set_creator_geom();

-- 5) RPC: kreatori u krugu (nearby), najblizi prvo
create or replace function public.creators_nearby(
  in_lat double precision,
  in_lng double precision,
  in_radius_km double precision
)
returns setof public.creators
language sql
stable
as $$
  select c.*
  from public.creators c
  where c.status = 'approved'
    and c.geom is not null
    and ST_DWithin(c.geom, ST_MakePoint(in_lng, in_lat)::geography, in_radius_km * 1000)
  order by ST_Distance(c.geom, ST_MakePoint(in_lng, in_lat)::geography) asc;
$$;

-- 6) RPC: agregacija kreatora po gradu (za mapu)
create or replace function public.creators_by_city()
returns table (
  city_id bigint,
  name text,
  country_code text,
  lat double precision,
  lng double precision,
  count bigint
)
language sql
stable
as $$
  select ci.id, ci.name, ci.country_code, ci.lat, ci.lng, count(*)::bigint
  from public.creators c
  join public.cities ci on ci.id = c.city_id
  where c.status = 'approved' and c.city_id is not null
  group by ci.id, ci.name, ci.country_code, ci.lat, ci.lng
  order by count(*) desc;
$$;

grant execute on function public.creators_nearby(double precision, double precision, double precision) to anon, authenticated, service_role;
grant execute on function public.creators_by_city() to anon, authenticated, service_role;
`;

async function main() {
  const client = makeClient();
  await client.connect();
  console.log('Povezan. Pokrecem migraciju...');
  await client.query(SQL);
  console.log('✅ Migracija uspesna.');

  // Provera
  const { rows: ext } = await client.query("select extname from pg_extension where extname='postgis';");
  const { rows: cols } = await client.query(`
    select table_name, column_name from information_schema.columns
    where table_schema='public' and column_name in ('city_id','geom','lat','lng')
      and table_name in ('creators','businesses','cities')
    order by table_name, column_name;`);
  const { rows: fns } = await client.query(`
    select proname from pg_proc where proname in ('creators_nearby','creators_by_city');`);
  console.log('postgis:', ext.map(e => e.extname).join(',') || 'NEMA');
  console.log('kolone:', cols.map(c => `${c.table_name}.${c.column_name}`).join(', '));
  console.log('funkcije:', fns.map(f => f.proname).join(', '));

  await client.end();
}

main().catch((e) => { console.error('❌', e.message); process.exit(1); });
