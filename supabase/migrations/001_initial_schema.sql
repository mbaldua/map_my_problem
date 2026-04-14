-- ============================================================
-- Map My Problems — Initial Schema
-- Migration: 001_initial_schema.sql
-- ============================================================

-- Enable PostGIS for geo queries (available on Supabase by default)
create extension if not exists postgis;

-- ─── USERS ────────────────────────────────────────────────────────────────────
-- Public profile table. Linked 1:1 to auth.users via id.
-- Phone is stored in auth.users; we mirror it here for easy joins.

create table public.users (
  id            uuid primary key references auth.users(id) on delete cascade,
  phone         text unique,
  display_name  text,
  created_at    timestamptz not null default now()
);

comment on table public.users is 'Public user profiles, linked to Supabase Auth.';

-- Auto-create a row in public.users when a new auth user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, phone)
  values (
    new.id,
    new.phone
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── ISSUES ───────────────────────────────────────────────────────────────────

create type public.issue_category as enum (
  'water_logging',
  'uncleanliness',
  'traffic'
);

create type public.issue_status as enum (
  'open',
  'resolved',
  'under_review'
);

create table public.issues (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references public.users(id) on delete set null,
  category      public.issue_category not null,
  title         text,
  description   text check (char_length(description) <= 200),
  lat           double precision not null,
  lng           double precision not null,
  -- PostGIS point for fast geo queries (auto-updated via trigger)
  location      geography(point, 4326),
  address       text,
  image_urls    text[] not null default '{}',
  upvotes       integer not null default 0,
  status        public.issue_status not null default 'open',
  created_at    timestamptz not null default now()
);

comment on table public.issues is 'Civic issue reports submitted by users.';
comment on column public.issues.location is 'PostGIS point derived from lat/lng — used for ST_DWithin queries.';

-- Keep PostGIS `location` in sync with lat/lng on insert/update
create or replace function public.sync_issue_location()
returns trigger
language plpgsql
as $$
begin
  new.location := st_point(new.lng, new.lat)::geography;
  return new;
end;
$$;

create trigger sync_issue_location_trigger
  before insert or update of lat, lng on public.issues
  for each row execute procedure public.sync_issue_location();

-- Indexes
create index issues_location_idx   on public.issues using gist(location);
create index issues_category_idx   on public.issues(category);
create index issues_status_idx     on public.issues(status);
create index issues_created_at_idx on public.issues(created_at desc);
create index issues_user_id_idx    on public.issues(user_id);

-- ─── COMMENTS ─────────────────────────────────────────────────────────────────

create table public.comments (
  id         uuid primary key default gen_random_uuid(),
  issue_id   uuid not null references public.issues(id) on delete cascade,
  user_id    uuid references public.users(id) on delete set null,
  body       text not null check (char_length(body) > 0),
  parent_id  uuid references public.comments(id) on delete cascade,
  upvotes    integer not null default 0,
  -- Geo badge: commenter's location at time of comment
  comment_lat  double precision,
  comment_lng  double precision,
  created_at   timestamptz not null default now()
);

comment on table public.comments is 'Reddit-style threaded comments on issues. Max 1 level of nesting in MVP.';
comment on column public.comments.comment_lat is 'Commenter location at posting time — used to award Local badge.';

create index comments_issue_id_idx  on public.comments(issue_id);
create index comments_parent_id_idx on public.comments(parent_id);
create index comments_created_at_idx on public.comments(created_at desc);

-- ─── VOTES ────────────────────────────────────────────────────────────────────

create type public.vote_type as enum ('up', 'down');

create table public.votes (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id) on delete cascade,
  issue_id   uuid not null references public.issues(id) on delete cascade,
  type       public.vote_type not null,
  -- Geo badge: voter's location at time of vote
  vote_lat   double precision,
  vote_lng   double precision,
  created_at timestamptz not null default now(),
  -- One vote per user per issue
  unique(user_id, issue_id)
);

comment on table public.votes is 'Issue votes. One row per (user, issue). UPSERT on change.';
comment on column public.votes.vote_lat is 'Voter location at vote time — used to compute local_upvotes.';

create index votes_issue_id_idx on public.votes(issue_id);
create index votes_user_id_idx  on public.votes(user_id);

-- ─── DENORMALISED VOTE COUNTS ─────────────────────────────────────────────────
-- Keep issues.upvotes in sync automatically.

create or replace function public.update_issue_upvote_count()
returns trigger
language plpgsql
security definer
as $$
declare
  v_issue_id uuid;
begin
  v_issue_id := coalesce(new.issue_id, old.issue_id);

  update public.issues
  set upvotes = (
    select count(*) from public.votes
    where issue_id = v_issue_id and type = 'up'
  ) - (
    select count(*) from public.votes
    where issue_id = v_issue_id and type = 'down'
  )
  where id = v_issue_id;

  return null;
end;
$$;

create trigger on_vote_change
  after insert or update or delete on public.votes
  for each row execute procedure public.update_issue_upvote_count();
