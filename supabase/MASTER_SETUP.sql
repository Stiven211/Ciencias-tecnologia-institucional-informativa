-- ============================================================================
-- MASTER SQL FILE - Supabase Setup Completo
-- Área Ciencias y Tecnología - Colegio José Celestino Mutis
-- ============================================================================
-- INSTRUCCIONES:
-- 1. Ejecutar este archivo COMPLETO en Supabase Dashboard > SQL Editor
-- 2. Ejecutar en orden: Extensiones → Tablas → RLS → Storage
-- 3. Verificar que no haya errores antes de continuar
-- ============================================================================

-- ============================================================================
-- 1. EXTENSIONES
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 2. TABLAS (schema.sql)
-- ============================================================================

-- Profiles table - linked to auth.users
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'visitor' CHECK (role IN ('admin', 'teacher', 'visitor')),
  avatar_url TEXT,
  bio TEXT,
  specialization TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects table - owned by professors
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  professor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  content TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  cover_image TEXT,
  technologies TEXT[],
  categories TEXT[] CHECK (categories <@ ARRAY['STEM', 'Robótica', 'Programación', 'Videojuegos', 'Ciencias Naturales', 'Tecnología', 'Electrónica', 'IA', 'Matemáticas', 'Física']),
  gallery_images TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Resources table - teaching materials
CREATE TABLE IF NOT EXISTS resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  professor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('document', 'video', 'link', 'image')),
  file_url TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Publications table - articles and papers
CREATE TABLE IF NOT EXISTS publications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  professor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT,
  cover_image TEXT,
  published BOOLEAN DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activities table - assignments and tasks
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  professor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_projects_professor_id ON projects(professor_id);
CREATE INDEX IF NOT EXISTS idx_resources_professor_id ON resources(professor_id);
CREATE INDEX IF NOT EXISTS idx_publications_professor_id ON publications(professor_id);
CREATE INDEX IF NOT EXISTS idx_activities_professor_id ON activities(professor_id);
CREATE INDEX IF NOT EXISTS idx_projects_slug ON projects(slug);
CREATE INDEX IF NOT EXISTS idx_publications_published ON publications(published);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables (IF NOT EXISTS no aplica a triggers, usamos DROP IF EXISTS)
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_resources_updated_at ON resources;
CREATE TRIGGER update_resources_updated_at BEFORE UPDATE ON resources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_publications_updated_at ON publications;
CREATE TRIGGER update_publications_updated_at BEFORE UPDATE ON publications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_activities_updated_at ON activities;
CREATE TRIGGER update_activities_updated_at BEFORE UPDATE ON activities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 3. ROW LEVEL SECURITY (rls.sql)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PROFILES POLICIES
-- =====================================================

-- Public can view all profiles
DROP POLICY IF EXISTS "Public can view profiles" ON profiles;
CREATE POLICY "Public can view profiles" 
ON profiles FOR SELECT 
USING (true);

-- Authenticated users can view their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" 
ON profiles FOR SELECT 
USING (auth.uid() = id);

-- Users can insert own profile
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" 
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Admins can update all profiles
DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;
CREATE POLICY "Admins can update profiles" 
ON profiles FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Users can update own profile
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);

-- =====================================================
-- PROJECTS POLICIES
-- =====================================================

-- Public can view published projects
DROP POLICY IF EXISTS "Public can view published projects" ON projects;
CREATE POLICY "Public can view published projects" 
ON projects FOR SELECT 
USING (status = 'published');

-- Teachers can view all projects
DROP POLICY IF EXISTS "Teachers can view all projects" ON projects;
CREATE POLICY "Teachers can view all projects" 
ON projects FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Teachers can create projects
DROP POLICY IF EXISTS "Teachers can create projects" ON projects;
CREATE POLICY "Teachers can create projects" 
ON projects FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('teacher', 'admin')
  )
);

