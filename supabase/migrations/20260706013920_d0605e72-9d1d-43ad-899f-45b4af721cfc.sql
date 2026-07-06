
CREATE TABLE public.colleges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  state TEXT,
  city TEXT,
  type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX colleges_name_lower_idx ON public.colleges (lower(name));
CREATE INDEX colleges_name_idx ON public.colleges (name);

GRANT SELECT ON public.colleges TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.colleges TO authenticated;
GRANT ALL ON public.colleges TO service_role;

ALTER TABLE public.colleges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Colleges are viewable by everyone"
  ON public.colleges FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert colleges"
  ON public.colleges FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update colleges"
  ON public.colleges FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete colleges"
  ON public.colleges FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
