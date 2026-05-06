-- ===================================================================
-- LOCK SENSITIVE COLUMNS - Defense-in-depth via BEFORE UPDATE triggers
-- ===================================================================
-- Spreca privilege escalation i bypass naplate kroz Postgrest/anon klijent.
--
-- Princip: SAMO `service_role` (backend sa SUPABASE_SERVICE_ROLE_KEY) sme
-- da menja osetljive kolone. Sve API rute koje legitimno menjaju ova polja
-- (Stripe webhook, admin endpoints, itd.) vec koriste service_role.
--
-- Ako common user pokusa da posalje UPDATE preko anon klijenta sa
-- {role: 'admin'} ili {subscription_status: 'active'}, dobice exception.

-- -------------------------------------------------------------------
-- 1. users.role - sprecava self-promote u admin
-- -------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.lock_users_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF current_user <> 'service_role'
     AND NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'Promena role je dozvoljena samo administratoru'
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS users_lock_role ON public.users;
CREATE TRIGGER users_lock_role
BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION public.lock_users_role();

-- -------------------------------------------------------------------
-- 2. businesses - zakljucava sve subscription/Stripe kolone
-- -------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.lock_business_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF current_user = 'service_role' THEN
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

DROP TRIGGER IF EXISTS businesses_lock_subscription ON public.businesses;
CREATE TRIGGER businesses_lock_subscription
BEFORE UPDATE ON public.businesses
FOR EACH ROW EXECUTE FUNCTION public.lock_business_subscription();

-- -------------------------------------------------------------------
-- 3. creators - zakljucava status (sprecava self-approve)
-- -------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.lock_creator_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF current_user = 'service_role' THEN
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

DROP TRIGGER IF EXISTS creators_lock_status ON public.creators;
CREATE TRIGGER creators_lock_status
BEFORE UPDATE ON public.creators
FOR EACH ROW EXECUTE FUNCTION public.lock_creator_status();

-- -------------------------------------------------------------------
-- 4. job_applications - zakljucava FK kolone (creator_id, job_id)
--    Sprecava redirect prijave na drugu prijavu/posao.
-- -------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.lock_job_application_fk()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF current_user = 'service_role' THEN
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

DROP TRIGGER IF EXISTS job_applications_lock_fk ON public.job_applications;
CREATE TRIGGER job_applications_lock_fk
BEFORE UPDATE ON public.job_applications
FOR EACH ROW EXECUTE FUNCTION public.lock_job_application_fk();

-- -------------------------------------------------------------------
-- 5. job_messages - zakljucava sender_id, sender_type, application_id, message
--    Sprecava fabrikovanje identiteta i menjanje istorije poruka.
-- -------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.lock_job_message_identity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF current_user = 'service_role' THEN
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

DROP TRIGGER IF EXISTS job_messages_lock_identity ON public.job_messages;
CREATE TRIGGER job_messages_lock_identity
BEFORE UPDATE ON public.job_messages
FOR EACH ROW EXECUTE FUNCTION public.lock_job_message_identity();

-- -------------------------------------------------------------------
-- 6. job_invitations - zakljucava FK + business_id (sprecava cross-business spam)
-- -------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.lock_job_invitation_fk()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF current_user = 'service_role' THEN
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

DROP TRIGGER IF EXISTS job_invitations_lock_fk ON public.job_invitations;
CREATE TRIGGER job_invitations_lock_fk
BEFORE UPDATE ON public.job_invitations
FOR EACH ROW EXECUTE FUNCTION public.lock_job_invitation_fk();