-- Teachers can update own projects
DROP POLICY IF EXISTS "Teachers can update own projects" ON projects;
CREATE POLICY "Teachers can update own projects" 
ON projects FOR UPDATE 
USING (professor_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Teachers can delete own projects
DROP POLICY IF EXISTS "Teachers can delete own projects" ON projects;
CREATE POLICY "Teachers can delete own projects" 
ON projects FOR DELETE 
USING (professor_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- =====================================================
-- RESOURCES POLICIES
-- =====================================================

-- Public can view all resources
DROP POLICY IF EXISTS "Public can view resources" ON resources;
CREATE POLICY "Public can view resources" 
ON resources FOR SELECT 
USING (true);

-- Teachers can create resources
DROP POLICY IF EXISTS "Teachers can create resources" ON resources;
CREATE POLICY "Teachers can create resources" 
ON resources FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('teacher', 'admin')
  )
);

-- Teachers can update own resources
DROP POLICY IF EXISTS "Teachers can update own resources" ON resources;
CREATE POLICY "Teachers can update own resources" 
ON resources FOR UPDATE 
USING (professor_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Teachers can delete own resources
DROP POLICY IF EXISTS "Teachers can delete own resources" ON resources;
CREATE POLICY "Teachers can delete own resources" 
ON resources FOR DELETE 
USING (professor_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- =====================================================
-- PUBLICATIONS POLICIES
-- =====================================================

-- Public can view published publications
DROP POLICY IF EXISTS "Public can view published publications" ON publications;
CREATE POLICY "Public can view published publications" 
ON publications FOR SELECT 
USING (published = true);

-- Teachers can view all publications
DROP POLICY IF EXISTS "Teachers can view all publications" ON publications;
CREATE POLICY "Teachers can view all publications" 
ON publications FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Teachers can create publications
DROP POLICY IF EXISTS "Teachers can create publications" ON publications;
CREATE POLICY "Teachers can create publications" 
ON publications FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('teacher', 'admin')
  )
);

-- Teachers can update own publications
DROP POLICY IF EXISTS "Teachers can update own publications" ON publications;
CREATE POLICY "Teachers can update own publications" 
ON publications FOR UPDATE 
USING (professor_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Teachers can delete own publications
DROP POLICY IF EXISTS "Teachers can delete own publications" ON publications;
CREATE POLICY "Teachers can delete own publications" 
ON publications FOR DELETE 
USING (professor_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- =====================================================
-- ACTIVITIES POLICIES
-- =====================================================

-- Public can view activities
DROP POLICY IF EXISTS "Public can view activities" ON activities;
CREATE POLICY "Public can view activities" 
ON activities FOR SELECT 
USING (true);

-- Teachers can create activities
DROP POLICY IF EXISTS "Teachers can create activities" ON activities;
CREATE POLICY "Teachers can create activities" 
ON activities FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('teacher', 'admin')
  )
);

