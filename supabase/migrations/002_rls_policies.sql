-- ============================================================
-- Map My Problems — Row Level Security Policies
-- Migration: 002_rls_policies.sql
-- ============================================================
-- Run AFTER 001_initial_schema.sql

-- ─── USERS ────────────────────────────────────────────────────────────────────

alter table public.users enable row level security;

-- Anyone can read public profiles
create policy "users: public read"
  on public.users for select
  using (true);

-- Users can only update their own profile
create policy "users: owner update"
  on public.users for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Insert is handled by the trigger — no direct insert policy needed

-- ─── ISSUES ───────────────────────────────────────────────────────────────────

alter table public.issues enable row level security;

-- Anyone can read issues (anonymous browsing supported)
create policy "issues: public read"
  on public.issues for select
  using (true);

-- Authenticated users can create issues
create policy "issues: auth insert"
  on public.issues for insert
  with check (auth.uid() = user_id);

-- Only the original poster can update their issue
create policy "issues: owner update"
  on public.issues for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Only the original poster can delete (soft-delete via status preferred)
create policy "issues: owner delete"
  on public.issues for delete
  using (auth.uid() = user_id);

-- ─── COMMENTS ─────────────────────────────────────────────────────────────────

alter table public.comments enable row level security;

-- Anyone can read comments
create policy "comments: public read"
  on public.comments for select
  using (true);

-- Authenticated users can post comments
create policy "comments: auth insert"
  on public.comments for insert
  with check (auth.uid() = user_id);

-- Only commenter can update their comment
create policy "comments: owner update"
  on public.comments for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Only commenter can delete their comment
create policy "comments: owner delete"
  on public.comments for delete
  using (auth.uid() = user_id);

-- ─── VOTES ────────────────────────────────────────────────────────────────────

alter table public.votes enable row level security;

-- Anyone can read vote counts (needed for validity bar)
create policy "votes: public read"
  on public.votes for select
  using (true);

-- Authenticated users can cast votes
create policy "votes: auth insert"
  on public.votes for insert
  with check (auth.uid() = user_id);

-- Users can change their vote (upsert)
create policy "votes: owner update"
  on public.votes for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Users can retract their vote
create policy "votes: owner delete"
  on public.votes for delete
  using (auth.uid() = user_id);
