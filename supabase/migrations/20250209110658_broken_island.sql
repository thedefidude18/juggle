-- Create storage buckets
DO $$
BEGIN
  -- Create event-banners bucket if it doesn't exist
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('event-banners', 'event-banners', true)
  ON CONFLICT (id) DO NOTHING;

  -- Set up storage policy for event-banners
  CREATE POLICY "Public Access"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'event-banners');

  CREATE POLICY "Authenticated users can upload event banners"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'event-banners');

  CREATE POLICY "Users can update their own event banners"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'event-banners');

  CREATE POLICY "Users can delete their own event banners"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'event-banners');
END $$;