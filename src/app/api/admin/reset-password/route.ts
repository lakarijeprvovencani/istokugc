import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Supabase će automatski poslati email za reset lozinke
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9898'}/reset-password`,
    });

    if (error) {
      console.error('Error sending reset password email:', error);
      return NextResponse.json({ error: 'Failed to send reset email' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Reset email sent' });

  } catch (error: any) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}




