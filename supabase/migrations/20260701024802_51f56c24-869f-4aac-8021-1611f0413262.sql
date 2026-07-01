-- ENROLLMENT REQUESTS
CREATE TABLE public.enrollment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  university TEXT NOT NULL,
  course TEXT NOT NULL,
  year TEXT NOT NULL,
  section TEXT NOT NULL,
  receipt_url TEXT,
  receipt_path TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  roll_number TEXT,
  rejection_reason TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.enrollment_requests TO authenticated;
GRANT ALL ON public.enrollment_requests TO service_role;
ALTER TABLE public.enrollment_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own enrollment read" ON public.enrollment_requests
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "own enrollment insert" ON public.enrollment_requests
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "admin enrollment update" ON public.enrollment_requests
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_enrollment_touch BEFORE UPDATE ON public.enrollment_requests
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- TEACHERS
CREATE TABLE public.network_teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university TEXT NOT NULL,
  course TEXT NOT NULL,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  designation TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.network_teachers TO authenticated;
GRANT ALL ON public.network_teachers TO service_role;
ALTER TABLE public.network_teachers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "teachers read" ON public.network_teachers
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "teachers admin write" ON public.network_teachers
  FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- MESSAGES
CREATE TABLE public.network_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  reported BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.network_messages TO authenticated;
GRANT ALL ON public.network_messages TO service_role;
ALTER TABLE public.network_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "msg read participants" ON public.network_messages
  FOR SELECT TO authenticated USING (auth.uid() = sender_id OR auth.uid() = recipient_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "msg send self" ON public.network_messages
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "msg recipient report" ON public.network_messages
  FOR UPDATE TO authenticated USING (auth.uid() = recipient_id) WITH CHECK (auth.uid() = recipient_id);

CREATE INDEX idx_msg_pair ON public.network_messages (sender_id, recipient_id, created_at DESC);
CREATE INDEX idx_enroll_status ON public.enrollment_requests (status, created_at DESC);