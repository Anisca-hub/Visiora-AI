-- ====================================================================
-- 1. CLEANUP SAFELY (NO-OP IF ALREADY REMOVED)
-- ====================================================================
drop table if exists public.generated_images cascade;

-- ====================================================================
-- 2. USER PROFILES CONFIGURATION (SAFE CREATION)
-- ====================================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  credits integer not null default 25, 
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);

-- ====================================================================
-- 3. PRODUCTION GENERATED IMAGES INDEX (SAFE CREATION)
-- ====================================================================
create table if not exists public.generated_images (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  prompt text not null,
  style text,
  provider text not null default 'lovable-ai',
  model text,
  image_url text not null,
  storage_path text,
  width integer,
  height integer,
  is_public boolean not null default false, 
  parent_id uuid references public.generated_images(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists generated_images_user_id_created_at_idx on public.generated_images (user_id, created_at desc);
create index if not exists generated_images_is_public_created_at_idx on public.generated_images (is_public, created_at desc);
alter table public.generated_images enable row level security;

drop policy if exists "images_select_own" on public.generated_images;
create policy "images_select_own" on public.generated_images for select using (auth.uid() = user_id);

drop policy if exists "images_select_public" on public.generated_images;
create policy "images_select_public" on public.generated_images for select using (is_public = true);

drop policy if exists "images_insert_own" on public.generated_images;
create policy "images_insert_own" on public.generated_images for insert with check (auth.uid() = user_id);

drop policy if exists "images_update_own" on public.generated_images;
create policy "images_update_own" on public.generated_images for update using (auth.uid() = user_id);

drop policy if exists "images_delete_own" on public.generated_images;
create policy "images_delete_own" on public.generated_images for delete using (auth.uid() = user_id);

-- ====================================================================
-- 4. IMAGE FAVORITES SYNC INDEX (SAFE CREATION)
-- ====================================================================
create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  image_id uuid not null references public.generated_images(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, image_id)
);

alter table public.favorites enable row level security;

drop policy if exists "favorites_select_own" on public.favorites;
create policy "favorites_select_own" on public.favorites for select using (auth.uid() = user_id);

drop policy if exists "favorites_insert_own" on public.favorites;
create policy "favorites_insert_own" on public.favorites for insert with check (auth.uid() = user_id);

drop policy if exists "favorites_delete_own" on public.favorites;
create policy "favorites_delete_own" on public.favorites for delete using (auth.uid() = user_id);

-- ====================================================================
-- 5. TELEMETRY & CONSUMPTION AUDITING (SAFE CREATION)
-- ====================================================================
create table if not exists public.prompt_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  prompt text not null,
  created_at timestamptz not null default now()
);
create index if not exists prompt_history_user_id_created_at_idx on public.prompt_history (user_id, created_at desc);
alter table public.prompt_history enable row level security;

drop policy if exists "prompt_select_own" on public.prompt_history;
create policy "prompt_select_own" on public.prompt_history for select using (auth.uid() = user_id);

drop policy if exists "prompt_insert_own" on public.prompt_history;
create policy "prompt_insert_own" on public.prompt_history for insert with check (auth.uid() = user_id);

drop policy if exists "prompt_delete_own" on public.prompt_history;
create policy "prompt_delete_own" on public.prompt_history for delete using (auth.uid() = user_id);

create table if not exists public.api_usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  credits_spent integer not null default 0,
  metadata jsonb,
  created_at timestamptz not null default now()
);
create index if not exists api_usage_logs_user_id_created_at_idx on public.api_usage_logs (user_id, created_at desc);
alter table public.api_usage_logs enable row level security;

drop policy if exists "logs_select_own" on public.api_usage_logs;
create policy "logs_select_own" on public.api_usage_logs for select using (auth.uid() = user_id);

-- ====================================================================
-- 6. TRIGGER OPERATIONS & SECURITY ENFORCEMENT PROCEDURES
-- ====================================================================
create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin 
  new.updated_at := now(); 
  return new; 
end $$;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles
for each row execute function public.touch_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, avatar_url, credits)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    25
  );
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.touch_updated_at() from public, anon, authenticated;

-- ====================================================================
-- 7. VISIORA AI SECURE BLOB CONTAINER STORAGE SCHEMATICS
-- ====================================================================
insert into storage.buckets (id, name, public) 
values ('generations', 'generations', true)
on conflict (id) do nothing;

drop policy if exists "gen_read_public" on storage.objects;
drop policy if exists "gen_read_own_or_public" on storage.objects;
drop policy if exists "gen_insert_own" on storage.objects;
drop policy if exists "gen_delete_own" on storage.objects;

create policy "gen_read_own_or_public" on storage.objects for select using (
  bucket_id = 'generations' and (
    auth.uid()::text = (storage.foldername(name))[1]
    or exists (
      select 1 from public.generated_images gi
      where gi.storage_path = name and gi.is_public = true
    )
  )
);

create policy "gen_insert_own" on storage.objects for insert with check (
  bucket_id = 'generations' and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "gen_delete_own" on storage.objects for delete using (
  bucket_id = 'generations' and auth.uid()::text = (storage.foldername(name))[1]
);