import { makeClient } from './client.mjs';
const client = makeClient();
async function main() {
  await client.connect();
  const res = await client.query(`
    SELECT c.relname AS tbl, pol.polname,
      CASE pol.polcmd WHEN 'r' THEN 'SELECT' WHEN 'a' THEN 'INSERT'
           WHEN 'w' THEN 'UPDATE' WHEN 'd' THEN 'DELETE' ELSE 'ALL' END AS cmd,
      ARRAY(SELECT rolname FROM pg_roles WHERE oid=ANY(pol.polroles)) AS roles,
      pg_get_expr(pol.polqual, pol.polrelid) AS qual
    FROM pg_policy pol JOIN pg_class c ON c.oid=pol.polrelid
    JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public' AND c.relname IN ('businesses','reviews','jobs')
    ORDER BY c.relname, pol.polname;`);
  console.table(res.rows.map(r => ({ tbl: r.tbl, pol: r.polname, cmd: r.cmd, qual: (r.qual||'').slice(0,70) })));
  await client.end();
}
main().catch(e => { console.error(e.message); client.end(); process.exit(1); });
