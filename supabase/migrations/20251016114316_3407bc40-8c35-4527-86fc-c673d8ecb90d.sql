-- Create table to track uploaded models
CREATE TABLE public.models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  type TEXT NOT NULL, -- 'model' or 'dataset'
  file_size BIGINT NOT NULL,
  mime_type TEXT,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.models ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Authenticated users can view models"
ON public.models
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert models"
ON public.models
FOR INSERT
TO authenticated
WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "Users can update their own models"
ON public.models
FOR UPDATE
TO authenticated
USING (uploaded_by = auth.uid());

CREATE POLICY "Users can delete their own models"
ON public.models
FOR DELETE
TO authenticated
USING (uploaded_by = auth.uid());

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_models_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_models_updated_at
BEFORE UPDATE ON public.models
FOR EACH ROW
EXECUTE FUNCTION public.update_models_updated_at();