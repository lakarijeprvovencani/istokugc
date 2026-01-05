import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// POST /api/auth/resend-verification
// Ponovo šalje email za verifikaciju
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email je obavezan' },
        { status: 400 }
      );
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:9898';

    // Kreiraj Supabase admin client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Proveri da li korisnik postoji
    const { data: users } = await supabaseAdmin.auth.admin.listUsers();
    const user = users?.users?.find(u => u.email === email);

    if (!user) {
      // Ne otkrivaj da korisnik ne postoji (security)
      return NextResponse.json({
        success: true,
        message: 'Ako nalog postoji, email za verifikaciju je poslat.',
      });
    }

    // Proveri da li je email već verifikovan
    if (user.email_confirmed_at) {
      return NextResponse.json(
        { error: 'Email je već verifikovan. Možete se prijaviti.' },
        { status: 400 }
      );
    }

    // Generiši novi link za verifikaciju
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink', // Koristi magic link umesto signup za resend
      email,
      options: {
        redirectTo: `${siteUrl}/auth/callback`,
      },
    });

    if (linkError) {
      console.error('Link generation error:', linkError);
      return NextResponse.json(
        { error: 'Greška pri slanju email-a. Pokušajte ponovo za par minuta.' },
        { status: 500 }
      );
    }

    // Supabase automatski šalje email
    // Za custom email, koristi linkData.properties.action_link

    return NextResponse.json({
      success: true,
      message: 'Email za verifikaciju je poslat. Proverite inbox i spam folder.',
      // Debug - ukloni u produkciji ako ne želiš da se vidi
      ...(process.env.NODE_ENV === 'development' && {
        verificationLink: linkData?.properties?.action_link,
      }),
    });

  } catch (error) {
    console.error('Resend verification error:', error);
    return NextResponse.json(
      { error: 'Greška na serveru' },
      { status: 500 }
    );
  }
}

