-- Lock trigger funkcije ne treba pozivati direktno preko PostgREST RPC.
-- Pripadaju samo BEFORE UPDATE trigerima. Revoke da Supabase advisor ne baca WARN
-- i da se ne izlazu PostgREST povrsini.

REVOKE EXECUTE ON FUNCTION public.lock_users_role()              FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.lock_business_subscription()   FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.lock_creator_status()          FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.lock_job_application_fk()      FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.lock_job_message_identity()    FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.lock_job_invitation_fk()       FROM anon, authenticated, public;
