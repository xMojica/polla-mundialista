create table if not exists public.pool_state (
  id text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.pool_state enable row level security;

drop policy if exists "Public can read polla state" on public.pool_state;
create policy "Public can read polla state"
on public.pool_state
for select
to anon
using (true);

drop policy if exists "Public can upsert polla state" on public.pool_state;
create policy "Public can upsert polla state"
on public.pool_state
for insert
to anon
with check (true);

drop policy if exists "Public can update polla state" on public.pool_state;
create policy "Public can update polla state"
on public.pool_state
for update
to anon
using (true)
with check (true);
