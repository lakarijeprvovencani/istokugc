import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

// GET /api/cities?q=beo
// Autocomplete kanonskih gradova (RS/BA/HR/ME/MK/SI/AL/XK).
// Pretraga po ascii imenu (bez kvačica) i po pravom imenu, prefiks match.
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const raw = (searchParams.get('q') || '').trim();
    // skloni znakove koji lome PostgREST or() filter i wildcard
    const q = raw.replace(/[,%_()*]/g, '').slice(0, 60);

    if (q.length < 2) {
      return NextResponse.json({ cities: [] });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('cities')
      .select('id, name, country_code, lat, lng, population')
      // Vrednosti su u navodnicima jer % i , su rezervisani u PostgREST or() stablu.
      .or(
        `ascii_name.ilike."${q}%",name.ilike."${q}%",alt_names.ilike."${q}%",alt_names.ilike."%,${q}%"`
      )
      .order('population', { ascending: false })
      .limit(8);

    if (error) {
      console.error('Cities search error:', error);
      return NextResponse.json({ error: 'Greška pri pretrazi gradova' }, { status: 500 });
    }

    const res = NextResponse.json({ cities: data || [] });
    // gradovi se ne menjaju - keširaj
    res.headers.set('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
    return res;
  } catch (e) {
    console.error('Cities route error:', e);
    return NextResponse.json({ error: 'Greška na serveru' }, { status: 500 });
  }
}
