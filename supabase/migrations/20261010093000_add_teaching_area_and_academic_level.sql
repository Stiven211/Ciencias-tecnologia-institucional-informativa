-- Migration: Add profiles.teaching_area and profiles.academic_level
-- Date: 2026-10-10
-- Roadmap: F3 (área que dicta) + F4 (nivel académico)
--
-- Both columns are closed lists (no free text) so they can drive the public
-- catalog filters without free-form mismatches. `specialization` is left
-- untouched on purpose: it is free text and already in use by 7 profiles.
--
-- teaching_area values are the exact display names used by the Home
-- "Áreas" section (src/components/public/StemAreasSection.tsx) so a profile
-- area always matches a catalog area chip.
--
-- Idempotent: safe to re-run.

BEGIN;

-- =====================================================
-- F3: teaching_area
-- =====================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS teaching_area text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_teaching_area_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_teaching_area_check
      CHECK (
        teaching_area IS NULL OR teaching_area IN (
          'Química',
          'Biología',
          'Física',
          'Tecnología e Informática',
          'Educación Ambiental',
          'Robótica'
        )
      );
  END IF;
END $$;

COMMENT ON COLUMN public.profiles.teaching_area IS
  'Área que dicta el docente. Lista cerrada; NULL = sin definir.';

-- =====================================================
-- F4: academic_level
-- =====================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS academic_level text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_academic_level_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_academic_level_check
      CHECK (
        academic_level IS NULL OR academic_level IN (
          'Normalista',
          'Profesional',
          'Especialización',
          'Maestría',
          'Doctorado',
          'Postdoctorado'
        )
      );
  END IF;
END $$;

COMMENT ON COLUMN public.profiles.academic_level IS
  'Nivel académico del docente. Lista cerrada; NULL = sin definir.';

COMMIT;
