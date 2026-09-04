create table if not exists players (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  created_at timestamptz default now()
);

create table if not exists sessions (
  id         uuid primary key default gen_random_uuid(),
  player_id  uuid references players(id) on delete cascade,
  started_at timestamptz default now()
);

create table if not exists messages (
  id         uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  role       text not null check (role in ('user','assistant')),
  content    text not null,
  created_at timestamptz default now()
);

create table if not exists games (
  id         uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  name       text not null,
  config     jsonb not null,
  created_at timestamptz default now()
);

create table if not exists concepts (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid references sessions(id) on delete cascade,
  concept     text not null,
  example     text,
  detected_at timestamptz default now()
);

-- allow anon reads/writes (free tier, no auth needed for prototype)
alter table players  enable row level security;
alter table sessions enable row level security;
alter table messages enable row level security;
alter table games    enable row level security;
alter table concepts enable row level security;

create policy "public all" on players  for all using (true) with check (true);
create policy "public all" on sessions for all using (true) with check (true);
create policy "public all" on messages for all using (true) with check (true);
create policy "public all" on games    for all using (true) with check (true);
create policy "public all" on concepts for all using (true) with check (true);
