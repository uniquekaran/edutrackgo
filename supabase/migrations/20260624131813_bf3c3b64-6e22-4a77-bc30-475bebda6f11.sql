CREATE POLICY "Students upload own files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'student-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Students view own files"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'student-documents'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR public.has_role(auth.uid(), 'admin')
    )
  );

CREATE POLICY "Students delete own files"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'student-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
