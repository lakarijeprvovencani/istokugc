import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

// GET /api/stats/locations
// Agregacija odobrenih kreatora po gradu (za mapu na landing-u).
// Vraća: [{ city_id, name, country_code, lat, lng, count }]
export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.rpc('creators_by_city');

    if (error) {
      console.error('creators_by_city RPC error:', error);
      return NextResponse.json({ error: 'Greška pri učitavanju statistike' }, { status: 500 });
    }

    const res = NextResponse.json({ locations: data || [] });
    res.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    return res;
  } catch (e) {
    console.error('Stats locations route error:', e);
    return NextResponse.json({ error: 'Greška na serveru' }, { status: 500 });
  }
}
