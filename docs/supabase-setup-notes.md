# Supabase Setup Notes

Phase 3A adds Supabase client structure and read-only catalog queries, but the app still works without a live Supabase project.

## Environment Variables Needed Later

When Supabase is ready, add these to local environment configuration:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Do not commit `.env.local` or any file containing real Supabase keys.

## Fallback Mode

The app checks whether both public Supabase variables are present. If either is missing, catalog queries return the existing mock data from `src/lib/data.ts`.

If Supabase is configured but a read query fails, the query logs a safe warning and returns mock data instead. Customers should not see raw database errors.

The admin placeholder displays one subtle status note:

- `Data source: Supabase configured`
- `Data source: Mock fallback`

It never displays actual environment values.

## Query Functions Added

The read-only catalog layer lives in `src/features/catalog/queries.ts` and includes:

- `getCollections()`
- `getActiveCollections()`
- `getCollectionBySlug(slug)`
- `getProducts()`
- `getActiveProducts()`
- `getFeaturedProducts()`
- `getNewArrivalProducts()`
- `getProductsByCollectionSlug(slug)`
- `getProductBySlug(slug)`
- `getBuilderChains()`
- `getBuilderCharmsAndPendants()`

These functions normalize Supabase rows into the same storefront-friendly shapes currently used by the mock data.

## Supabase Client Files

- `src/lib/supabase/client.ts`: guarded browser client helper.
- `src/lib/supabase/server.ts`: guarded server component client helper.
- `src/lib/supabase/types.ts`: lightweight database table types for the Phase 2 schema.

## After The Migration Is Applied

1. Apply `supabase/migrations/001_elara_v1_schema.sql` manually in the Supabase project.
2. Confirm the six seeded collections exist.
3. Add a few active test products, product images, and tags.
4. Set the public Supabase env vars locally.
5. Restart the Next.js dev server.
6. Verify storefront pages load Supabase data.
7. Keep mock fallback available for local development and failed read queries.

## Next Work

Phase 3B should apply and verify the migration, then implement admin collection/product CRUD with image upload. Production auth and RLS policies should be added before admin writes are exposed.
