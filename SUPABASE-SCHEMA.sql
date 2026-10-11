-- BANOVAN NOOR Support/Charity backend (Supabase PostgreSQL)
-- 1) Run this SQL in Supabase SQL Editor.
-- 2) Create a PUBLIC Storage bucket named campaign-media.
-- 3) Disable public signups; create manager accounts manually in Authentication.
-- 4) Put only Project URL + anon key in support-config.json. NEVER expose service_role key.
create extension if not exists pgcrypto;
create table if not exists public.bn_campaigns (
 id uuid primary key,
 title text not null,
 description text not null,
 goal_amount numeric(14,2) not null default 0 check (goal_amount >= 0),
 received_amount numeric(14,2) not null default 0 check (received_amount >= 0),
 currency text not null default 'AFN',
 deadline date,
 manager_name text,
 status text not null default 'draft' check (status in ('draft','published','closed')),
 photos jsonb not null default '[]'::jsonb check (jsonb_typeof(photos)='array' and jsonb_array_length(photos)<=5),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create table if not exists public.bn_expense_reports (
 id uuid primary key default gen_random_uuid(),
 campaign_id uuid not null references public.bn_campaigns(id) on delete cascade,
 title text not null,
 amount numeric(14,2) not null check (amount > 0),
 currency text not null default 'AFN',
 spent_at date not null,
 description text,
 photos jsonb not null default '[]'::jsonb check (jsonb_typeof(photos)='array' and jsonb_array_length(photos)<=5),
 created_at timestamptz not null default now()
);
alter table public.bn_campaigns enable row level security;
alter table public.bn_expense_reports enable row level security;
drop policy if exists "public read published campaigns" on public.bn_campaigns;
create policy "public read published campaigns" on public.bn_campaigns for select to anon, authenticated using (status='published' or auth.role()='authenticated');
drop policy if exists "authenticated managers insert campaigns" on public.bn_campaigns;
create policy "authenticated managers insert campaigns" on public.bn_campaigns for insert to authenticated with check (auth.role()='authenticated');
drop policy if exists "authenticated managers update campaigns" on public.bn_campaigns;
create policy "authenticated managers update campaigns" on public.bn_campaigns for update to authenticated using (auth.role()='authenticated') with check (auth.role()='authenticated');
drop policy if exists "public read reports for published campaigns" on public.bn_expense_reports;
create policy "public read reports for published campaigns" on public.bn_expense_reports for select to anon, authenticated using (exists (select 1 from public.bn_campaigns c where c.id=campaign_id and (c.status='published' or auth.role()='authenticated')));
drop policy if exists "authenticated managers insert reports" on public.bn_expense_reports;
create policy "authenticated managers insert reports" on public.bn_expense_reports for insert to authenticated with check (auth.role()='authenticated');
-- Storage: create bucket campaign-media as PUBLIC via Dashboard. These policies allow authenticated manager uploads only.
drop policy if exists "authenticated managers upload campaign media" on storage.objects;
create policy "authenticated managers upload campaign media" on storage.objects for insert to authenticated with check (bucket_id='campaign-media');
drop policy if exists "authenticated managers update campaign media" on storage.objects;
create policy "authenticated managers update campaign media" on storage.objects for update to authenticated using (bucket_id='campaign-media') with check (bucket_id='campaign-media');
drop policy if exists "public read campaign media" on storage.objects;
create policy "public read campaign media" on storage.objects for select to anon, authenticated using (bucket_id='campaign-media');
