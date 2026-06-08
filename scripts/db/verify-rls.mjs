/**
 * Read-only verifikacija RLS/grant stanja na ZIVOJ bazi.
 * Proverava nalaze audita: da li anon moze da cita PII iz creators,
 * grantove na creators_nearby, i da li je RLS ukljucen na bitnim tabelama.
 */
import { makeClient } from './client.mjs';

const client = makeClient();

async function q(label, sql) {
  const res = await client.query(sql);
  console.log(`\n=== ${label} ===`);
  console.table(res.rows);
}

async function main() {
  await client.connect();

  // 1. RLS ukljucen na bitnim tabelama?
  await q('RLS enabled (relrowsecurity)', `
    SELECT c.relname AS table, c.relrowsecurity AS rls_enabled
    FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public' AND c.relname IN
      ('creators','businesses','users','reviews','jobs','cities','webhook_events','rate_limits')
    ORDER BY c.relname;`);

  // 2. Politike na creators (ko sme SELECT i pod kojim uslovom)
  await q('Policies on creators', `
    SELECT polname, cmd, roles, qual
    FROM (
      SELECT pol.polname,
             CASE pol.polcmd WHEN 'r' THEN 'SELECT' WHEN 'a' THEN 'INSERT'
                  WHEN 'w' THEN 'UPDATE' WHEN 'd' THEN 'DELETE' ELSE 'ALL' END AS cmd,
             ARRAY(SELECT rolname FROM pg_roles WHERE oid=ANY(pol.polroles)) AS roles,
             pg_get_expr(pol.polqual, pol.polrelid) AS qual
      FROM pg_policy pol JOIN pg_class c ON c.oid=pol.polrelid
      JOIN pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname='public' AND c.relname='creators'
    ) p ORDER BY polname;`);

  // 3. Table-level SELECT grant na creators za anon/authenticated
  await q('Table grants on creators (anon/authenticated)', `
    SELECT grantee, privilege_type
    FROM information_schema.role_table_grants
    WHERE table_schema='public' AND table_name='creators'
      AND grantee IN ('anon','authenticated')
    ORDER BY grantee, privilege_type;`);

  // 4. Grantovi na creators_nearby funkciju
  await q('creators_nearby function ACL', `
    SELECT p.proname,
           CASE p.prosecdef WHEN true THEN 'SECURITY DEFINER' ELSE 'SECURITY INVOKER' END AS security,
           pg_get_function_identity_arguments(p.oid) AS args,
           p.proacl::text AS acl
    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.proname IN ('creators_nearby','creators_by_city');`);

  await client.end();
  console.log('\nLEGENDA: acl "=X/.." znaci PUBLIC ima EXECUTE; "anon=X" znaci anon ima EXECUTE.');
}

main().catch((e) => { console.error('❌', e.message); client.end(); process.exit(1); });
