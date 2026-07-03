# Manual Supabase Smoke Test

Use this checklist after Phase 3B changes. These tests are manual and read-only.

## Test 1: No Env Vars

1. Ensure local Supabase env vars are not configured.
2. Run `npm run build`.
3. Open the app locally.
4. Visit `/admin`.
5. Confirm the admin page shows `Data source: Mock fallback`.
6. Confirm the System status message says mock fallback is being used.
7. Confirm the storefront still shows the mock elara. collections and products.

Expected result: the app builds and runs without a live Supabase project.

## Test 2: Env Vars Added Manually

1. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` manually to local env configuration.
2. Do not commit `.env.local`.
3. Restart the Next.js dev server.
4. Visit `/admin`.
5. Confirm the page shows `Data source: Supabase configured`.
6. Confirm the System status section says Supabase is configured.

Expected result: the app recognizes Supabase configuration without displaying env values.

## Test 3: Collections Page With Seed Data

1. Apply `supabase/migrations/001_elara_v1_schema.sql` in Supabase.
2. Confirm seed collections exist in the Supabase SQL Editor.
3. Visit `/collections`.
4. Confirm collections load.

Expected result: seeded collections appear once the database is readable by the configured anon client. If RLS blocks reads, the app should keep using mock fallback or show safe warnings instead of exposing raw errors.

## Test 4: Product Pages Before Live Products Exist

1. Leave the `products` table empty.
2. Visit the home page and a mock product route such as `/products/pink-heart-charm-necklace`.
3. Confirm the page still renders through mock fallback.

Expected result: product pages remain usable even before live products are added.

## Test 5: No Writes Available

1. Visit `/admin`.
2. Visit `/checkout`.
3. Visit `/cart`.
4. Confirm there are no working admin CRUD forms, payment flows, or order submission writes.

Expected result: Phase 3B remains verification-only and read-only.

## Test 6: Safe Warning Behavior

1. Configure Supabase env vars.
2. Keep RLS enabled without read policies, or temporarily point to a project without the migration.
3. Visit `/admin`.
4. Confirm any warning is short and safe.
5. Confirm no secrets, raw env values, service keys, or full database error payloads are displayed.

Expected result: failures are customer-safe and developer-readable.
