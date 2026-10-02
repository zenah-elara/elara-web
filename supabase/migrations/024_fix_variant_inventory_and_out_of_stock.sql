-- Apply after 020 and 023. No stock quantities or publication flags are reset.
-- Inventory changes only at confirmation/cancellation, using the exact source.
begin;

create or replace function public.update_order_status_inventory(
  p_order_id uuid, p_next_status text, p_internal_notes text default null
)
returns table(success boolean, message text)
language plpgsql security invoker
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_product public.products%rowtype;
  v_variant public.product_variants%rowtype;
  v_size public.product_size_inventory%rowtype;
  v_item record;
  v_bucket record;
  v_requirements jsonb := '[]'::jsonb;
  v_locked jsonb := '[]'::jsonb;
  v_source text;
  v_source_id uuid;
  v_variant_id uuid;
  v_previous integer;
  v_new integer;
  v_preset boolean;
begin
  if not exists (
    select 1 from public.admin_profiles a
    where a.user_id = auth.uid() and a.is_active and a.role in ('owner','admin','staff')
  ) then
    return query select false, 'Only active admins can update order status.';
    return;
  end if;
  if p_next_status is null or p_next_status not in ('new','contacted','confirmed','paid','packed','delivered','cancelled') then
    return query select false, 'Invalid order status.';
    return;
  end if;
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    return query select false, 'Order was not found.';
    return;
  end if;
  if v_order.status = 'cancelled' then
    if p_next_status <> 'cancelled' then
      return query select false, 'Cancelled orders cannot be reopened in V1. Create a new order request instead.';
    else
      update public.orders set internal_notes = p_internal_notes where id = p_order_id;
      return query select true, 'Order is already cancelled.';
    end if;
    return;
  end if;

  -- Lock products in a consistent order so overlapping orders serialize before
  -- their exact inventory is checked. Individual inventory rows are also locked.
  perform p.id from public.products p
  where p.id in (
    select oi.product_id from public.order_items oi where oi.order_id = p_order_id
    union select cni.chain_product_id from public.order_items oi
      join public.custom_necklace_items cni on cni.order_item_id = oi.id where oi.order_id = p_order_id
    union select cnc.charm_product_id from public.order_items oi
      join public.custom_necklace_items cni on cni.order_item_id = oi.id
      join public.custom_necklace_charms cnc on cnc.custom_necklace_item_id = cni.id where oi.order_id = p_order_id
    union select im.product_id from public.inventory_movements im where im.order_id = p_order_id
  ) order by p.id for update;
  perform oi.id from public.order_items oi where oi.order_id = p_order_id order by oi.id for update;

  if p_next_status = 'confirmed' and v_order.stock_deducted_at is null then
    if not exists (select 1 from public.order_items where order_id = p_order_id) then
      raise exception 'Cannot confirm an order with no saved items.';
    end if;
    if exists (
      select 1 from public.order_items oi where oi.order_id = p_order_id and oi.item_type = 'custom_necklace'
      and (not exists (select 1 from public.custom_necklace_items cni where cni.order_item_id = oi.id)
        or not exists (select 1 from public.custom_necklace_items cni
          join public.custom_necklace_charms cnc on cnc.custom_necklace_item_id = cni.id where cni.order_item_id = oi.id))
    ) then
      raise exception 'Cannot confirm an incomplete custom piece.';
    end if;

    for v_item in select * from public.order_items
      where order_id = p_order_id and item_type <> 'custom_necklace' order by product_id, id
    loop
      select * into v_product from public.products where id = v_item.product_id;
      if not found or v_product.is_active is not true then
        raise exception 'An ordered product is no longer available.';
      end if;
      v_variant_id := null;
      if v_product.has_variants then
        select * into v_variant from public.product_variants
          where id = v_item.variant_id and product_id = v_product.id for update;
        if not found or v_variant.is_active is not true then
          raise exception 'The selected variant is missing or unavailable. Please review the order.';
        end if;
        v_variant_id := v_variant.id;
      elsif v_item.variant_id is not null then
        raise exception 'The selected variant does not match this product.';
      end if;

      v_preset := v_product.size_length_behavior in ('preset','preset_and_custom')
        or (v_product.size_length_behavior = 'none' and v_product.is_size_customizable
          and coalesce(cardinality(v_product.size_options),0) > 0);
      if v_preset then
        if v_item.selected_size is null or not exists (
          select 1 from unnest(v_product.size_options) s
          where lower(btrim(s)) = lower(btrim(v_item.selected_size))
        ) then
          raise exception 'The selected size is missing or no longer available.';
        end if;
        select * into v_size from public.product_size_inventory
          where product_id = v_product.id and variant_id is not distinct from v_variant_id
            and lower(btrim(size_label)) = lower(btrim(v_item.selected_size)) for update;
        if not found then
          raise exception 'The selected size inventory is missing. Please review the order.';
        end if;
        v_source := 'size'; v_source_id := v_size.id;
      elsif v_product.has_variants then
        v_source := 'variant'; v_source_id := v_variant_id;
      else
        v_source := 'product'; v_source_id := v_product.id;
      end if;
      v_requirements := v_requirements || jsonb_build_array(jsonb_build_object(
        'source',v_source,'source_id',v_source_id,'product_id',v_product.id,
        'variant_id',v_variant_id,'quantity',v_item.quantity
      ));
    end loop;

    -- Builder parts keep their existing product-level stock behavior.
    for v_item in
      select cni.chain_product_id product_id, 1 quantity from public.order_items oi
        join public.custom_necklace_items cni on cni.order_item_id = oi.id
        where oi.order_id = p_order_id and oi.item_type = 'custom_necklace'
      union all select cnc.charm_product_id, cnc.quantity from public.order_items oi
        join public.custom_necklace_items cni on cni.order_item_id = oi.id
        join public.custom_necklace_charms cnc on cnc.custom_necklace_item_id = cni.id
        where oi.order_id = p_order_id and oi.item_type = 'custom_necklace'
    loop
      select * into v_product from public.products where id = v_item.product_id;
      if not found or v_product.is_active is not true then
        raise exception 'A custom piece part is no longer available.';
      end if;
      v_requirements := v_requirements || jsonb_build_array(jsonb_build_object(
        'source','product','source_id',v_product.id,'product_id',v_product.id,
        'variant_id',null,'quantity',v_item.quantity
      ));
    end loop;

    -- Aggregate repeated lines, lock, and validate ALL buckets before mutating.
    for v_bucket in
      select r.source, r.source_id, r.product_id, r.variant_id, sum(r.quantity)::integer quantity
      from jsonb_to_recordset(v_requirements) as r(source text,source_id uuid,product_id uuid,variant_id uuid,quantity integer)
      group by r.source,r.source_id,r.product_id,r.variant_id
      order by r.source,r.source_id
    loop
      v_previous := null;
      if v_bucket.source = 'size' then
        select stock_quantity into v_previous from public.product_size_inventory where id = v_bucket.source_id for update;
      elsif v_bucket.source = 'variant' then
        select stock_quantity into v_previous from public.product_variants where id = v_bucket.source_id for update;
      else
        select stock_quantity into v_previous from public.products where id = v_bucket.source_id for update;
      end if;
      if v_previous is null or v_bucket.quantity <= 0 or v_previous < v_bucket.quantity then
        raise exception 'Not enough stock is available for this item.';
      end if;
      v_locked := v_locked || jsonb_build_array(to_jsonb(v_bucket) || jsonb_build_object('previous_stock',v_previous));
    end loop;

    for v_bucket in
      select * from jsonb_to_recordset(v_locked) as r(source text,source_id uuid,product_id uuid,variant_id uuid,quantity integer,previous_stock integer)
    loop
      v_new := v_bucket.previous_stock - v_bucket.quantity;
      if v_bucket.source = 'size' then
        update public.product_size_inventory set stock_quantity = v_new where id = v_bucket.source_id;
      elsif v_bucket.source = 'variant' then
        update public.product_variants set stock_quantity = v_new where id = v_bucket.source_id;
      else
        update public.products set stock_quantity = v_new where id = v_bucket.source_id;
      end if;
      if not found then raise exception 'The inventory could not be updated. Please check Admin permissions.'; end if;
      insert into public.inventory_movements(product_id,variant_id,size_inventory_id,order_id,movement_type,quantity_change,previous_stock,new_stock,reason)
      values(v_bucket.product_id,v_bucket.variant_id,case when v_bucket.source = 'size' then v_bucket.source_id else null end,
        p_order_id,'order_confirmed',-v_bucket.quantity,v_bucket.previous_stock,v_new,
        format('Exact %s inventory deducted when order was confirmed',v_bucket.source));
    end loop;
    update public.orders set status = 'confirmed',internal_notes = p_internal_notes,
      confirmed_at = coalesce(confirmed_at,now()),stock_deducted_at = now() where id = p_order_id;
    if not found then raise exception 'The order could not be updated. Please check Admin permissions.'; end if;
    return query select true, 'Order confirmed and stock deducted.';
    return;
  end if;

  if p_next_status = 'cancelled' and v_order.stock_deducted_at is not null then
    -- Restore the source recorded at deduction, regardless of later product edits.
    if not exists (select 1 from public.inventory_movements where order_id = p_order_id and movement_type = 'order_confirmed') then
      raise exception 'Original inventory movements are missing. Please review the order.';
    end if;
    for v_bucket in select * from public.inventory_movements
      where order_id = p_order_id and movement_type = 'order_confirmed' order by id
    loop
      v_previous := null;
      if (v_bucket.reason in ('Preset size stock deducted when order was confirmed','Exact size inventory deducted when order was confirmed') and v_bucket.size_inventory_id is null)
        or (v_bucket.reason in ('Variant stock deducted when order was confirmed','Exact variant inventory deducted when order was confirmed') and v_bucket.variant_id is null) then
        raise exception 'The original inventory row is missing. Please review inventory movements.';
      end if;
      if v_bucket.size_inventory_id is not null then
        select stock_quantity into v_previous from public.product_size_inventory where id = v_bucket.size_inventory_id for update;
      elsif v_bucket.variant_id is not null then
        select stock_quantity into v_previous from public.product_variants where id = v_bucket.variant_id for update;
      else
        select stock_quantity into v_previous from public.products where id = v_bucket.product_id for update;
      end if;
      if v_previous is null then raise exception 'The original inventory row is missing. Please review inventory movements.'; end if;
      v_new := v_previous + abs(v_bucket.quantity_change);
      if v_bucket.size_inventory_id is not null then
        update public.product_size_inventory set stock_quantity = v_new where id = v_bucket.size_inventory_id;
      elsif v_bucket.variant_id is not null then
        update public.product_variants set stock_quantity = v_new where id = v_bucket.variant_id;
      else
        update public.products set stock_quantity = v_new where id = v_bucket.product_id;
      end if;
      if not found then raise exception 'The inventory could not be restored. Please check Admin permissions.'; end if;
      insert into public.inventory_movements(product_id,variant_id,size_inventory_id,order_id,movement_type,quantity_change,previous_stock,new_stock,reason)
      values(v_bucket.product_id,v_bucket.variant_id,v_bucket.size_inventory_id,p_order_id,'order_cancelled_restore',abs(v_bucket.quantity_change),v_previous,v_new,'Exact inventory restored when order was cancelled');
    end loop;
  end if;

  update public.orders set status = p_next_status,internal_notes = p_internal_notes,
    confirmed_at = case when p_next_status = 'confirmed' then coalesce(confirmed_at,now()) else confirmed_at end,
    cancelled_at = case when p_next_status = 'cancelled' then coalesce(cancelled_at,now()) else cancelled_at end where id = p_order_id;
  if not found then raise exception 'The order could not be updated. Please check Admin permissions.'; end if;
  if p_next_status = 'cancelled' and v_order.stock_deducted_at is not null then
    return query select true, 'Order cancelled and stock restored.';
  elsif p_next_status = 'cancelled' then
    return query select true, 'Order cancelled. No stock was restored because stock had not been deducted.';
  else
    return query select true, 'Order status updated.';
  end if;
exception
  -- This block rolls back every stock/status/movement change on failure.
  when raise_exception then
    return query select false, SQLERRM;
  when others then
    raise log 'elara inventory RPC failed for order %, SQLSTATE %', p_order_id, SQLSTATE;
    return query select false, 'Order inventory could not be updated. Please check stock and Admin permissions.';
end;
$$;

revoke execute on function public.update_order_status_inventory(uuid,text,text) from public, anon;
grant execute on function public.update_order_status_inventory(uuid,text,text) to authenticated;
comment on function public.update_order_status_inventory(uuid,text,text)
is 'Atomic exact-source deduction on first confirmation and movement-based restoration on cancellation. Stock does not change publication.';
commit;
