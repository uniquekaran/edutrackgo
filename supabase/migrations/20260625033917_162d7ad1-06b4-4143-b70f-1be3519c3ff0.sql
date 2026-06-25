
CREATE POLICY "Avatars: authenticated read"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'student-avatars');

CREATE POLICY "Avatars: student insert own"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'student-avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Avatars: student update own"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'student-avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Avatars: student delete own"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'student-avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
