-- Migration: Fix infinite recursion in profiles RLS policies
-- Date: 2026-10-10
-- Hotfix. The app returned HTTP 500 on every authenticated read of
-- `profiles` until this ran.
--
-- WHAT BROKE
-- Postgres refuses a policy whose expression reads its own table:
--   42P17: infinite recursion detected in policy for relation "profiles"
-- The SELECT policy introduced by 20261010153000_* used
--   EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() ...)
-- and the UPDATE policy shipped earlier had the same self-reference. So the
-- "change a user's role" feature was already dead before this migration; the
-- bug only became visible once SELECT was restricted too.
--
-- THE FIX
-- Move the role lookup into a SECURITY DEFINER helper owned by the table
-- owner, so it runs with bypassrls and the policy no longer references
-- `profiles` from within `profiles`.
--
-- The helper takes no arguments and reads auth.uid() from the request, so a
-- caller can only ever learn their OWN admin status. That is not a leak, but
-- we still revoke the default PUBLIC execute grant and hand it only to
-- authenticated.
--
-- Idempotent: safe to re-run.

BEGIN;

-- =====================================================
-- Helper
-- =====================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  )
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

COMMENT ON FUNCTION public.is_admin() IS
  'true si el usuario de la petición actual es admin. SECURITY DEFINER para evitar la recursion infinita que Postgres prohibe en una policy que se referencia a si misma.';

-- =====================================================
-- Policies: use the helper instead of self-referencing
-- =====================================================

DROP POLICY IF EXISTS "Owners and admins can read profiles" ON public.profiles;

CREATE POLICY "Owners and admins can read profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Authenticated users and admins can update profiles" ON public.profiles;

CREATE POLICY "Authenticated users and admins can update profiles"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (
    auth.uid() = id OR public.is_admin()
  );

-- =====================================================
-- Triggers: same helper
-- =====================================================

CREATE OR REPLACE FUNCTION public.prevent_profile_role_escalation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Solo un administrador puede cambiar roles';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.prevent_profile_invite_flag_escalation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.can_invite_teachers IS DISTINCT FROM OLD.can_invite_teachers
     AND NOT public.is_admin()
  THEN
    RAISE EXCEPTION 'Solo un administrador puede delegar la invitacion de profesores';
  END IF;
  RETURN NEW;
END;
$$;

-- =====================================================
-- Verify the recursion is gone
-- =====================================================
-- `SET ROLE authenticated` has no JWT, so auth.uid() is NULL and RLS is
-- expected to hide every row. The point is only that evaluating the policy
-- no longer raises 42P17.

SET LOCAL ROLE authenticated;

DO $$
DECLARE
  visible_rows integer;
BEGIN
  SELECT count(*) INTO visible_rows FROM public.profiles;
  IF visible_rows <> 0 THEN
    RAISE EXCEPTION 'profiles leaked % rows with no JWT', visible_rows;
  END IF;
END $$;

RESET ROLE;

COMMIT;
