-- ============================================================
-- Map My Problems — PostGIS Helper Functions
-- Migration: 004_geo_queries.sql
-- ============================================================
-- Run AFTER 001_initial_schema.sql

-- ─── ISSUES WITHIN RADIUS ─────────────────────────────────────────────────────
-- Fetches issues within a given radius (km) of a lat/lng point.
-- Returns issues with a pre-computed distance_km field.
--
-- Usage (from Supabase JS client):
--   supabase.rpc('get_issues_within_radius', {
--     user_lat: 19.05,
--     user_lng: 72.83,
--     radius_km: 5,
--     category_filter: null   -- or 'water_logging' | 'uncleanliness' | 'traffic'
--   })

create or replace function public.get_issues_within_radius(
  user_lat       double precision,
  user_lng       double precision,
  radius_km      double precision,
  category_filter public.issue_category default null
)
returns table (
  id           uuid,
  user_id      uuid,
  category     public.issue_category,
  title        text,
  description  text,
  lat          double precision,
  lng          double precision,
  address      text,
  image_urls   text[],
  upvotes      integer,
  status       public.issue_status,
  created_at   timestamptz,
  distance_km  double precision
)
language sql
stable
security definer
as $$
  select
    i.id,
    i.user_id,
    i.category,
    i.title,
    i.description,
    i.lat,
    i.lng,
    i.address,
    i.image_urls,
    i.upvotes,
    i.status,
    i.created_at,
    round(
      (st_distance(
        i.location,
        st_point(user_lng, user_lat)::geography
      ) / 1000.0)::numeric,
      2
    )::double precision as distance_km
  from public.issues i
  where
    st_dwithin(
      i.location,
      st_point(user_lng, user_lat)::geography,
      radius_km * 1000   -- ST_DWithin uses metres
    )
    and (category_filter is null or i.category = category_filter)
  order by distance_km asc;
$$;

-- ─── LOCAL VOTE COUNT ─────────────────────────────────────────────────────────
-- Counts upvotes that were cast from within `radius_km` of an issue.
-- Used for the Validity Bar's "local upvotes" figure.
--
-- Usage:
--   supabase.rpc('get_local_upvote_count', {
--     p_issue_id: '...uuid...',
--     radius_km: 5
--   })

create or replace function public.get_local_upvote_count(
  p_issue_id  uuid,
  radius_km   double precision
)
returns integer
language sql
stable
security definer
as $$
  select count(*)::integer
  from public.votes v
  join public.issues i on i.id = v.issue_id
  where
    v.issue_id = p_issue_id
    and v.type = 'up'
    and v.vote_lat is not null
    and v.vote_lng is not null
    and st_dwithin(
      st_point(v.vote_lng, v.vote_lat)::geography,
      i.location,
      radius_km * 1000
    );
$$;

-- ─── AREA PULSE SUMMARY ───────────────────────────────────────────────────────
-- Returns issue counts by category within a radius, for the Area Pulse panel.
--
-- Usage:
--   supabase.rpc('get_area_pulse', {
--     user_lat: 19.05,
--     user_lng: 72.83,
--     radius_km: 5,
--     days_back: 7
--   })

create or replace function public.get_area_pulse(
  user_lat  double precision,
  user_lng  double precision,
  radius_km double precision,
  days_back integer default 7
)
returns table (
  category      public.issue_category,
  issue_count   bigint
)
language sql
stable
security definer
as $$
  select
    i.category,
    count(*) as issue_count
  from public.issues i
  where
    st_dwithin(
      i.location,
      st_point(user_lng, user_lat)::geography,
      radius_km * 1000
    )
    and i.created_at >= now() - (days_back || ' days')::interval
  group by i.category;
$$;
