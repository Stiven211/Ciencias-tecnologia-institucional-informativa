-- Limita las escrituras de Storage al propietario de la carpeta raíz.
DROP POLICY IF EXISTS "Authenticated can upload avatars" ON storage.objects;
CREATE POLICY "Authenticated can upload avatars"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Teachers can upload project images" ON storage.objects;
CREATE POLICY "Teachers can upload project images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'projects' AND (storage.foldername(name))[1] = auth.uid()::text AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('teacher', 'admin')));

DROP POLICY IF EXISTS "Teachers can update own project images" ON storage.objects;
CREATE POLICY "Teachers can update own project images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'projects' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Teachers can delete own project images" ON storage.objects;
CREATE POLICY "Teachers can delete own project images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'projects' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Teachers can upload gallery images" ON storage.objects;
CREATE POLICY "Teachers can upload gallery images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'gallery' AND (storage.foldername(name))[1] = auth.uid()::text AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('teacher', 'admin')));

DROP POLICY IF EXISTS "Teachers can update own gallery images" ON storage.objects;
CREATE POLICY "Teachers can update own gallery images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'gallery' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Teachers can delete own gallery images" ON storage.objects;
CREATE POLICY "Teachers can delete own gallery images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'gallery' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Una política por acción evita evaluar condiciones duplicadas.
DROP POLICY IF EXISTS "Public can view published projects" ON public.projects;
DROP POLICY IF EXISTS "Teachers can view all projects" ON public.projects;
CREATE POLICY "View published projects or authenticated projects"
ON public.projects FOR SELECT
USING (status = 'published' OR (SELECT auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Public can view published publications" ON public.publications;
DROP POLICY IF EXISTS "Teachers can view all publications" ON public.publications;
CREATE POLICY "View published publications or authenticated publications"
ON public.publications FOR SELECT
USING (published = true OR (SELECT auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
