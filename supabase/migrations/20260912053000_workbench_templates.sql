-- Saved batches of AI workbench actions, applied to a code selection in one click.
CREATE TABLE public.workbench_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  actions JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workbench_templates TO authenticated;
GRANT ALL ON public.workbench_templates TO service_role;
ALTER TABLE public.workbench_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own templates" ON public.workbench_templates FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX workbench_templates_user_idx ON public.workbench_templates(user_id);
