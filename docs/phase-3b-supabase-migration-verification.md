# Phase 3B Supabase Migration Verification

This phase prepares a manual Supabase migration and verification workflow for elara. It does not add auth, admin CRUD, payment, or write operations.

## 1. Create Or Open A Supabase Project

1. Sign in to Supabase in your browser.
2. Create a new project or open the project intended for elara.
3. Keep the project dashboard open.
4. Do not copy service role keys into frontend code.
5. Do not paste secrets into terminal output, chat, docs, or screenshots.

## 2. Run The Migration Manually

1. In Supabase, open the SQL Editor.
2. Open the local migration file:
   `supabase/migrations/001_elara_v1_schema.sql`
3. Copy the full SQL file contents.
4. Paste the SQL into the Supabase SQL Editor.
5. Review the SQL before running it.
6. Run the SQL once.
7. Confirm there are no SQL execution errors.

If the SQL is rerun, the seed collection insert is conflict-safe by slug, but table creation statements are not intended to be repeatedly applied to the same database after a successful run.

## 3. Environment Variables Needed Later

When the project is ready for local read-only testing, add these manually to local environment configuration:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Important reminders:

- Do not commit `.env.local`.
- Do not paste service role keys into the frontend.
- Do not expose secrets in terminal output or docs.
- Only the public anon key belongs in the browser-side app.

## 4. Verification Checklist

### Tables

Confirm all 10 tables exist:

- `collections`
- `products`
- `product_images`
- `product_tags`
- `orders`
- `order_items`
- `custom_necklace_items`
- `custom_necklace_charms`
- `inventory_movements`
- `admin_activity_logs`

### RLS

Confirm RLS is enabled on every table. Production policies are intentionally deferred to the auth/admin phase.

Because RLS is enabled, public anon reads may need read policies before the storefront can read live data directly. Until those are added, the app should fall back safely to mock data or show safe admin diagnostics warnings.

### Seed Collections

Confirm these seed collections exist:

- Ocean Collection / `ocean-collection`
- Dainty Collection / `dainty-collection`
- Gem Collection / `gem-collection`
- Charm Bar / `charm-bar`
- New Arrivals / `new-arrivals`
- Best Sellers / `best-sellers`

### Indexes And Triggers

Confirm the expected indexes exist for:

- collection slugs
- product slugs
- product collection/type/active state
- order number/status/created date
- order item order references
- inventory movement product/order references

Confirm `set_updated_at()` exists and is applied to:

- `collections`
- `products`
- `orders`

### Storefront

Confirm the storefront still loads after env vars are added manually.

Confirm the admin data source note changes:

- Before env vars: `Mock fallback`
- After env vars: `Supabase configured`

Confirm the admin System status section shows:

- Supabase configured: Yes
- collection count
- product count
- order count
- seeded collections, when readable through current RLS policies
- safe warnings if reads are blocked or unavailable

### Catalog Query

Confirm the collection query returns seeded collections once the database is readable by the configured anon client. If RLS blocks the read, keep the fallback behavior in place and add read policies in the later auth/admin policy phase.

## 5. Suggested SQL Editor Checks

Run these in the Supabase SQL Editor, not in the frontend:

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
order by table_name;
```

```sql
select relname, relrowsecurity
from pg_class
where relname in (
  'collections',
  'products',
  'product_images',
  'product_tags',
  'orders',
  'order_items',
  'custom_necklace_items',
  'custom_necklace_charms',
  'inventory_movements',
  'admin_activity_logs'
)
order by relname;
```

```sql
select name, slug
from public.collections
order by sort_order, name;
```

```sql
select trigger_name, event_object_table
from information_schema.triggers
where trigger_schema = 'public'
order by event_object_table, trigger_name;
```

## 6. Pass Criteria

Phase 3B is complete when:

- the migration can be applied manually,
- all schema objects are verified in Supabase,
- seed collections exist,
- the local app still builds,
- the admin System status reports mock fallback without env vars,
- and the admin System status reports Supabase configured after env vars are manually added.
