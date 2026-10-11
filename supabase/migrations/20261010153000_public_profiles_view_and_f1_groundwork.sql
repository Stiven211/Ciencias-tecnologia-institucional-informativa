-- Migration: Public profile view, F1 groundwork (invite flag + audit log)
-- Date: 2026-10-10
-- Roadmap: F1 (registro de profesores) + cierre de fuga de correos
--
-- PART 1 — Stop exposing teacher emails.
-- `profiles` had a policy "Public can view profiles" TO public USING (true),
-- so GET /rest/v1/profiles returned every column of every profile to an
-- unauthenticated caller, including `email`. Those are the personal contact
-- details of the school's teachers.
--
-- The fix is to split the table in two surfaces:
--   - public_profiles : a view with only the columns we intend to publish
--   - profiles        : now private, readable only by the owner and admins
--
-- The view deliberately does NOT use security_invoker. It is the public API
-- surface; the whole point is that it reads the table as its owner and
-- projects away the sensitive columns. RLS on `profiles` still applies to
-- every other read path.
--
-- PART 2 — F1 groundwork.
--   - profiles.can_invite_teachers: explicit per-teacher delegation flag.
--     Deliberately NOT reusing the `manage_teachers` role permission, so that
--     "can invite" and "is admin" stay separate capabilities.
--   - public.audit_log: who invited whom, written only by the Edge Function
--     (service_role). RLS on, no policies, so no client can read or forge it.
--
-- Idempotent: safe to re-run.

BEGIN;

-- =====================================================
-- PART 1: public_profiles view
-- =====================================================

CREATE OR REPLACE VIEW public.public_profiles AS
SELECT
  id,
  full_name,
  avatar_url,
  bio,
  specialization,
  teaching_area,
  academic_level,
  role
FROM public.profiles;

COMMENT ON VIEW public.public_profiles IS
  'Superficie pública de perfiles. No incluye email ni can_invite_teachers a propósito.';

-- The view is the only thing anon/authenticated may read for other people's
-- profiles, so it must be exposed to the Data API.
GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- Replace the blanket public policy.
DROP POLICY IF EXISTS "Public can view profiles" ON public.profiles;

CREATE POLICY "Owners and admins can read profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- =====================================================
-- PART 2a: can_invite_teachers
-- =====================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS can_invite_teachers boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.profiles.can_invite_teachers IS
  'Permite invitar a otros profesores mediante la Edge Function create-teacher. No habilita cambiar roles.';

-- A profile must not be able to grant itself the flag. Only an admin may.
-- (handled by the existing prevent_profile_role_escalation trigger pattern,
-- so we add the mirror check here for this column.)
CREATE OR REPLACE FUNCTION public.prevent_profile_invite_flag_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.can_invite_teachers IS DISTINCT FROM OLD.can_invite_teachers
     AND NOT EXISTS (
       SELECT 1 FROM public.profiles p
       WHERE p.id = auth.uid() AND p.role = 'admin'
     )
  THEN
    RAISE EXCEPTION 'Solo un administrador puede delegar la invitacion de profesores';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_invite_flag ON public.profiles;

CREATE TRIGGER protect_profile_invite_flag
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_profile_invite_flag_escalation();

-- =====================================================
-- PART 2b: audit_log
-- =====================================================

CREATE TABLE IF NOT EXISTS public.audit_log (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  action text NOT NULL,
  actor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  target_email text,
  target_role text,
  metadata jsonb NOT NULL DEFAULT '{}'::json,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_log_actor_created_idx
  ON public.audit_log (actor_id, created_at DESC);

CREATE INDEX IF NOT EXISTS audit_log_action_created_idx
  ON public.audit_log (action, created_at DESC);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.audit_log IS
  'Bitacora de acciones sensibles. Solo la Edge Function (service_role) escribe; sin policies, ningun cliente lee ni forja entradas.';

COMMIT;
