
-- Create makeup knowledge table
CREATE TABLE public.makeup_knowledge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  source TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create an index on category for faster lookups
CREATE INDEX makeup_knowledge_category_idx ON public.makeup_knowledge (category);

-- Add a trigger to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_makeup_knowledge_updated_at
BEFORE UPDATE ON public.makeup_knowledge
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Create storage bucket for makeup documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('makeup-documents', 'makeup-documents', false);

-- Set up access policy for makeup-documents bucket
-- Only authenticated users can upload
CREATE POLICY "Allow authenticated users to upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'makeup-documents');

-- Only authenticated users can view their own uploads
CREATE POLICY "Allow authenticated users to view documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'makeup-documents');
