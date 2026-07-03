-- elara. Phase 4B admin profile authorization
-- This table limits admin access to authenticated users with an active admin profile.
-- Admin profile records should be created manually in Supabase for now.
-- Product/collection admin CRUD policies are intentionally deferred.

create table public.admin_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'admin',
  display_name text,
  is_active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint admin_profiles_role_check check (role in ('owner', 'admin', 'staff'))
);

create index admin_profiles_user_id_idx on public.admin_profiles(user_id);
create index admin_profiles_is_active_idx on public.admin_profiles(is_active);

create trigger set_admin_profiles_updated_at
before update on public.admin_profiles
for each row
execute function public.set_updated_at();

alter table public.admin_profiles enable row level security;

grant select on public.admin_profiles to authenticated;

create policy "Admins can read own active profile"
on public.admin_profiles
for select
to authenticated
using (
  auth.uid() = user_id
  and is_active = true
);

comment on table public.admin_profiles
is 'Manual admin authorization profiles. Create records only for Supabase users who should access the admin area.';

comment on policy "Admins can read own active profile"
on public.admin_profiles
is 'Authenticated users can read only their own active admin profile. There is no anon access and no public write access.';
