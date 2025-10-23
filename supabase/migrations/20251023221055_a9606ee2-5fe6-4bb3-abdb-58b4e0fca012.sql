-- Allow authenticated users to delete violations
CREATE POLICY "Authenticated users can delete violations"
ON public.violations
FOR DELETE
TO authenticated
USING (true);