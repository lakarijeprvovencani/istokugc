import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getAuthUser } from '@/lib/auth-helper';

// GET /api/job-messages - Dohvati poruke za prijavu ili broj nepročitanih
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const applicationId = searchParams.get('applicationId');
    const countUnread = searchParams.get('countUnread');
    const recipientType = searchParams.get('recipientType');
    const recipientId = searchParams.get('recipientId');

    const supabase = createAdminClient();

    // Count unread messages across all conversations - OPTIMIZED
    if (countUnread === 'true' && recipientType && recipientId) {
      if (recipientType === 'business') {
        // Business: count unread messages from creators in ONE query using join
        const { count } = await supabase
          .from('job_messages')
          .select('*, job_applications!inner(job_id, status, jobs!inner(business_id))', { count: 'exact', head: true })
          .eq('job_applications.jobs.business_id', recipientId)
          .in('job_applications.status', ['accepted', 'engaged'])
          .eq('sender_type', 'creator')
          .is('read_at', null);
        
        return NextResponse.json({ unreadCount: count || 0 });
        
      } else {
        // Creator: count unread messages from businesses in ONE query
        const { count } = await supabase
          .from('job_messages')
          .select('*, job_applications!inner(creator_id, status)', { count: 'exact', head: true })
          .eq('job_applications.creator_id', recipientId)
          .in('job_applications.status', ['accepted', 'engaged'])
          .eq('sender_type', 'business')
          .is('read_at', null);
        
        return NextResponse.json({ unreadCount: count || 0 });
      }
    }

    // Regular message fetch for specific application
    if (!applicationId) {
      return NextResponse.json({ error: 'applicationId je obavezan' }, { status: 400 });
    }

    // Fetch messages for this application
    const { data: messages, error } = await supabase
      .from('job_messages')
      .select('*')
      .eq('application_id', applicationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return NextResponse.json({ messages: [] });
    }

    // Format messages
    const formattedMessages = (messages || []).map(msg => ({
      id: msg.id,
      applicationId: msg.application_id,
      senderType: msg.sender_type,
      senderId: msg.sender_id,
      message: msg.message,
      readAt: msg.read_at,
      createdAt: msg.created_at,
    }));

    return NextResponse.json({ messages: formattedMessages });

  } catch (error: any) {
    console.error('Messages fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/job-messages - Pošalji novu poruku
// ZAŠTIĆENO: Samo učesnici u konverzaciji mogu slati poruke
export async function POST(request: NextRequest) {
  try {
    // 🔒 BEZBEDNOSNA PROVERA: Da li je korisnik ulogovan?
    const { user, error: authError } = await getAuthUser();
    if (authError) return authError;
    
    const body = await request.json();
    const { applicationId, senderType, senderId, message } = body;

    if (!applicationId || !senderType || !senderId || !message) {
      return NextResponse.json(
        { error: 'applicationId, senderType, senderId i message su obavezni' },
        { status: 400 }
      );
    }

    if (!['business', 'creator'].includes(senderType)) {
      return NextResponse.json({ error: 'senderType mora biti business ili creator' }, { status: 400 });
    }
    
    // 🔒 BEZBEDNOSNA PROVERA: senderId mora odgovarati ulogovanom korisniku
    if (senderType === 'creator' && user?.creatorId !== senderId) {
      return NextResponse.json({ error: 'Nemate dozvolu da šaljete poruke kao ovaj kreator' }, { status: 403 });
    }
    if (senderType === 'business' && user?.businessId !== senderId) {
      return NextResponse.json({ error: 'Nemate dozvolu da šaljete poruke kao ovaj biznis' }, { status: 403 });
    }

    const supabase = createAdminClient();

    // Verify that the application exists and sender has access
    const { data: application } = await supabase
      .from('job_applications')
      .select('id, job_id, creator_id, status')
      .eq('id', applicationId)
      .single();

    if (!application) {
      return NextResponse.json({ error: 'Prijava ne postoji' }, { status: 404 });
    }

    // Only allow messages if application is accepted or engaged
    if (application.status !== 'accepted' && application.status !== 'engaged') {
      return NextResponse.json(
        { error: 'Poruke su dostupne samo za prihvaćene prijave' },
        { status: 400 }
      );
    }

    // Insert message
    const { data: newMessage, error } = await supabase
      .from('job_messages')
      .insert({
        application_id: applicationId,
        sender_type: senderType,
        sender_id: senderId,
        message: message.trim(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating message:', error);
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    }

    return NextResponse.json({
      message: {
        id: newMessage.id,
        applicationId: newMessage.application_id,
        senderType: newMessage.sender_type,
        senderId: newMessage.sender_id,
        message: newMessage.message,
        readAt: newMessage.read_at,
        createdAt: newMessage.created_at,
      }
    });

  } catch (error: any) {
    console.error('Message creation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/job-messages - Označi poruke kao pročitane
// ZAŠTIĆENO: Samo učesnici u konverzaciji mogu označiti poruke kao pročitane
export async function PUT(request: NextRequest) {
  try {
    // 🔒 BEZBEDNOSNA PROVERA: Da li je korisnik ulogovan?
    const { user, error: authError } = await getAuthUser();
    if (authError) return authError;
    
    const body = await request.json();
    const { applicationId, recipientType, recipientId } = body;

    if (!applicationId || !recipientType || !recipientId) {
      return NextResponse.json(
        { error: 'applicationId, recipientType i recipientId su obavezni' },
        { status: 400 }
      );
    }
    
    // 🔒 BEZBEDNOSNA PROVERA: recipientId mora odgovarati ulogovanom korisniku
    if (recipientType === 'creator' && user?.creatorId !== recipientId) {
      return NextResponse.json({ error: 'Nemate dozvolu' }, { status: 403 });
    }
    if (recipientType === 'business' && user?.businessId !== recipientId) {
      return NextResponse.json({ error: 'Nemate dozvolu' }, { status: 403 });
    }

    const supabase = createAdminClient();

    // Mark all unread messages from the OTHER party as read
    const senderType = recipientType === 'business' ? 'creator' : 'business';
    
    const { error } = await supabase
      .from('job_messages')
      .update({ read_at: new Date().toISOString() })
      .eq('application_id', applicationId)
      .eq('sender_type', senderType)
      .is('read_at', null);

    if (error) {
      console.error('Error marking messages as read:', error);
      return NextResponse.json({ error: 'Failed to mark messages as read' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Mark read error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


