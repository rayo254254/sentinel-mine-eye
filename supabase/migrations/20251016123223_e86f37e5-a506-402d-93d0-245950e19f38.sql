-- Restrict models table SELECT policy to only show user's own models or active models
DROP POLICY IF EXISTS "Authenticated users can view models" ON public.models;

CREATE POLICY "Users can view own models or active models"
  ON public.models
  FOR SELECT
  TO authenticated
  USING (uploaded_by = auth.uid() OR is_active = true);