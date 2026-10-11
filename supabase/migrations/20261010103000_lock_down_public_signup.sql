-- Migration: Lock down public signup and profile self-insertion
-- Date: 2026-10-10
-- Roadmap: F1 (registro de profesores) — pre-requisito de seguridad
--
-- CONTEXT / WHY
-- While preparing F1 we found that the portal was open to anonymous content
-- injection. Verified end-to-end against production before this migration:
--
--   1. POST /auth/v1/signup with the PUBLIC anon key (shipped in the browser
--      bundle) returned a usable session immediately, because the project's
--      auth config had mailer_autoconfirm = true.
--   2. The on_auth_user_created trigger (handle_new_user) hardcodes
--      role = 'teacher', so that anonymous account was a teacher.
--   3. That account could INSERT a project with status = 'published', which
--      renders on the public institutional site.
--
-- The 7-user cap in authService.signUp never mitigated this: it is frontend
-- code and the REST/auth endpoints do not enforce it.
--
-- The fix has two halves. This migration is the database half; the other half
-- is the auth setting disable_signup = true (set in the Supabase dashboard or
-- via the Management API PATCH /v1/projects/{ref}/config/auth), which blocks
-- /auth/v1/signup entirely. auth.admin.createUser() is unaffected, so F1 can
-- still create teachers from an Edge Function.
--
-- Idempotent: safe to re-run.

BEGIN;

-- =====================================================
-- profiles: only the trusted server may create rows
-- =====================================================
-- handle_new_user() is SECURITY DEFINER, so it inserts with the function
-- owner's privileges and bypasses RLS entirely. Nothing in the client needs
-- to insert into profiles, so the policy is narrowed to service_role.

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "Only service role can insert profiles"
  ON public.profiles
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- =====================================================
-- Verify no other table lets a client fabricate its own role
-- =====================================================
DO $$
DECLARE
  loose_count integer;
BEGIN
  SELECT count(*) INTO loose_count
  FROM pg_policies
  WHERE tablename = 'profiles'
    AND cmd = 'INSERT'
    AND roles <> '{service_role}';

  IF loose_count > 0 THEN
    RAISE EXCEPTION 'profiles still has % INSERT policy/policies open to non-service roles', loose_count;
  END IF;
END $$;

COMMIT;
