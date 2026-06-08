import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

// GET /api/cities/[id] - jedan grad po ID-u (za resolve sačuvane lokacije)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cityId = Number(id);
    if (!cityId || Number.isNaN(cityId)) {
      return NextResponse.json({ error: 'Nevažeći ID grada' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('cities')
      .select('id, name, country_code, lat, lng')
      .eq('id', cityId)
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({ error: 'Grad nije pronađen' }, { status: 404 });
    }

    const res = NextResponse.json({ city: data });
    res.headers.set('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
    return res;
  } catch (e) {
    console.error('City by id error:', e);
    return NextResponse.json({ error: 'Greška na serveru' }, { status: 500 });
  }
}
