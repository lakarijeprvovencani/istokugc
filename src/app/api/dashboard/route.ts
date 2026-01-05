import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Combined dashboard endpoint - fetches all data in parallel
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'creator' or 'business'
    const creatorId = searchParams.get('creatorId');
    const businessId = searchParams.get('businessId');

    if (type === 'creator' && creatorId) {
      // Fetch all creator data in PARALLEL
      const [
        creatorResult,
        applicationsResult,
        invitationsResult,
        reviewsResult,
        messagesCountResult
      ] = await Promise.all([
        // Creator profile
        supabaseAdmin
          .from('creators')
          .select('*')
          .eq('id', creatorId)
          .single(),
        
        // Applications with job details
        supabaseAdmin
          .from('job_applications')
          .select(`
            *,
            jobs (
              id, title, description, category, budget_type, price_from, price_to,
              business_id, status,
              businesses (company_name)
            )
          `)
          .eq('creator_id', creatorId)
          .order('created_at', { ascending: false }),
        
        // Invitations with job details
        supabaseAdmin
          .from('job_invitations')
          .select(`
            *,
            jobs (
              id, title, description, category, budget_type, price_from, price_to,
              business_id,
              businesses (company_name)
            )
          `)
          .eq('creator_id', creatorId)
          .order('created_at', { ascending: false }),
        
        // Reviews
        supabaseAdmin
          .from('reviews')
          .select(`
            *,
            businesses (company_name, logo)
          `)
          .eq('creator_id', creatorId)
          .eq('status', 'approved')
          .order('created_at', { ascending: false }),
        
        // Unread messages count
        supabaseAdmin
          .from('job_messages')
          .select('id', { count: 'exact', head: true })
          .eq('recipient_type', 'creator')
          .eq('recipient_id', creatorId)
          .is('read_at', null)
      ]);

      // Transform data
      const creator = creatorResult.data;
      
      const applications = (applicationsResult.data || []).map((app: any) => ({
        id: app.id,
        jobId: app.job_id,
        creatorId: app.creator_id,
        proposedPrice: app.proposed_price,
        coverLetter: app.cover_letter,
        estimatedDuration: app.estimated_duration,
        status: app.status,
        createdAt: app.created_at,
        updatedAt: app.updated_at,
        job: app.jobs ? {
          id: app.jobs.id,
          title: app.jobs.title,
          description: app.jobs.description,
          category: app.jobs.category,
          budgetType: app.jobs.budget_type,
          priceFrom: app.jobs.price_from,
          priceTo: app.jobs.price_to,
          businessId: app.jobs.business_id,
          status: app.jobs.status,
          businessName: app.jobs.businesses?.company_name
        } : null
      }));

      const invitations = (invitationsResult.data || []).map((inv: any) => ({
        id: inv.id,
        jobId: inv.job_id,
        creatorId: inv.creator_id,
        businessId: inv.business_id,
        message: inv.message,
        status: inv.status,
        createdAt: inv.created_at,
        respondedAt: inv.responded_at,
        job: inv.jobs ? {
          id: inv.jobs.id,
          title: inv.jobs.title,
          description: inv.jobs.description,
          category: inv.jobs.category,
          budgetType: inv.jobs.budget_type,
          priceFrom: inv.jobs.price_from,
          priceTo: inv.jobs.price_to,
          businessId: inv.jobs.business_id,
          businessName: inv.jobs.businesses?.company_name
        } : null
      }));

      const reviews = (reviewsResult.data || []).map((r: any) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.created_at,
        reply: r.reply,
        replyAt: r.reply_at,
        businessName: r.businesses?.company_name,
        businessLogo: r.businesses?.logo
      }));

      return NextResponse.json({
        creator: creator ? {
          id: creator.id,
          name: creator.name,
          email: creator.email,
          bio: creator.bio,
          photo: creator.photo,
          location: creator.location,
          categories: creator.categories,
          platforms: creator.platforms,
          languages: creator.languages,
          priceFrom: creator.price_from,
          priceTo: creator.price_to,
          portfolioImages: creator.portfolio_images,
          portfolioVideos: creator.portfolio_videos,
          status: creator.status
        } : null,
        applications,
        invitations,
        reviews,
        unreadMessagesCount: messagesCountResult.count || 0,
        pendingInvitationsCount: invitations.filter((i: any) => i.status === 'pending').length
      });
    }

    if (type === 'business' && businessId) {
      // Fetch all business data in PARALLEL
      const [
        businessResult,
        jobsResult,
        applicationsResult,
        recentViewsResult,
        favoritesResult,
        messagesCountResult
      ] = await Promise.all([
        // Business profile
        supabaseAdmin
          .from('businesses')
          .select('*')
          .eq('id', businessId)
          .single(),
        
        // Jobs with application counts
        supabaseAdmin
          .from('jobs')
          .select('*')
          .eq('business_id', businessId)
          .neq('status', 'deleted')
          .order('created_at', { ascending: false }),
        
        // All applications for this business's jobs
        supabaseAdmin
          .from('job_applications')
          .select(`
            *,
            jobs!inner (business_id),
            creators (id, name, photo, location, categories)
          `)
          .eq('jobs.business_id', businessId),
        
        // Recent views
        supabaseAdmin
          .from('creator_views')
          .select(`
            *,
            creators (id, name, photo, location, categories, price_from, price_to)
          `)
          .eq('business_id', businessId)
          .order('viewed_at', { ascending: false })
          .limit(5),
        
        // Favorites
        supabaseAdmin
          .from('saved_creators')
          .select(`
            *,
            creators (id, name, photo, location, categories, price_from, price_to)
          `)
          .eq('business_id', businessId),
        
        // Unread messages count
        supabaseAdmin
          .from('job_messages')
          .select('id', { count: 'exact', head: true })
          .eq('recipient_type', 'business')
          .eq('recipient_id', businessId)
          .is('read_at', null)
      ]);

      const business = businessResult.data;
      
      const jobs = (jobsResult.data || []).map((job: any) => ({
        id: job.id,
        title: job.title,
        description: job.description,
        category: job.category,
        budgetType: job.budget_type,
        priceFrom: job.price_from,
        priceTo: job.price_to,
        status: job.status,
        createdAt: job.created_at,
        applicationDeadline: job.application_deadline,
        businessId: job.business_id,
        businessName: business?.company_name
      }));

      const applications = (applicationsResult.data || []).map((app: any) => ({
        id: app.id,
        jobId: app.job_id,
        creatorId: app.creator_id,
        proposedPrice: app.proposed_price,
        coverLetter: app.cover_letter,
        status: app.status,
        createdAt: app.created_at,
        creator: app.creators ? {
          id: app.creators.id,
          name: app.creators.name,
          photo: app.creators.photo,
          location: app.creators.location,
          categories: app.creators.categories
        } : null
      }));

      const recentViews = (recentViewsResult.data || [])
        .filter((v: any) => v.creators)
        .map((v: any) => ({
          id: v.creators.id,
          name: v.creators.name,
          photo: v.creators.photo,
          location: v.creators.location,
          categories: v.creators.categories,
          priceFrom: v.creators.price_from,
          priceTo: v.creators.price_to,
          viewedAt: v.viewed_at
        }));

      const favorites = (favoritesResult.data || [])
        .filter((f: any) => f.creators)
        .map((f: any) => ({
          id: f.creators.id,
          name: f.creators.name,
          photo: f.creators.photo,
          location: f.creators.location,
          categories: f.creators.categories,
          priceFrom: f.creators.price_from,
          priceTo: f.creators.price_to
        }));

      const pendingApplicationsCount = applications.filter((a: any) => a.status === 'pending').length;

      return NextResponse.json({
        business: business ? {
          id: business.id,
          companyName: business.company_name,
          email: business.email,
          description: business.description,
          website: business.website,
          logo: business.logo,
          subscriptionStatus: business.subscription_status,
          subscriptionPlan: business.subscription_plan
        } : null,
        jobs,
        applications,
        recentViews,
        favorites,
        unreadMessagesCount: messagesCountResult.count || 0,
        pendingApplicationsCount
      });
    }

    return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}


