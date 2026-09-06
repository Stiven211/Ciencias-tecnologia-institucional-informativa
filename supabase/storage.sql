-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES
  ('avatars', 'avatars', true),
  ('projects', 'projects', true),
  ('resources', 'resources', true),
  ('gallery', 'gallery', true),
  ('covers', 'covers', true),
  ('publications', 'publications', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- SOURCE OF TRUTH NOTICE
-- ============================================================
-- Este archivo es un espejo documental de las políticas YA aplicadas
-- en la base de datos Supabase real. La fuente de verdad es siempre
-- la DB; si una política cambia en producción, este SQL debe
-- regenerarse para reflejar el estado actual (regenerar desde
-- pg_policies o desde la migración que la creó).
--
-- Convenciones:
-- * Postgres string_to_array es 1-based: storage.foldername(name)[1]
--   corresponde al PRIMER segmento del path (carpeta del usuario).
--   NUNCA uses [0] aquí: sería NULL.
-- * Path de avatares:    {userId}/{userId}-avatar-{ts}.{ext}
-- * Path de covers:      {userId}/{archivo}
-- * Path de gallery:     {userId}/{archivo}
-- * Buckets projects / resources / publications: PENDIENTES de
--   alinear con esta convención (fuera de alcance de esta tarea).
-- ============================================================

-- =====================================================
-- AVATARS BUCKET POLICIES
-- =====================================================
-- Path convention: {userId}/{userId}-avatar-{timestamp}.{ext}
-- SELECT público. INSERT/UPDATE/DELETE: foldername(name)[1] = auth.uid()
-- Los UPDATE/DELETE también los permite role = 'admin'.

-- Anyone can view avatars
CREATE POLICY "Public can view avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Users can upload into their own folder (path[1] = userId)
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users (or admins) can update own avatar (folder [1] = auth.uid())
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
);

-- Users (or admins) can delete own avatar (folder [1] = auth.uid())
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars'
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
-- GALLERY BUCKET POLICIES
-- =====================================================
-- Path convention: {userId}/{archivo}
-- SELECT público. INSERT: teacher/admin + foldername(name)[1] = auth.uid()
-- UPDATE/DELETE: dueño (foldername(name)[1] = auth.uid()) OR role = 'admin'

-- Anyone can view gallery images
CREATE POLICY "Public can view gallery images"
ON storage.objects FOR SELECT
USING (bucket_id = 'gallery');

-- Teachers/admins can upload gallery images into their own folder
CREATE POLICY "Teachers can upload gallery images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'gallery'
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('teacher', 'admin')
  )
);

-- Owner or admin can update gallery images (folder [1] = auth.uid())
CREATE POLICY "Owners can update gallery images"
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

-- Owner or admin can delete gallery images (folder [1] = auth.uid())
CREATE POLICY "Owners can delete gallery images"
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

-- =====================================================
-- COVERS BUCKET POLICIES
-- =====================================================
-- Path convention: {userId}/{archivo}
-- SELECT público. INSERT: teacher/admin + foldername(name)[1] = auth.uid()
-- UPDATE/DELETE: dueño (foldername(name)[1] = auth.uid()) OR role = 'admin'

-- Anyone can view cover images
CREATE POLICY "Public can view cover images"
ON storage.objects FOR SELECT
USING (bucket_id = 'covers');

-- Teachers/admins can upload cover images into their own folder
CREATE POLICY "Teachers can upload cover images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'covers'
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('teacher', 'admin')
  )
);

-- Owner or admin can update cover images (folder [1] = auth.uid())
CREATE POLICY "Owners can update cover images"
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

-- Owner or admin can delete cover images (folder [1] = auth.uid())
CREATE POLICY "Owners can delete cover images"
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
-- PROJECTS BUCKET POLICIES
-- =====================================================
-- PENDIENTE: las políticas actuales de este bucket en la DB no
-- siguen necesariamente la convención [1] = auth.uid(). Este archivo
-- refleja SOLO las políticas ya alineadas (avatars, covers, gallery).
-- Alinear projects queda fuera del alcance de esta tarea.

-- Anyone can view project images
CREATE POLICY "Public can view project images"
ON storage.objects FOR SELECT
USING (bucket_id = 'projects');

-- Teachers can upload project images
CREATE POLICY "Teachers can upload project images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'projects'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('teacher', 'admin')
  )
);

-- Teachers can update own project images
CREATE POLICY "Teachers can update own project images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'projects'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('teacher', 'admin')
  )
);

-- Teachers can delete own project images
CREATE POLICY "Teachers can delete own project images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'projects'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('teacher', 'admin')
  )
);

-- =====================================================
-- RESOURCES BUCKET POLICIES
-- =====================================================
-- Path convention: {userId}/{resourceId}-{timestamp}.{ext}
-- SELECT público. INSERT: teacher/admin + foldername(name)[1] = auth.uid()
-- UPDATE/DELETE: dueño (foldername(name)[1] = auth.uid()) OR role = 'admin'

-- Anyone can view resources
CREATE POLICY "Public can view resources"
ON storage.objects FOR SELECT
USING (bucket_id = 'resources');

-- Teachers/admins can upload resources into their own folder
CREATE POLICY "Teachers can upload resources"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'resources'
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('teacher', 'admin')
  )
);

-- Owner or admin can update resources (folder [1] = auth.uid())
CREATE POLICY "Owners can update resources"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'resources'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
);

-- Owner or admin can delete resources (folder [1] = auth.uid())
CREATE POLICY "Owners can delete resources"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'resources'
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
-- PUBLICATIONS BUCKET POLICIES
-- =====================================================
-- Path convention: {userId}/{publicationId}-{timestamp}.{ext}
-- SELECT público. INSERT: teacher/admin + foldername(name)[1] = auth.uid()
-- UPDATE/DELETE: dueño (foldername(name)[1] = auth.uid()) OR role = 'admin'

-- Anyone can view publications
CREATE POLICY "Public can view publications"
ON storage.objects FOR SELECT
USING (bucket_id = 'publications');

-- Teachers/admins can upload publications into their own folder
CREATE POLICY "Teachers can upload publications"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'publications'
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('teacher', 'admin')
  )
);

-- Owner or admin can update publications (folder [1] = auth.uid())
CREATE POLICY "Owners can update publications"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'publications'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
);

-- Owner or admin can delete publications (folder [1] = auth.uid())
CREATE POLICY "Owners can delete publications"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'publications'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
);