-- Teachers can update own activities
DROP POLICY IF EXISTS "Teachers can update own activities" ON activities;
CREATE POLICY "Teachers can update own activities" 
ON activities FOR UPDATE 
USING (professor_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Teachers can delete own activities
DROP POLICY IF EXISTS "Teachers can delete own activities" ON activities;
CREATE POLICY "Teachers can delete own activities" 
ON activities FOR DELETE 
USING (professor_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- ============================================================================
-- 4. STORAGE BUCKETS Y POLÍTICAS (storage.sql + hardening migration)
-- ============================================================================

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
-- CONVENCIÓN DE PATHS (IMPORTANTE)
-- ============================================================
-- Postgres storage.foldername() es 1-based: [1] = PRIMER segmento
-- avatars:    {userId}/{userId}-avatar-{ts}.{ext}
-- covers:     {userId}/{projectId}-{ts}.{ext}          -- NUEVA convención
-- gallery:    {userId}/{projectId}-{ts}-{random}.{ext} -- NUEVA convención
-- resources:  {userId}/{resourceId}-{ts}.{ext}
-- publications: {userId}/{publicationId}-{ts}.{ext}
-- projects:   PENDIENTE de alinear (ver nota abajo)
-- ============================================================

-- =====================================================
-- AVATARS BUCKET POLICIES
-- =====================================================
DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects;
CREATE POLICY "Public can view avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
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

DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
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
-- GALLERY BUCKET POLICIES (hardened - migration 20260902)
-- =====================================================
DROP POLICY IF EXISTS "Public can view gallery images" ON storage.objects;
CREATE POLICY "Public can view gallery images"
ON storage.objects FOR SELECT
USING (bucket_id = 'gallery');

DROP POLICY IF EXISTS "Teachers can upload gallery images" ON storage.objects;
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

DROP POLICY IF EXISTS "Owners can update gallery images" ON storage.objects;
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

DROP POLICY IF EXISTS "Owners can delete gallery images" ON storage.objects;
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
-- COVERS BUCKET POLICIES (hardened - migration 20260902)
-- =====================================================
DROP POLICY IF EXISTS "Public can view cover images" ON storage.objects;
CREATE POLICY "Public can view cover images"
ON storage.objects FOR SELECT
USING (bucket_id = 'covers');

DROP POLICY IF EXISTS "Teachers can upload cover images" ON storage.objects;
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

DROP POLICY IF EXISTS "Owners can update cover images" ON storage.objects;
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

DROP POLICY IF EXISTS "Owners can delete cover images" ON storage.objects;
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
-- NOTA: Este bucket PENDIENTE de alinear a convención {userId}/...
-- Actualmente permite teacher/admin sin ownership check en UPDATE/DELETE
-- Se recomienda alinear en próxima iteración (ver migration 20260902)

DROP POLICY IF EXISTS "Public can view project images" ON storage.objects;
CREATE POLICY "Public can view project images"
ON storage.objects FOR SELECT
USING (bucket_id = 'projects');

DROP POLICY IF EXISTS "Teachers can upload project images" ON storage.objects;
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

DROP POLICY IF EXISTS "Teachers can update own project images" ON storage.objects;
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

DROP POLICY IF EXISTS "Teachers can delete own project images" ON storage.objects;
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
DROP POLICY IF EXISTS "Public can view resources" ON storage.objects;
CREATE POLICY "Public can view resources"
ON storage.objects FOR SELECT
USING (bucket_id = 'resources');

DROP POLICY IF EXISTS "Teachers can upload resources" ON storage.objects;
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

DROP POLICY IF EXISTS "Owners can update resources" ON storage.objects;
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

DROP POLICY IF EXISTS "Owners can delete resources" ON storage.objects;
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
DROP POLICY IF EXISTS "Public can view publications" ON storage.objects;
CREATE POLICY "Public can view publications"
ON storage.objects FOR SELECT
USING (bucket_id = 'publications');

DROP POLICY IF EXISTS "Teachers can upload publications" ON storage.objects;
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

DROP POLICY IF EXISTS "Owners can update publications" ON storage.objects;
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

DROP POLICY IF EXISTS "Owners can delete publications" ON storage.objects;
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

-- ============================================================================
-- 5. VERIFICACIÓN POST-EJECUCIÓN
-- ============================================================================
-- Ejecutar estas queries para confirmar que todo se aplicó correctamente:

-- Verificar tablas creadas
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'projects', 'resources', 'publications', 'activities')
ORDER BY table_name;

-- Verificar RLS habilitado
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'projects', 'resources', 'publications', 'activities');

-- Verificar políticas creadas
SELECT tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'projects', 'resources', 'publications', 'activities')
ORDER BY tablename, policyname;

-- Verificar buckets
SELECT id, name, public FROM storage.buckets 
WHERE id IN ('avatars', 'projects', 'resources', 'gallery', 'covers', 'publications')
ORDER BY id;

-- Verificar políticas storage
-- NOTA: pg_policies no tiene columna bucket_id; se filtra por qual (condición de la política)
SELECT policyname, cmd, qual
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND (
  qual ILIKE '%avatars%' 
  OR qual ILIKE '%projects%' 
  OR qual ILIKE '%resources%' 
  OR qual ILIKE '%gallery%' 
  OR qual ILIKE '%covers%' 
  OR qual ILIKE '%publications%'
)
ORDER BY policyname, cmd;

-- ============================================================================
-- FIN DEL ARCHIVO MASTER
-- ============================================================================