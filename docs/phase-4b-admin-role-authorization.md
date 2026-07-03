# Phase 4B Admin Role Authorization

This phase adds an `admin_profiles` authorization layer for the elara. admin
area.

## What `admin_profiles` Does

`admin_profiles` links a Supabase Auth user to an active admin role:

- `owner`
- `admin`
- `staff`

Only authenticated users with their own active admin profile can access
`/admin`.

## Why This Is Safer

Phase 4A allowed any authenticated Supabase user into the admin area. Phase 4B
narrows access so a user must also have an active row in
`public.admin_profiles`.

This keeps storefront browsing public while preventing ordinary authenticated
accounts from accessing admin screens.

## Manual First-Admin Setup

After running the migration, create the first admin profile manually in Supabase.

1. Open Supabase.
2. Go to **Authentication > Users**.
3. Find the user who should be the first admin.
4. Copy that user's `id`.
5. Open the SQL Editor.
6. Insert a profile using placeholders like this:

```sql
insert into public.admin_profiles (user_id, email, role, display_name)
values ('USER_ID_HERE', 'email@example.com', 'owner', 'Your Name');
```

Do not use real secrets in docs or terminal output. Do not use a service role key
in the frontend.

## RLS Behavior

RLS is enabled on `public.admin_profiles`.

The only read policy allows authenticated users to select their own active admin
profile:

```sql
auth.uid() = user_id and is_active = true
```

There is no anon access. There are no public insert, update, or delete policies.
Admin profile records should be managed manually in Supabase for now.

## Manual Test Checklist

- Unauthenticated `/admin` redirects to `/admin/login`.
- Authenticated user without an `admin_profiles` row cannot access `/admin`.
- Authenticated user with an active `admin_profiles` row can access `/admin`.
- Authenticated user with `is_active = false` cannot access `/admin`.
- `/admin/login?error=unauthorized` shows a safe unauthorized message.
- Storefront routes remain public.

## Next Phase

Phase 4C: Admin collections/products CRUD with image upload.
