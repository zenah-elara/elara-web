-- elara. product Finish / Color variants
-- Variants are optional. Existing products, images, orders, and product-level
-- inventory continue to work when variant_id is null.

alter table public.products
add column if not exists has_variants boolean not null default false;

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  finish text,
  color text,
  stock_quantity integer not null default 0,
  price_override numeric(10,2),
  material_type_override text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_variants_option_check check (
    nullif(btrim(finish), '') is not null
    or nullif(btrim(color), '') is not null
  ),
  constraint product_variants_stock_check check (stock_quantity >= 0),
  constraint product_variants_price_check check (
    price_override is null or price_override >= 0
  ),
  constraint product_variants_material_check check (
    material_type_override is null
    or material_type_override in ('gold_plated', 'stainless_steel')
  )
);

create unique index if not exists product_variants_unique_combination_idx
on public.product_variants (
  product_id,
  coalesce(lower(btrim(finish)), ''),
  coalesce(lower(btrim(color)), '')
);

create index if not exists product_variants_product_id_idx
on public.product_variants(product_id);

drop trigger if exists set_product_variants_updated_at on public.product_variants;
create trigger set_product_variants_updated_at
before update on public.product_variants
for each row execute function public.set_updated_at();

alter table public.product_images
add column if not exists variant_id uuid references public.product_variants(id) on delete cascade;

alter table public.order_items
add column if not exists variant_id uuid references public.product_variants(id) on delete set null,
add column if not exists selected_finish text,
add column if not exists selected_color text;

alter table public.inventory_movements
add column if not exists variant_id uuid references public.product_variants(id) on delete set null;

create index if not exists product_images_variant_id_idx on public.product_images(variant_id);
create index if not exists order_items_variant_id_idx on public.order_items(variant_id);
create index if not exists inventory_movements_variant_id_idx on public.inventory_movements(variant_id);

alter table public.product_variants enable row level security;
grant select on public.product_variants to anon, authenticated;
grant insert, update, delete on public.product_variants to authenticated;

create policy "Public can read visible product variants"
on public.product_variants
for select
to anon, authenticated
using (
  is_active = true
  and exists (
    select 1 from public.products
    where products.id = product_variants.product_id
      and products.is_active = true
      and (
        products.product_type in ('chain', 'charm', 'mini_charm', 'connector', 'pendant')
        or products.collection_id is null
        or exists (
          select 1 from public.collections
          where collections.id = products.collection_id
            and collections.is_published = true
        )
      )
  )
);

create policy "Active admins can manage product variants"
on public.product_variants
for all
to authenticated
using (
  exists (
    select 1 from public.admin_profiles
    where admin_profiles.user_id = auth.uid()
      and admin_profiles.is_active = true
      and admin_profiles.role in ('owner', 'admin', 'staff')
  )
)
with check (
  exists (
    select 1 from public.admin_profiles
    where admin_profiles.user_id = auth.uid()
      and admin_profiles.is_active = true
      and admin_profiles.role in ('owner', 'admin', 'staff')
  )
);

drop policy if exists "Public can read images for visible products" on public.product_images;
create policy "Public can read images for visible products"
on public.product_images
for select
to anon, authenticated
using (
  (variant_id is null or exists (
    select 1 from public.product_variants
    where product_variants.id = product_images.variant_id
      and product_variants.is_active = true
  ))
  and exists (
    select 1 from public.products
    where products.id = product_images.product_id
      and products.is_active = true
      and (
        products.product_type in ('chain', 'charm', 'mini_charm', 'connector', 'pendant')
        or products.collection_id is null
        or exists (
          select 1 from public.collections
          where collections.id = products.collection_id
            and collections.is_published = true
        )
      )
  )
);

create or replace function public.update_order_status_inventory(
  p_order_id uuid,
  p_next_status text,
  p_internal_notes text default null
)
returns table(success boolean, message text)
language plpgsql
security invoker
as $$
declare
  v_order public.orders%rowtype;
  v_required record;
  v_previous_stock integer;
  v_new_stock integer;
