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
CREATE POLICY "Public can view profiles" 
ON profiles FOR SELECT 
USING (true);

-- Authenticated users can view their own profile
CREATE POLICY "Users can view own profile" 
ON profiles FOR SELECT 
USING (auth.uid() = id);

-- Users can insert own profile
CREATE POLICY "Users can insert own profile" 
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Admins can update all profiles
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
CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);

-- =====================================================
-- PROJECTS POLICIES
-- =====================================================

-- Public can view published projects
CREATE POLICY "Public can view published projects" 
ON projects FOR SELECT 
USING (status = 'published');

-- Teachers can view all projects
CREATE POLICY "Teachers can view all projects" 
ON projects FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Teachers can create projects
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
CREATE POLICY "Public can view resources" 
ON resources FOR SELECT 
USING (true);

-- Teachers can create resources
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
CREATE POLICY "Public can view published publications" 
ON publications FOR SELECT 
USING (published = true);

-- Teachers can view all publications
CREATE POLICY "Teachers can view all publications" 
ON publications FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Teachers can create publications
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
CREATE POLICY "Public can view activities" 
ON activities FOR SELECT 
USING (true);

-- Teachers can create activities
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
CREATE POLICY "Teachers can delete own activities" 
ON activities FOR DELETE 
USING (professor_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);