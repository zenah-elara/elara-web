# Phase 4A Admin Auth Foundation

This phase adds the first Supabase email/password authentication foundation for
the elara. admin area.

## What Was Added

- Installed the modern `@supabase/ssr` package for cookie-aware Supabase auth.
- Updated Supabase browser and server client helpers.
- Added guarded auth query helpers:
  - `getCurrentUser()`
  - `getCurrentSession()`
  - `requireAdminUser()`
- Added server auth actions:
  - `signInWithEmailPassword(email, password)`
  - `signInWithEmailPasswordAction(formData)`
  - `signOut()`
- Added a public admin login route at `/admin/login`.
- Moved the dashboard route into a protected admin route group.
- Added a simple sign-out control inside the protected admin area.

## Required Env Vars

These are required locally and in deployment before admin login can work:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Do not commit `.env.local`.

Do not paste service role keys into frontend env vars. This phase uses the
Supabase anon key only.

Do not expose env values in terminal output, docs, or UI.

## Current Limitation

For Phase 4A, any authenticated Supabase user can access the admin dashboard.

This is intentional for the first auth foundation. Phase 4B should replace this
with stricter admin role/profile authorization before any write CRUD is added.

## Route Behavior

- Public storefront routes remain public.
- `/admin/login` is public.
- `/admin` is protected.
- Future protected admin pages should be placed inside the protected admin route
  group so they inherit the same `requireAdminUser()` guard.

## Manual Test Checklist

- Public storefront still loads.
- Visiting `/admin` while logged out redirects to `/admin/login`.
- `/admin/login` shows the disconnected message if Supabase env vars are not
  configured.
- `/admin/login` shows a safe error for invalid credentials.
- Supabase email/password login works with a valid user.
- Authenticated users can access `/admin`.
- Sign out returns the user to `/admin/login`.
- No env values or secrets are shown anywhere.

## Next Phase

Phase 4B: Admin role/profile authorization.

Then Phase 4C: Admin collections/products CRUD with image upload.
