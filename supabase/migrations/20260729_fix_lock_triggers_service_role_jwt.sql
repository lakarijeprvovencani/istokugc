-- Fix: lock_* functions are SECURITY DEFINER owned by postgres, so current_user
-- is always 'postgres' inside them — never 'service_role'. That blocked ALL
-- legitimate backend updates (admin approve creator, Stripe webhook, etc.).
-- Gate on JWT role via auth.role() / request.jwt.claim.role instead.
--
-- Applied to production 2026-07-29.

CREATE OR REPLACE FUNCTION public.lock_users_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF coalesce(auth.role(), current_setting('request.jwt.claim.role', true), '') = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'Promena role je dozvoljena samo administratoru'
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.lock_business_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF coalesce(auth.role(), current_setting('request.jwt.claim.role', true), '') = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF NEW.subscription_status   IS DISTINCT FROM OLD.subscription_status   OR
     NEW.subscription_type     IS DISTINCT FROM OLD.subscription_type     OR
     NEW.expires_at            IS DISTINCT FROM OLD.expires_at            OR
     NEW.subscribed_at         IS DISTINCT FROM OLD.subscribed_at         OR
     NEW.stripe_customer_id    IS DISTINCT FROM OLD.stripe_customer_id    OR
     NEW.stripe_subscription_id IS DISTINCT FROM OLD.stripe_subscription_id OR
     NEW.user_id               IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'Promena pretplate / Stripe podataka nije dozvoljena (samo backend)'
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.lock_creator_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF coalesce(auth.role(), current_setting('request.jwt.claim.role', true), '') = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF NEW.status  IS DISTINCT FROM OLD.status OR
     NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'Promena statusa kreatora nije dozvoljena (samo admin/backend)'
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.lock_job_application_fk()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF coalesce(auth.role(), current_setting('request.jwt.claim.role', true), '') = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF NEW.job_id     IS DISTINCT FROM OLD.job_id OR
     NEW.creator_id IS DISTINCT FROM OLD.creator_id THEN
    RAISE EXCEPTION 'Promena posla / kreatora prijave nije dozvoljena'
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.lock_job_message_identity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF coalesce(auth.role(), current_setting('request.jwt.claim.role', true), '') = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF NEW.application_id IS DISTINCT FROM OLD.application_id OR
     NEW.sender_id      IS DISTINCT FROM OLD.sender_id      OR
     NEW.sender_type    IS DISTINCT FROM OLD.sender_type    OR
     NEW.message        IS DISTINCT FROM OLD.message        OR
     NEW.created_at     IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Promena identiteta / sadrzaja poruke nije dozvoljena'
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.lock_job_invitation_fk()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF coalesce(auth.role(), current_setting('request.jwt.claim.role', true), '') = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF NEW.job_id      IS DISTINCT FROM OLD.job_id      OR
     NEW.creator_id  IS DISTINCT FROM OLD.creator_id  OR
     NEW.business_id IS DISTINCT FROM OLD.business_id THEN
    RAISE EXCEPTION 'Promena posla / kreatora / biznisa pozivnice nije dozvoljena'
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  RETURN NEW;
END;
$$;
