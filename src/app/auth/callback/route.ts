import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server';

// GET /auth/callback
// Handles email verification AND password reset callbacks from Supabase
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';
  const type = searchParams.get('type'); // 'recovery' for password reset

  if (code) {
    const supabase = await createClient();
    
    // Exchange code for session
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // Proveri da li je ovo password reset
      if (type === 'recovery') {
        // Redirect na stranicu za novu lozinku
        return NextResponse.redirect(`${origin}/auth/reset-password`);
      }
      
      // Dohvati trenutnog korisnika
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Proveri ulogu korisnika
        const supabaseAdmin = createAdminClient();
        const { data: userData } = await supabaseAdmin
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();
        
        if (userData?.role === 'creator') {
          // Kreator - proveri status
          const { data: creatorData } = await supabaseAdmin
            .from('creators')
            .select('status')
            .eq('user_id', user.id)
            .single();
          
          if (creatorData?.status === 'pending') {
            // Kreator na čekanju - redirect na stranicu čekanja
            return NextResponse.redirect(`${origin}/register/kreator/cekanje`);
          } else if (creatorData?.status === 'approved') {
            // Odobren kreator - redirect na dashboard
            return NextResponse.redirect(`${origin}/dashboard`);
          } else if (creatorData?.status === 'deactivated') {
            // Deaktiviran kreator
            return NextResponse.redirect(`${origin}/auth/error?message=account_deactivated`);
          }
        } else if (userData?.role === 'business') {
          // Biznis korisnik - redirect na dashboard
          return NextResponse.redirect(`${origin}/dashboard`);
        }
      }
      
      // Default - redirect na dashboard
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Greška - redirect na error stranicu
  return NextResponse.redirect(`${origin}/auth/error?message=verification_failed`);
}
