-- ============================================================
-- Map My Problems — Storage Buckets & Policies
-- Migration: 003_storage.sql
-- ============================================================
-- Run AFTER 002_rls_policies.sql

-- ─── ISSUE IMAGES BUCKET ──────────────────────────────────────────────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'issue-images',
  'issue-images',
  true,                        -- Public bucket — images are publicly readable by URL
  10485760,                    -- 10 MB per file
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
on conflict (id) do nothing;

-- Anyone can view images (public bucket, but explicit policy for clarity)
create policy "issue-images: public read"
  on storage.objects for select
  using (bucket_id = 'issue-images');

-- Authenticated users can upload
-- Path convention: {user_id}/{issue_id}/{filename}
create policy "issue-images: auth upload"
  on storage.objects for insert
  with check (
    bucket_id = 'issue-images'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can delete their own uploads
create policy "issue-images: owner delete"
  on storage.objects for delete
  using (
    bucket_id = 'issue-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
