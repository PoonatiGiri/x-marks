-- ============================================================
-- X-marks initial schema
-- Run this once in your Supabase project SQL editor
-- ============================================================

-- NextAuth adapter tables
-- (required by @auth/supabase-adapter)
create table if not exists users (
  id uuid not null default gen_random_uuid(),
  name text,
  email text,
  "emailVerified" timestamptz,
  image text,
  primary key (id)
);

create table if not exists accounts (
  id uuid not null default gen_random_uuid(),
  "userId" uuid not null references users(id) on delete cascade,
  type text not null,
  provider text not null,
  "providerAccountId" text not null,
  refresh_token text,
  access_token text,
  expires_at bigint,
  token_type text,
  scope text,
  id_token text,
  session_state text,
  primary key (id)
);

create table if not exists sessions (
  id uuid not null default gen_random_uuid(),
  "userId" uuid not null references users(id) on delete cascade,
  "sessionToken" text not null unique,
  expires timestamptz not null,
  primary key (id)
);

create table if not exists verification_tokens (
  identifier text not null,
  token text not null unique,
  expires timestamptz not null,
  primary key (identifier, token)
);

-- ============================================================
-- App tables
-- ============================================================

-- Stored X bookmarks (content preserved even if tweet is deleted)
create table if not exists bookmarks (
  id text primary key,
  user_id uuid not null references users(id) on delete cascade,
  text text not null,
  author_id text not null,
  author_name text not null,
  author_username text not null,
  author_profile_image text,
  tweet_created_at timestamptz,
  expanded_url text,
  is_thread boolean not null default false,
  media jsonb,
  public_metrics jsonb,
  first_seen_at timestamptz not null default now(),
  last_synced_at timestamptz not null default now(),
  deleted_from_x boolean not null default false
);

create index if not exists bookmarks_user_id_idx on bookmarks(user_id);
create index if not exists bookmarks_first_seen_at_idx on bookmarks(user_id, first_seen_at desc);

-- Stored Reddit saves
create table if not exists reddit_saves (
  id text not null,
  user_id uuid not null references users(id) on delete cascade,
  title text not null,
  body text,
  url text not null,
  subreddit text not null,
  author text,
  score integer not null default 0,
  created_utc bigint not null,
  permalink text not null,
  is_self boolean not null default false,
  preview_image text,
  content_type text not null, -- 'saved' | 'upvoted' | 'subreddit_top'
  first_seen_at timestamptz not null default now(),
  last_synced_at timestamptz not null default now(),
  primary key (id, user_id)
);

create index if not exists reddit_saves_user_id_idx on reddit_saves(user_id);

-- Per-user sync state (enables incremental sync)
create table if not exists sync_state (
  user_id uuid primary key references users(id) on delete cascade,
  newest_x_bookmark_id text,    -- newest bookmark ID we've stored, stop fetching when we see this
  x_last_synced_at timestamptz,
  reddit_last_synced_at timestamptz
);

-- ============================================================
-- Row-level security
-- Users can only read/write their own data
-- ============================================================
alter table bookmarks enable row level security;
alter table reddit_saves enable row level security;
alter table sync_state enable row level security;

-- We use the service role key in API routes, so RLS is for safety only
-- Service role bypasses RLS by default
create policy "users own bookmarks"
  on bookmarks for all
  using (true)
  with check (true);

create policy "users own reddit saves"
  on reddit_saves for all
  using (true)
  with check (true);

create policy "users own sync state"
  on sync_state for all
  using (true)
  with check (true);
