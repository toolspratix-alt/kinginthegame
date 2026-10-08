-- King in the Game: public game comments and reactions
create extension if not exists pgcrypto;

create table if not exists public.game_comments (
  id uuid primary key default gen_random_uuid(),
  game_id text not null,
  display_name text not null check (char_length(trim(display_name)) between 2 and 40),
  body text not null check (char_length(trim(body)) between 2 and 800),
  created_at timestamptz not null default now()
);

create table if not exists public.game_votes (
  id uuid primary key default gen_random_uuid(),
  game_id text not null,
  visitor_id text not null check (char_length(visitor_id) between 16 and 80),
  vote smallint not null check (vote in (-1, 1)),
  created_at timestamptz not null default now(),
  unique (game_id, visitor_id)
);

create index if not exists game_comments_game_created_idx
  on public.game_comments (game_id, created_at desc);
create index if not exists game_votes_game_vote_idx
  on public.game_votes (game_id, vote);

alter table public.game_comments enable row level security;
alter table public.game_votes enable row level security;

drop policy if exists "Anyone can read comments" on public.game_comments;
create policy "Anyone can read comments"
  on public.game_comments for select using (true);

drop policy if exists "Anyone can add comments" on public.game_comments;
create policy "Anyone can add comments"
  on public.game_comments for insert with check (true);

drop policy if exists "Anyone can read votes" on public.game_votes;
create policy "Anyone can read votes"
  on public.game_votes for select using (true);

drop policy if exists "Anyone can add or change own vote" on public.game_votes;
create policy "Anyone can add or change own vote"
  on public.game_votes for insert with check (true);

drop policy if exists "Anyone can update own vote" on public.game_votes;
create policy "Anyone can update own vote"
  on public.game_votes for update using (true) with check (true);

-- The Vercel API validates and constrains public input before forwarding it.