begin
  if not exists (
    select 1 from public.admin_profiles
    where user_id = auth.uid() and is_active = true
      and role in ('owner', 'admin', 'staff')
  ) then
    return query select false, 'Only active admins can update order status.';
    return;
  end if;

  if p_next_status not in ('new','contacted','confirmed','paid','packed','delivered','cancelled') then
    return query select false, 'Invalid order status.';
    return;
  end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if v_order.id is null then
    return query select false, 'Order was not found.';
    return;
  end if;
  if v_order.status = 'cancelled' and p_next_status <> 'cancelled' then
    return query select false, 'Cancelled orders cannot be reopened in V1. Create a new order request instead.';
    return;
  end if;
  if p_next_status = 'cancelled' and v_order.status = 'cancelled' then
    update public.orders set internal_notes = p_internal_notes where id = p_order_id;
    return query select true, 'Order is already cancelled.';
    return;
  end if;

  if p_next_status = 'confirmed' and v_order.stock_deducted_at is null then
    for v_required in
      select oi.variant_id, max(oi.item_name) product_name,
        sum(oi.quantity)::integer quantity, max(pv.stock_quantity) stock_quantity
      from public.order_items oi
      join public.product_variants pv on pv.id = oi.variant_id
      where oi.order_id = p_order_id and oi.variant_id is not null
      group by oi.variant_id
    loop
      if v_required.stock_quantity < v_required.quantity then
        return query select false, format('Cannot confirm order. Not enough stock for %s.', v_required.product_name);
        return;
      end if;
    end loop;

    for v_required in
      with raw_requirements as (
        select product_id, item_name product_name, quantity
        from public.order_items
        where order_id = p_order_id and item_type <> 'custom_necklace' and variant_id is null
        union all
        select cni.chain_product_id, cni.chain_name, 1
        from public.order_items oi join public.custom_necklace_items cni on cni.order_item_id = oi.id
        where oi.order_id = p_order_id and oi.item_type = 'custom_necklace'
        union all
        select cnc.charm_product_id, cnc.charm_name, cnc.quantity
        from public.order_items oi
        join public.custom_necklace_items cni on cni.order_item_id = oi.id
        join public.custom_necklace_charms cnc on cnc.custom_necklace_item_id = cni.id
        where oi.order_id = p_order_id and oi.item_type = 'custom_necklace'
      )
      select rr.product_id, max(rr.product_name) product_name,
        sum(rr.quantity)::integer quantity, max(p.stock_quantity) stock_quantity
      from raw_requirements rr left join public.products p on p.id = rr.product_id
      where rr.product_id is not null group by rr.product_id
    loop
      if v_required.stock_quantity is null or v_required.stock_quantity < v_required.quantity then
        return query select false, format('Cannot confirm order. Not enough stock for %s.', v_required.product_name);
        return;
      end if;
    end loop;

    for v_required in
      select variant_id, max(product_id::text)::uuid product_id, sum(quantity)::integer quantity
      from public.order_items
      where order_id = p_order_id and variant_id is not null group by variant_id
    loop
      select stock_quantity into v_previous_stock from public.product_variants where id = v_required.variant_id for update;
      v_new_stock = v_previous_stock - v_required.quantity;
      update public.product_variants set stock_quantity = v_new_stock where id = v_required.variant_id;
      insert into public.inventory_movements(product_id, variant_id, order_id, movement_type, quantity_change, previous_stock, new_stock, reason)
      values(v_required.product_id, v_required.variant_id, p_order_id, 'order_confirmed', -v_required.quantity, v_previous_stock, v_new_stock, 'Variant stock deducted when order was confirmed');
    end loop;

    for v_required in
      with raw_requirements as (
        select product_id, quantity from public.order_items
        where order_id = p_order_id and item_type <> 'custom_necklace' and variant_id is null
        union all
        select cni.chain_product_id, 1 from public.order_items oi join public.custom_necklace_items cni on cni.order_item_id = oi.id
        where oi.order_id = p_order_id and oi.item_type = 'custom_necklace'
        union all
        select cnc.charm_product_id, cnc.quantity from public.order_items oi
        join public.custom_necklace_items cni on cni.order_item_id = oi.id
        join public.custom_necklace_charms cnc on cnc.custom_necklace_item_id = cni.id
        where oi.order_id = p_order_id and oi.item_type = 'custom_necklace'
      ) select product_id, sum(quantity)::integer quantity from raw_requirements
      where product_id is not null group by product_id
    loop
      select stock_quantity into v_previous_stock from public.products where id = v_required.product_id for update;
      v_new_stock = v_previous_stock - v_required.quantity;
      update public.products set stock_quantity = v_new_stock where id = v_required.product_id;
      insert into public.inventory_movements(product_id, order_id, movement_type, quantity_change, previous_stock, new_stock, reason)
      values(v_required.product_id, p_order_id, 'order_confirmed', -v_required.quantity, v_previous_stock, v_new_stock, 'Stock deducted when order was confirmed');
    end loop;

    update public.orders set status='confirmed', internal_notes=p_internal_notes,
      confirmed_at=coalesce(confirmed_at,now()), stock_deducted_at=now()
    where id=p_order_id;
    return query select true, 'Order confirmed and stock deducted.';
    return;
  end if;

  if p_next_status = 'cancelled' and v_order.stock_deducted_at is not null then
    for v_required in
      select variant_id, max(product_id::text)::uuid product_id, sum(quantity)::integer quantity
      from public.order_items where order_id=p_order_id and variant_id is not null group by variant_id
    loop
      select stock_quantity into v_previous_stock from public.product_variants where id=v_required.variant_id for update;
      if v_previous_stock is not null then
        v_new_stock = v_previous_stock + v_required.quantity;
        update public.product_variants set stock_quantity=v_new_stock where id=v_required.variant_id;
        insert into public.inventory_movements(product_id, variant_id, order_id, movement_type, quantity_change, previous_stock, new_stock, reason)
        values(v_required.product_id, v_required.variant_id, p_order_id, 'order_cancelled_restore', v_required.quantity, v_previous_stock, v_new_stock, 'Variant stock restored when confirmed order was cancelled');
      end if;
    end loop;

    for v_required in
      with raw_requirements as (
        select product_id, quantity from public.order_items where order_id=p_order_id and item_type<>'custom_necklace' and variant_id is null
        union all
        select cni.chain_product_id, 1 from public.order_items oi join public.custom_necklace_items cni on cni.order_item_id=oi.id where oi.order_id=p_order_id and oi.item_type='custom_necklace'
        union all
        select cnc.charm_product_id, cnc.quantity from public.order_items oi join public.custom_necklace_items cni on cni.order_item_id=oi.id join public.custom_necklace_charms cnc on cnc.custom_necklace_item_id=cni.id where oi.order_id=p_order_id and oi.item_type='custom_necklace'
      ) select product_id, sum(quantity)::integer quantity from raw_requirements where product_id is not null group by product_id
    loop
      select stock_quantity into v_previous_stock from public.products where id=v_required.product_id for update;
      if v_previous_stock is not null then
        v_new_stock = v_previous_stock + v_required.quantity;
        update public.products set stock_quantity=v_new_stock where id=v_required.product_id;
        insert into public.inventory_movements(product_id, order_id, movement_type, quantity_change, previous_stock, new_stock, reason)
        values(v_required.product_id, p_order_id, 'order_cancelled_restore', v_required.quantity, v_previous_stock, v_new_stock, 'Stock restored when confirmed order was cancelled');
      end if;
    end loop;
  end if;

  update public.orders set status=p_next_status, internal_notes=p_internal_notes,
    confirmed_at=case when p_next_status='confirmed' then coalesce(confirmed_at,now()) else confirmed_at end,
    cancelled_at=case when p_next_status='cancelled' then coalesce(cancelled_at,now()) else cancelled_at end
  where id=p_order_id;

  if p_next_status='cancelled' and v_order.stock_deducted_at is not null then
    return query select true, 'Order cancelled and stock restored.';
  elsif p_next_status='cancelled' then
    return query select true, 'Order cancelled. No stock was restored because stock had not been deducted.';
  end if;
  return query select true, 'Order status updated.';
end;
$$;

comment on table public.product_variants is 'Optional sellable Finish and/or Color combinations with independent stock, price, material, and active state.';
comment on column public.product_images.variant_id is 'Null for shared product images; set for images belonging to one exact variant.';
comment on column public.order_items.variant_id is 'Selected sellable variant. Null for non-variant products and legacy orders.';
