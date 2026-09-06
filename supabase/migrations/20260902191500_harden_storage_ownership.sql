-- Migration: Harden storage ownership for covers and gallery buckets
-- Date: 2026-09-02
-- Context: After AUDITORIA_BACKEND_SUPABASE.md §4 and REPORTE_OWNERSHIP_Y_LIMPIEZA.md §6
--
-- This migration drops the overly-permissive UPDATE/DELETE policies on the
-- 'covers' and 'gallery' storage buckets and replaces them with ownership checks
-- based on the user id embedded in the storage path.
--
-- New upload paths (implemented in projects.service.ts):
--   covers:  covers/{userId}/{projectId}-{timestamp}.{ext}
--   gallery: gallery/{userId}/{projectId}-{timestamp}-{random}.{ext}
--
-- Policy logic:
--   - SELECT remains public (published projects need to display images).
--   - INSERT remains restricted to authenticated teacher/admin.
--   - UPDATE/DELETE now requires:
--       a) The first foldername matches auth.uid()::text (owner), OR
--       b) The user is an admin.
--   This mirrors the pattern already used for the 'avatars' bucket.
--   NOTE: storage.foldername(name) is 1-based in Postgres, so we use [1]
--   to match the first path segment ({userId}).

BEGIN;

-- =====================================================
-- COVERS BUCKET
-- =====================================================

DROP POLICY IF EXISTS "Teachers can update own cover images" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can delete own cover images" ON storage.objects;

CREATE POLICY "Owners can update own cover images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'covers'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
);

CREATE POLICY "Owners can delete own cover images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'covers'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
);

-- =====================================================
-- GALLERY BUCKET
-- =====================================================

DROP POLICY IF EXISTS "Teachers can update own gallery images" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can delete own gallery images" ON storage.objects;

CREATE POLICY "Owners can update own gallery images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'gallery'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
);

CREATE POLICY "Owners can delete own gallery images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'gallery'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
);

COMMIT;
