-- elara. customized engraved request records
-- Public customers may submit inquiry requests only.
-- Requests remain private; active admin profile users can read and manage them.

create table if not exists public.customized_engraved_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  status text not null default 'new',
  full_name text not null,
  contact_method text not null,
  contact_details text not null,
  purpose_or_occasion text,
  piece_type text not null,
  pendant_shape text,
  chain_option text,
  quantity text not null,
  customization_type text not null,
  engraving_text text,
  font_preference text,
  design_reference_link text,
  needed_by_date date not null,
  delivery_or_pickup_location text,
  additional_notes text,
  constraint customized_engraved_requests_status_check check (
    status in (
      'new',
      'contacted',
      'in_discussion',
      'confirmed',
      'declined',
      'completed'
    )
  )
);

drop trigger if exists set_customized_engraved_requests_updated_at
on public.customized_engraved_requests;

create trigger set_customized_engraved_requests_updated_at
before update on public.customized_engraved_requests
for each row
execute function public.set_updated_at();

alter table public.customized_engraved_requests enable row level security;

grant insert on public.customized_engraved_requests to anon, authenticated;
grant select, update, delete on public.customized_engraved_requests to authenticated;

create policy "Public can submit customized engraved requests"
on public.customized_engraved_requests
for insert
to anon, authenticated
with check (true);

create policy "Active admins can read customized engraved requests"
on public.customized_engraved_requests
for select
to authenticated
using (
  exists (
    select 1
    from public.admin_profiles
    where admin_profiles.user_id = auth.uid()
      and admin_profiles.is_active = true
      and admin_profiles.role in ('owner', 'admin', 'staff')
  )
);

create policy "Active admins can update customized engraved requests"
on public.customized_engraved_requests
for update
to authenticated
using (
  exists (
    select 1
    from public.admin_profiles
    where admin_profiles.user_id = auth.uid()
      and admin_profiles.is_active = true
      and admin_profiles.role in ('owner', 'admin', 'staff')
  )
)
with check (
  exists (
    select 1
    from public.admin_profiles
    where admin_profiles.user_id = auth.uid()
      and admin_profiles.is_active = true
      and admin_profiles.role in ('owner', 'admin', 'staff')
  )
);

create policy "Active admins can delete customized engraved requests"
on public.customized_engraved_requests
for delete
to authenticated
using (
  exists (
    select 1
    from public.admin_profiles
    where admin_profiles.user_id = auth.uid()
      and admin_profiles.is_active = true
      and admin_profiles.role in ('owner', 'admin', 'staff')
  )
);

comment on table public.customized_engraved_requests
is 'Private request/inquiry records for bulk customized engraved/photo/text pieces.';

comment on policy "Public can submit customized engraved requests"
on public.customized_engraved_requests
is 'Allows storefront customers to insert request rows only. No public select/update/delete access is granted.';

comment on policy "Active admins can read customized engraved requests"
on public.customized_engraved_requests
is 'Active admin profile users can read private customized engraved inquiries in protected admin screens.';

comment on policy "Active admins can update customized engraved requests"
on public.customized_engraved_requests
is 'Active admin profile users can update request status and details.';

comment on policy "Active admins can delete customized engraved requests"
on public.customized_engraved_requests
is 'Active admin profile users can delete inquiry records when needed.';
