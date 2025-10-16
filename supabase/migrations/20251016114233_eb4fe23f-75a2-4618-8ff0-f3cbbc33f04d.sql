-- Create storage bucket for ML models
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'models',
  'models',
  false,
  104857600, -- 100MB limit
  ARRAY['application/octet-stream', 'application/zip', 'application/x-zip-compressed', 'text/plain', 'application/json']
);

-- RLS policies for models bucket
CREATE POLICY "Authenticated users can view models"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'models');

CREATE POLICY "Authenticated users can upload models"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'models');

CREATE POLICY "Authenticated users can update models"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'models');

CREATE POLICY "Authenticated users can delete models"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'models');