-- READ ONLY. Run in Supabase SQL Editor. No stock changes or customer contacts.
-- Return each result set to investigate actual live configuration and deployed RPC.

-- 1. Current inventory mode and all product configuration (no customer data).
select p.* from public.products p
where lower(p.name) = 'marina necklace';

-- 2. Exact variant IDs and stored quantities. Never infer physical stock from these.
select pv.* from public.product_variants pv
join public.products p on p.id = pv.product_id
where lower(p.name) = 'marina necklace';

-- 3. Size rows may be retained for historical movement references.
-- Their existence alone must NOT route custom-only products to preset inventory.
select psi.*, p.size_length_behavior,
  case when p.size_length_behavior = 'custom'
    then 'Historical/non-authoritative for custom-only mode'
    else 'Compare size_label with current size_options' end as interpretation
from public.product_size_inventory psi
join public.products p on p.id = psi.product_id
where lower(p.name) = 'marina necklace';

-- 4. Recent order lines: custom length is selected_custom_length in this schema.
select oi.id as order_item_id, oi.order_id, o.status, o.stock_deducted_at,
  oi.product_id, oi.variant_id, oi.quantity, oi.selected_finish, oi.selected_color,
  oi.selected_size, oi.selected_size_label, oi.selected_custom_length,
  oi.selected_custom_length_label
from public.order_items oi
join public.products p on p.id = oi.product_id
join public.orders o on o.id = oi.order_id
where lower(p.name) = 'marina necklace'
order by o.created_at desc, oi.id limit 50;

-- 5. Recorded source and arithmetic. 023 can record 20->19 correctly and THEN
-- overwrite both variants to zero without recording that refresh as a movement.
-- Current stock can also differ after subsequent orders/manual edits; inspect history.
select im.id, im.order_id, im.product_id, im.variant_id, im.size_inventory_id,
  im.movement_type, im.quantity_change, im.previous_stock, im.new_stock,
  im.reason, im.created_at, pv.stock_quantity as current_variant_stock
from public.inventory_movements im
join public.products p on p.id = im.product_id
left join public.product_variants pv on pv.id = im.variant_id
where lower(p.name) = 'marina necklace'
order by im.created_at desc limit 100;

-- 6. Inspect ACTUAL deployed function, not just local migration files.
select pg_get_functiondef(to_regprocedure(
  'public.update_order_status_inventory(uuid,text,text)')) as deployed_rpc;

-- 7. Detect any additional live triggers that could overwrite stock.
select c.relname as table_name, t.tgname,
  pg_get_triggerdef(t.oid) as trigger_definition,
  pg_get_functiondef(t.tgfoid) as trigger_function
from pg_trigger t
join pg_class c on c.oid = t.tgrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and not t.tgisinternal
  and c.relname in ('products','product_variants','product_size_inventory','orders');
