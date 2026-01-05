import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

// GET /api/categories - Javni endpoint za dohvatanje kategorija
export async function GET() {
  try {
    const supabase = createAdminClient();

    const { data: categories, error } = await supabase
      .from('categories')
      .select('name')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching categories:', error);
      return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
    }

    const response = NextResponse.json({ 
      categories: categories.map(c => c.name) 
    });
    
    // Categories rarely change - cache aggressively (1 hour, stale for 24h)
    response.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    
    return response;

  } catch (error: any) {
    console.error('Categories fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


