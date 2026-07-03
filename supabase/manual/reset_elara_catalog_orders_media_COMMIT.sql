-- ============================================================
-- elara. destructive catalog/order/media reset - COMMIT VERSION
-- ============================================================
-- Purpose:
--   Permanently remove existing demo/test/live catalog, order, request, and
--   content-media rows so elara. can begin entering real product and catalog
--   information.
--
-- DANGER:
--   This file ends with COMMIT. Running it will permanently delete the rows
--   listed below from the connected Supabase project.
--
-- Safer preview:
--   Run supabase/manual/reset_elara_catalog_orders_media.sql first. That file
--   ends with ROLLBACK so you can review counts before committing deletion.
--
-- This script preserves:
--   - schema, migrations, functions, triggers, indexes, RLS, and policies
--   - admin_profiles
--   - Supabase auth.users
--   - storage buckets themselves
--   - app/admin access and table structures
--
-- This script removes rows from:
--   - custom necklace order details
--   - order items and orders
--   - inventory movements
--   - product images, product tags, products
--   - collections
--   - customized engraved requests, if the table exists
--   - site_assets, if the table exists
--
-- Optional storage metadata cleanup is included near the bottom but commented
-- out. Do not delete storage buckets.

begin;

-- ------------------------------------------------------------
-- Preview counts before deletion.
-- ------------------------------------------------------------
do $$
declare
  table_name text;
  table_names text[] := array[
    'public.custom_necklace_charms',
    'public.custom_necklace_items',
    'public.order_items',
    'public.inventory_movements',
    'public.orders',
    'public.product_images',
    'public.product_tags',
    'public.products',
    'public.collections',
    'public.customized_engraved_requests',
    'public.site_assets'
  ];
  row_count bigint;
begin
  raise notice 'elara reset COMMIT: counts before deletion';

  foreach table_name in array table_names loop
    if to_regclass(table_name) is not null then
      execute format('select count(*) from %s', table_name) into row_count;
      raise notice '%: % row(s)', table_name, row_count;
    else
      raise notice '%: table not found, skipped', table_name;
    end if;
  end loop;

  if to_regclass('storage.objects') is not null then
    execute $storage_count$
      select count(*)
      from storage.objects
      where bucket_id in ('product-images', 'collection-images', 'site-assets')
    $storage_count$ into row_count;
    raise notice 'storage.objects in product-images/collection-images/site-assets: % row(s)', row_count;
  else
    raise notice 'storage.objects: table not found, skipped';
  end if;
end $$;

-- ------------------------------------------------------------
-- Delete child/dependent data before parent data.
-- ------------------------------------------------------------
delete from public.custom_necklace_charms;
delete from public.custom_necklace_items;
delete from public.order_items;
delete from public.inventory_movements;
delete from public.orders;

delete from public.product_images;
delete from public.product_tags;
delete from public.products;
delete from public.collections;

-- Optional/content-only tables added in later phases.
do $$
begin
  if to_regclass('public.customized_engraved_requests') is not null then
    execute 'delete from public.customized_engraved_requests';
  end if;

  if to_regclass('public.site_assets') is not null then
    execute 'delete from public.site_assets';
  end if;
end $$;

-- ------------------------------------------------------------
-- Reset identity sequences where applicable.
-- Current elara. core tables use UUID primary keys, so there are no identity
-- counters to reset for those tables. This block is intentionally defensive for
-- any future identity columns that may be added to reset-target tables.
-- ------------------------------------------------------------
do $$
declare
  record_row record;
begin
  for record_row in
    select
      table_schema,
      table_name,
      column_name
    from information_schema.columns
    where table_schema = 'public'
      and table_name in (
        'custom_necklace_charms',
        'custom_necklace_items',
        'order_items',
        'inventory_movements',
        'orders',
        'product_images',
        'product_tags',
        'products',
        'collections',
        'customized_engraved_requests',
        'site_assets'
      )
      and identity_generation is not null
  loop
    execute format(
      'alter table %I.%I alter column %I restart with 1',
      record_row.table_schema,
      record_row.table_name,
      record_row.column_name
    );
  end loop;
end $$;

-- ------------------------------------------------------------
-- Counts after deletion, before COMMIT.
-- These should be zero for reset-target tables.
-- ------------------------------------------------------------
do $$
declare
  table_name text;
  table_names text[] := array[
    'public.custom_necklace_charms',
    'public.custom_necklace_items',
    'public.order_items',
    'public.inventory_movements',
    'public.orders',
    'public.product_images',
    'public.product_tags',
    'public.products',
    'public.collections',
    'public.customized_engraved_requests',
    'public.site_assets'
  ];
  row_count bigint;
begin
  raise notice 'elara reset COMMIT: counts after deletion, before commit';

  foreach table_name in array table_names loop
    if to_regclass(table_name) is not null then
      execute format('select count(*) from %s', table_name) into row_count;
      raise notice '%: % row(s)', table_name, row_count;
    end if;
  end loop;
end $$;

-- ------------------------------------------------------------
-- Optional Supabase Storage metadata cleanup.
-- ------------------------------------------------------------
-- The deletes above remove database rows that reference images/media, but they
-- do not remove object metadata from Supabase Storage.
--
-- If you also want to remove uploaded files, review this section carefully and
-- uncomment it only when you are sure these buckets contain reset/demo media.
-- This deletes storage object metadata only for the named buckets and does not
-- delete the buckets themselves.
--
-- Preview optional storage cleanup:
-- select bucket_id, count(*) as object_count
-- from storage.objects
-- where bucket_id in ('product-images', 'collection-images', 'site-assets')
-- group by bucket_id
-- order by bucket_id;
--
-- Optional deletion:
-- delete from storage.objects
-- where bucket_id in ('product-images', 'collection-images', 'site-assets');

commit;
