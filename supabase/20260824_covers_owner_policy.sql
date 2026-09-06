DROP POLICY IF EXISTS "Teachers can upload cover images" ON storage.objects;
CREATE POLICY "Teachers can upload cover images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'covers' AND (storage.foldername(name))[1] = auth.uid()::text AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('teacher', 'admin')));

DROP POLICY IF EXISTS "Teachers can update own cover images" ON storage.objects;
CREATE POLICY "Teachers can update own cover images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'covers' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Teachers can delete own cover images" ON storage.objects;
CREATE POLICY "Teachers can delete own cover images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'covers' AND (storage.foldername(name))[1] = auth.uid()::text);
