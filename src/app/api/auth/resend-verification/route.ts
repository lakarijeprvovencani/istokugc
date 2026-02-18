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

    // Kreiraj Supabase admin client (za proveru korisnika)
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

    // Kreiraj regular client (za resend koji šalje email)
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

    // Koristi resend metodu koja AUTOMATSKI šalje email
    const { error: resendError } = await supabaseClient.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${siteUrl}/auth/callback`,
      },
    });

    if (resendError) {
      console.error('Resend verification error:', resendError);
      
      // Ako je rate limit, vrati specifičnu poruku
      if (resendError.message.includes('rate') || resendError.message.includes('limit')) {
        return NextResponse.json(
          { error: 'Previše zahteva. Molimo sačekajte par minuta pre ponovnog slanja.' },
          { status: 429 }
        );
      }
      
      return NextResponse.json(
        { error: 'Greška pri slanju email-a. Pokušajte ponovo za par minuta.' },
        { status: 500 }
      );
    }

    console.log('Verification email resent');

    return NextResponse.json({
      success: true,
      message: 'Email za verifikaciju je poslat. Proverite inbox i spam folder.',
    });

  } catch (error) {
    console.error('Resend verification error:', error);
    return NextResponse.json(
      { error: 'Greška na serveru' },
      { status: 500 }
    );
  }
}
