-- elara. Phase 4E order status and inventory workflow
-- Customers create order requests only. Stock is deducted by an active admin
-- when an order is marked confirmed, and restored only when a confirmed order
-- is cancelled. Public users do not receive inventory or order read/write access.

grant select on public.custom_necklace_items to authenticated;
grant select on public.custom_necklace_charms to authenticated;
grant select, insert on public.inventory_movements to authenticated;

create policy "Active admins can read custom necklace order items"
on public.custom_necklace_items
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

create policy "Active admins can read custom necklace charms"
on public.custom_necklace_charms
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

create policy "Active admins can read inventory movements"
on public.inventory_movements
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

create policy "Active admins can insert inventory movements"
on public.inventory_movements
for insert
to authenticated
with check (
  exists (
    select 1
    from public.admin_profiles
    where admin_profiles.user_id = auth.uid()
      and admin_profiles.is_active = true
      and admin_profiles.role in ('owner', 'admin', 'staff')
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
    select 1
    from public.admin_profiles
    where user_id = auth.uid()
      and is_active = true
      and role in ('owner', 'admin', 'staff')
  ) then
    return query select false, 'Only active admins can update order status.';
    return;
  end if;

  if p_next_status not in (
    'new',
    'contacted',
    'confirmed',
    'paid',
    'packed',
    'delivered',
    'cancelled'
  ) then
    return query select false, 'Invalid order status.';
    return;
  end if;

  select *
  into v_order
  from public.orders
  where id = p_order_id
  for update;

  if v_order.id is null then
    return query select false, 'Order was not found.';
    return;
  end if;

  if v_order.status = 'cancelled' and p_next_status <> 'cancelled' then
    return query select false, 'Cancelled orders cannot be reopened in V1. Create a new order request instead.';
    return;
  end if;

  if p_next_status = 'cancelled' and v_order.status = 'cancelled' then
    update public.orders
    set internal_notes = p_internal_notes
    where id = p_order_id;

    return query select true, 'Order is already cancelled.';
    return;
  end if;

  if p_next_status = 'confirmed' and v_order.stock_deducted_at is null then
    for v_required in
      with raw_requirements as (
        select
          order_items.product_id,
          order_items.item_name as product_name,
          order_items.quantity
        from public.order_items
        where order_items.order_id = p_order_id
          and order_items.item_type <> 'custom_necklace'

        union all

        select
          custom_necklace_items.chain_product_id as product_id,
          custom_necklace_items.chain_name as product_name,
          1 as quantity
        from public.order_items
        join public.custom_necklace_items
          on custom_necklace_items.order_item_id = order_items.id
        where order_items.order_id = p_order_id
          and order_items.item_type = 'custom_necklace'

        union all

        select
          custom_necklace_charms.charm_product_id as product_id,
          custom_necklace_charms.charm_name as product_name,
          custom_necklace_charms.quantity
        from public.order_items
        join public.custom_necklace_items
          on custom_necklace_items.order_item_id = order_items.id
        join public.custom_necklace_charms
          on custom_necklace_charms.custom_necklace_item_id = custom_necklace_items.id
        where order_items.order_id = p_order_id
          and order_items.item_type = 'custom_necklace'
      ),
      required_stock as (
        select
          raw_requirements.product_id,
          max(raw_requirements.product_name) as product_name,
          sum(raw_requirements.quantity)::integer as quantity
        from raw_requirements
        where raw_requirements.product_id is not null
        group by raw_requirements.product_id
      )
      select
        required_stock.product_id,
        coalesce(products.name, required_stock.product_name, 'Product') as product_name,
        products.stock_quantity,
        required_stock.quantity
      from required_stock
      left join public.products
        on products.id = required_stock.product_id
    loop
      if v_required.stock_quantity is null then
        return query select false, format('Cannot confirm order. Product %s was not found.', v_required.product_name);
        return;
      end if;

      if v_required.stock_quantity < v_required.quantity then
        return query select false, format(
          'Cannot confirm order. Not enough stock for %s. Available: %s, needed: %s.',
          v_required.product_name,
          v_required.stock_quantity,
          v_required.quantity
        );
        return;
      end if;
    end loop;

    for v_required in
      with raw_requirements as (
        select
          order_items.product_id,
          order_items.item_name as product_name,
          order_items.quantity
        from public.order_items
        where order_items.order_id = p_order_id
          and order_items.item_type <> 'custom_necklace'

        union all

        select
          custom_necklace_items.chain_product_id as product_id,
          custom_necklace_items.chain_name as product_name,
          1 as quantity
        from public.order_items
        join public.custom_necklace_items
          on custom_necklace_items.order_item_id = order_items.id
        where order_items.order_id = p_order_id
          and order_items.item_type = 'custom_necklace'

        union all

        select
          custom_necklace_charms.charm_product_id as product_id,
          custom_necklace_charms.charm_name as product_name,
          custom_necklace_charms.quantity
        from public.order_items
        join public.custom_necklace_items
          on custom_necklace_items.order_item_id = order_items.id
        join public.custom_necklace_charms
          on custom_necklace_charms.custom_necklace_item_id = custom_necklace_items.id
        where order_items.order_id = p_order_id
          and order_items.item_type = 'custom_necklace'
      )
      select
        raw_requirements.product_id,
        sum(raw_requirements.quantity)::integer as quantity
      from raw_requirements
      where raw_requirements.product_id is not null
      group by raw_requirements.product_id
    loop
      select stock_quantity
      into v_previous_stock
      from public.products
      where id = v_required.product_id
      for update;

      v_new_stock = v_previous_stock - v_required.quantity;

      if v_new_stock < 0 then
        return query select false, 'Cannot confirm order. Stock would become negative.';
        return;
      end if;

      update public.products
      set stock_quantity = v_new_stock
      where id = v_required.product_id;

      insert into public.inventory_movements (
        product_id,
        order_id,
        movement_type,
        quantity_change,
        previous_stock,
        new_stock,
        reason
      )
      values (
        v_required.product_id,
        p_order_id,
        'order_confirmed',
        -v_required.quantity,
        v_previous_stock,
        v_new_stock,
        'Stock deducted when order was confirmed'
      );
    end loop;

    update public.orders
    set
      status = 'confirmed',
      internal_notes = p_internal_notes,
      confirmed_at = coalesce(confirmed_at, now()),
      stock_deducted_at = now()
    where id = p_order_id;

    return query select true, 'Order confirmed and stock deducted.';
    return;
  end if;

  if p_next_status = 'cancelled' and v_order.stock_deducted_at is not null then
    for v_required in
      with raw_requirements as (
        select
          order_items.product_id,
          order_items.quantity
        from public.order_items
        where order_items.order_id = p_order_id
          and order_items.item_type <> 'custom_necklace'

        union all

        select
          custom_necklace_items.chain_product_id as product_id,
          1 as quantity
        from public.order_items
        join public.custom_necklace_items
          on custom_necklace_items.order_item_id = order_items.id
        where order_items.order_id = p_order_id
          and order_items.item_type = 'custom_necklace'

        union all

        select
          custom_necklace_charms.charm_product_id as product_id,
          custom_necklace_charms.quantity
        from public.order_items
        join public.custom_necklace_items
          on custom_necklace_items.order_item_id = order_items.id
        join public.custom_necklace_charms
          on custom_necklace_charms.custom_necklace_item_id = custom_necklace_items.id
        where order_items.order_id = p_order_id
          and order_items.item_type = 'custom_necklace'
      )
      select
        raw_requirements.product_id,
        sum(raw_requirements.quantity)::integer as quantity
      from raw_requirements
      where raw_requirements.product_id is not null
      group by raw_requirements.product_id
    loop
      select stock_quantity
      into v_previous_stock
      from public.products
      where id = v_required.product_id
      for update;

      if v_previous_stock is not null then
        v_new_stock = v_previous_stock + v_required.quantity;

        update public.products
        set stock_quantity = v_new_stock
        where id = v_required.product_id;

        insert into public.inventory_movements (
          product_id,
          order_id,
          movement_type,
          quantity_change,
          previous_stock,
          new_stock,
          reason
        )
        values (
          v_required.product_id,
          p_order_id,
          'order_cancelled_restore',
          v_required.quantity,
          v_previous_stock,
          v_new_stock,
          'Stock restored when confirmed order was cancelled'
        );
      end if;
    end loop;
  end if;

  update public.orders
  set
    status = p_next_status,
    internal_notes = p_internal_notes,
    confirmed_at = case
      when p_next_status = 'confirmed' then coalesce(confirmed_at, now())
      else confirmed_at
    end,
    cancelled_at = case
      when p_next_status = 'cancelled' then coalesce(cancelled_at, now())
      else cancelled_at
    end
  where id = p_order_id;

  if p_next_status = 'cancelled' and v_order.stock_deducted_at is not null then
    return query select true, 'Order cancelled and stock restored.';
  elsif p_next_status = 'cancelled' then
    return query select true, 'Order cancelled. No stock was restored because stock had not been deducted.';
  else
    return query select true, 'Order status updated.';
  end if;
end;
$$;

grant execute on function public.update_order_status_inventory(uuid, text, text) to authenticated;

comment on function public.update_order_status_inventory(uuid, text, text)
is 'Phase 4E active-admin order status workflow. Confirms orders with one-time stock deduction, cancels confirmed orders with one-time stock restoration, and writes inventory_movements rows. Public users are not granted execute access.';
