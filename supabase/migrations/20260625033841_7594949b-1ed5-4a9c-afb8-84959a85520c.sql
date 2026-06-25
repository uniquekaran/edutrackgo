
-- student_profiles_detail
CREATE TABLE public.student_profiles_detail (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  course text,
  semester text,
  roll_number text,
  father_name text,
  mother_name text,
  college_name text,
  blood_group text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_profiles_detail TO authenticated;
GRANT ALL ON public.student_profiles_detail TO service_role;
ALTER TABLE public.student_profiles_detail ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Student manages own profile detail" ON public.student_profiles_detail
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admin views all profile details" ON public.student_profiles_detail
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_student_profiles_detail_updated
  BEFORE UPDATE ON public.student_profiles_detail
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- todo_list
CREATE TABLE public.todo_list (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  done boolean NOT NULL DEFAULT false,
  due_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.todo_list TO authenticated;
GRANT ALL ON public.todo_list TO service_role;
ALTER TABLE public.todo_list ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own tasks" ON public.todo_list
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_todo_list_updated
  BEFORE UPDATE ON public.todo_list
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- learning_materials
CREATE TABLE public.learning_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subject text NOT NULL,
  module text,
  course text,
  description text,
  file_url text NOT NULL,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.learning_materials TO authenticated;
GRANT ALL ON public.learning_materials TO service_role;
ALTER TABLE public.learning_materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All authenticated can view materials" ON public.learning_materials
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin inserts materials" ON public.learning_materials
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin updates materials" ON public.learning_materials
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin deletes materials" ON public.learning_materials
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_learning_materials_updated
  BEFORE UPDATE ON public.learning_materials
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
