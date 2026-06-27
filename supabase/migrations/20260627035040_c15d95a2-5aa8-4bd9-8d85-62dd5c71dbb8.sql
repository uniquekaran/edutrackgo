
CREATE TYPE public.noc_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.noc_type AS ENUM ('leave', 'event', 'internship', 'other');

CREATE TABLE public.noc_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  request_type public.noc_type NOT NULL DEFAULT 'leave',
  reason TEXT NOT NULL,
  from_date DATE,
  to_date DATE,
  event_name TEXT,
  status public.noc_status NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.noc_requests TO authenticated;
GRANT ALL ON public.noc_requests TO service_role;

ALTER TABLE public.noc_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students view own noc requests"
  ON public.noc_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = student_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Students create own noc requests"
  ON public.noc_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students delete own pending noc requests"
  ON public.noc_requests FOR DELETE
  TO authenticated
  USING (auth.uid() = student_id AND status = 'pending');

CREATE POLICY "Admins update noc requests"
  ON public.noc_requests FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER touch_noc_requests_updated_at
  BEFORE UPDATE ON public.noc_requests
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER PUBLICATION supabase_realtime ADD TABLE public.noc_requests;
