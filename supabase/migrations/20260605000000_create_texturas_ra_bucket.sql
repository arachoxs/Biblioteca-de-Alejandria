-- Migration: Create storage bucket for RA textures
-- Creates the "texturas-ra" bucket for storing book augmented reality textures (portada, contraportada, lomo).

-- 1. Create the bucket (public for read access)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'texturas-ra',
  'texturas-ra',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Policy: Anyone can view (public bucket)
CREATE POLICY "texturas_ra_select_public"
ON storage.objects
FOR SELECT
USING (bucket_id = 'texturas-ra');

-- 3. Policy: Authenticated admins can insert
CREATE POLICY "texturas_ra_insert_admin"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'texturas-ra'
  AND auth.role() = 'authenticated'
  AND (auth.jwt()->'app_metadata'->>'role')::text IN ('ROOT', 'ADMINISTRADOR')
);

-- 4. Policy: Authenticated admins can update
CREATE POLICY "texturas_ra_update_admin"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'texturas-ra'
  AND auth.role() = 'authenticated'
  AND (auth.jwt()->'app_metadata'->>'role')::text IN ('ROOT', 'ADMINISTRADOR')
);

-- 5. Policy: Authenticated admins can delete
CREATE POLICY "texturas_ra_delete_admin"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'texturas-ra'
  AND auth.role() = 'authenticated'
  AND (auth.jwt()->'app_metadata'->>'role')::text IN ('ROOT', 'ADMINISTRADOR')
);
