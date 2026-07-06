
CREATE TABLE public.workbench_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Untitled project',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workbench_projects TO authenticated;
GRANT ALL ON public.workbench_projects TO service_role;
ALTER TABLE public.workbench_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own projects" ON public.workbench_projects FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER wp_updated BEFORE UPDATE ON public.workbench_projects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.workbench_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.workbench_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  path TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (project_id, path)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workbench_files TO authenticated;
GRANT ALL ON public.workbench_files TO service_role;
ALTER TABLE public.workbench_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own files" ON public.workbench_files FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER wf_updated BEFORE UPDATE ON public.workbench_files
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX workbench_files_project_idx ON public.workbench_files(project_id);
