-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('avatars', 'avatars', true),
  ('projects', 'projects', true),
  ('resources', 'resources', true),
  ('gallery', 'gallery', true),
  ('covers', 'covers', true),
  ('publications', 'publications', true)
ON CONFLICT (id) DO NOTHING;

-- Note: Cover images are uploaded to the 'covers' bucket as configured in projects.service.ts

-- =====================================================
-- AVATARS BUCKET POLICIES
-- =====================================================

-- Anyone can view avatars
CREATE POLICY "Public can view avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Authenticated users can upload avatars
CREATE POLICY "Authenticated can upload avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- Users can update own avatar
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[0]
);

-- Users can delete own avatar
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[0]
);

-- =====================================================
-- PROJECTS BUCKET POLICIES
-- =====================================================

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

-- Anyone can view resources
CREATE POLICY "Public can view resources"
ON storage.objects FOR SELECT
USING (bucket_id = 'resources');

-- Teachers can upload resources
CREATE POLICY "Teachers can upload resources"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'resources'
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('teacher', 'admin')
  )
);

-- Teachers can update own resources
CREATE POLICY "Teachers can update own resources"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'resources'
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('teacher', 'admin')
  )
);

-- Teachers can delete own resources
CREATE POLICY "Teachers can delete own resources"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'resources'
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('teacher', 'admin')
  )
);

-- =====================================================
-- GALLERY BUCKET POLICIES
-- =====================================================

-- Anyone can view gallery images
CREATE POLICY "Public can view gallery images"
ON storage.objects FOR SELECT
USING (bucket_id = 'gallery');

-- Teachers can upload gallery images
CREATE POLICY "Teachers can upload gallery images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'gallery'
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('teacher', 'admin')
  )
);

-- Teachers can update own gallery images
CREATE POLICY "Teachers can update own gallery images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'gallery'
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('teacher', 'admin')
  )
);

-- Teachers can delete own gallery images
CREATE POLICY "Teachers can delete own gallery images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'gallery'
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('teacher', 'admin')
  )
);

-- =====================================================
-- COVERS BUCKET POLICIES
-- =====================================================

-- Anyone can view cover images
CREATE POLICY "Public can view cover images"
ON storage.objects FOR SELECT
USING (bucket_id = 'covers');

-- Teachers can upload cover images
CREATE POLICY "Teachers can upload cover images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'covers'
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('teacher', 'admin')
  )
);

-- Teachers can update own cover images
CREATE POLICY "Teachers can update own cover images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'covers'
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('teacher', 'admin')
  )
);

-- Teachers can delete own cover images
CREATE POLICY "Teachers can delete own cover images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'covers'
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('teacher', 'admin')
  )
);

-- =====================================================
-- PUBLICATIONS BUCKET POLICIES
-- =====================================================

-- Anyone can view publications
CREATE POLICY "Public can view publications"
ON storage.objects FOR SELECT
USING (bucket_id = 'publications');

-- Teachers can upload publications
CREATE POLICY "Teachers can upload publications"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'publications'
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('teacher', 'admin')
  )
);

-- Teachers can update own publications
CREATE POLICY "Teachers can update own publications"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'publications'
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('teacher', 'admin')
  )
);

-- Teachers can delete own publications
CREATE POLICY "Teachers can delete own publications"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'publications'
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('teacher', 'admin')
  )
);