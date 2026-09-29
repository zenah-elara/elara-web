-- Preset size inventory. Size rows are authoritative; product/variant stock is
-- maintained as a derived total for existing catalog compatibility.

create table if not exists public.product_size_inventory (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete cascade,
  size_label text not null check (btrim(size_label) <> ''),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists product_size_inventory_product_size_uidx
on public.product_size_inventory(product_id, lower(btrim(size_label)))
where variant_id is null;

create unique index if not exists product_size_inventory_variant_size_uidx
on public.product_size_inventory(variant_id, lower(btrim(size_label)))
where variant_id is not null;

create index if not exists product_size_inventory_product_idx on public.product_size_inventory(product_id);
create index if not exists product_size_inventory_variant_idx on public.product_size_inventory(variant_id);

drop trigger if exists set_product_size_inventory_updated_at on public.product_size_inventory;
create trigger set_product_size_inventory_updated_at before update on public.product_size_inventory
for each row execute function public.set_updated_at();

alter table public.inventory_movements
add column if not exists size_inventory_id uuid references public.product_size_inventory(id) on delete set null;
create index if not exists inventory_movements_size_inventory_idx on public.inventory_movements(size_inventory_id);

alter table public.product_size_inventory enable row level security;
grant select on public.product_size_inventory to anon, authenticated;
grant insert, update, delete on public.product_size_inventory to authenticated;

create policy "Public can read visible product size inventory"
on public.product_size_inventory for select to anon, authenticated
using (exists (
  select 1 from public.products p where p.id = product_id and p.is_active = true
  and p.is_published = true
));

create policy "Active admins can manage product size inventory"
on public.product_size_inventory for all to authenticated
using (exists (select 1 from public.admin_profiles a where a.user_id = auth.uid() and a.is_active and a.role in ('owner','admin','staff')))
with check (exists (select 1 from public.admin_profiles a where a.user_id = auth.uid() and a.is_active and a.role in ('owner','admin','staff')));

create or replace function public.update_order_status_inventory(
  p_order_id uuid, p_next_status text, p_internal_notes text default null
)
returns table(success boolean, message text)
language plpgsql security invoker as $$
declare
  v_order public.orders%rowtype;
  v_required record;
  v_previous integer;
  v_new integer;
begin
  if not exists (select 1 from public.admin_profiles where user_id=auth.uid() and is_active and role in ('owner','admin','staff')) then
    return query select false, 'Only active admins can update order status.'; return;
  end if;
  if p_next_status not in ('new','contacted','confirmed','paid','packed','delivered','cancelled') then
    return query select false, 'Invalid order status.'; return;
  end if;
  select * into v_order from public.orders where id=p_order_id for update;
  if v_order.id is null then return query select false, 'Order was not found.'; return; end if;
  if v_order.status='cancelled' and p_next_status<>'cancelled' then return query select false, 'Cancelled orders cannot be reopened in V1. Create a new order request instead.'; return; end if;
  if p_next_status='cancelled' and v_order.status='cancelled' then return query select true, 'Order is already cancelled.'; return; end if;

  if p_next_status='confirmed' and v_order.stock_deducted_at is null then
    -- Validate exact product/variant + preset-size rows first.
    for v_required in
      select psi.id, psi.product_id, psi.variant_id, psi.size_label,
        sum(oi.quantity)::integer quantity, max(psi.stock_quantity) stock
      from public.order_items oi join public.product_size_inventory psi
        on psi.product_id=oi.product_id
        and psi.variant_id is not distinct from oi.variant_id
        and lower(btrim(psi.size_label))=lower(btrim(oi.selected_size))
      where oi.order_id=p_order_id and oi.item_type<>'custom_necklace'
      group by psi.id, psi.product_id, psi.variant_id, psi.size_label
    loop
      if v_required.stock < v_required.quantity then
        return query select false, format('Cannot confirm order. Size %s is no longer available.', v_required.size_label); return;
      end if;
    end loop;

    -- Validate non-size variant inventory.
    for v_required in
      select oi.variant_id, max(oi.item_name) name, sum(oi.quantity)::integer quantity, max(pv.stock_quantity) stock
      from public.order_items oi join public.product_variants pv on pv.id=oi.variant_id
      where oi.order_id=p_order_id and oi.variant_id is not null
        and not exists (select 1 from public.product_size_inventory psi where psi.product_id=oi.product_id and psi.variant_id=oi.variant_id and lower(btrim(psi.size_label))=lower(btrim(oi.selected_size)))
      group by oi.variant_id
    loop
      if v_required.stock < v_required.quantity then return query select false, format('Cannot confirm order. Not enough stock for %s.',v_required.name); return; end if;
    end loop;

    -- Validate non-size product inventory and builder parts.
    for v_required in
      with requirements as (
        select oi.product_id, oi.item_name name, oi.quantity from public.order_items oi
        where oi.order_id=p_order_id and oi.item_type<>'custom_necklace' and oi.variant_id is null
          and not exists (select 1 from public.product_size_inventory psi where psi.product_id=oi.product_id and psi.variant_id is null and lower(btrim(psi.size_label))=lower(btrim(oi.selected_size)))
        union all select cni.chain_product_id,cni.chain_name,1 from public.order_items oi join public.custom_necklace_items cni on cni.order_item_id=oi.id where oi.order_id=p_order_id and oi.item_type='custom_necklace'
        union all select cnc.charm_product_id,cnc.charm_name,cnc.quantity from public.order_items oi join public.custom_necklace_items cni on cni.order_item_id=oi.id join public.custom_necklace_charms cnc on cnc.custom_necklace_item_id=cni.id where oi.order_id=p_order_id and oi.item_type='custom_necklace'
      ) select r.product_id,max(r.name) name,sum(r.quantity)::integer quantity,max(p.stock_quantity) stock from requirements r left join public.products p on p.id=r.product_id where r.product_id is not null group by r.product_id
    loop
      if v_required.stock is null or v_required.stock < v_required.quantity then return query select false, format('Cannot confirm order. Not enough stock for %s.',v_required.name); return; end if;
    end loop;

    -- Deduct exact size inventory and write one auditable movement.
    for v_required in
      select psi.id,psi.product_id,psi.variant_id,sum(oi.quantity)::integer quantity
      from public.order_items oi join public.product_size_inventory psi on psi.product_id=oi.product_id and psi.variant_id is not distinct from oi.variant_id and lower(btrim(psi.size_label))=lower(btrim(oi.selected_size))
      where oi.order_id=p_order_id and oi.item_type<>'custom_necklace' group by psi.id,psi.product_id,psi.variant_id
    loop
      select stock_quantity into v_previous from public.product_size_inventory where id=v_required.id for update;
      v_new:=v_previous-v_required.quantity;
      update public.product_size_inventory set stock_quantity=v_new where id=v_required.id;
      insert into public.inventory_movements(product_id,variant_id,size_inventory_id,order_id,movement_type,quantity_change,previous_stock,new_stock,reason)
      values(v_required.product_id,v_required.variant_id,v_required.id,p_order_id,'order_confirmed',-v_required.quantity,v_previous,v_new,'Preset size stock deducted when order was confirmed');
    end loop;

    -- Deduct legacy variant pools only when no matching size row exists.
    for v_required in select oi.variant_id,max(oi.product_id::text)::uuid product_id,sum(oi.quantity)::integer quantity from public.order_items oi where oi.order_id=p_order_id and oi.variant_id is not null and not exists (select 1 from public.product_size_inventory psi where psi.product_id=oi.product_id and psi.variant_id=oi.variant_id and lower(btrim(psi.size_label))=lower(btrim(oi.selected_size))) group by oi.variant_id
    loop
      select stock_quantity into v_previous from public.product_variants where id=v_required.variant_id for update; v_new:=v_previous-v_required.quantity;
      update public.product_variants set stock_quantity=v_new where id=v_required.variant_id;
      insert into public.inventory_movements(product_id,variant_id,order_id,movement_type,quantity_change,previous_stock,new_stock,reason) values(v_required.product_id,v_required.variant_id,p_order_id,'order_confirmed',-v_required.quantity,v_previous,v_new,'Variant stock deducted when order was confirmed');
    end loop;

    -- Deduct legacy product pools and builder parts only.
    for v_required in
      with requirements as (
        select oi.product_id,oi.quantity from public.order_items oi where oi.order_id=p_order_id and oi.item_type<>'custom_necklace' and oi.variant_id is null and not exists (select 1 from public.product_size_inventory psi where psi.product_id=oi.product_id and psi.variant_id is null and lower(btrim(psi.size_label))=lower(btrim(oi.selected_size)))
        union all select cni.chain_product_id,1 from public.order_items oi join public.custom_necklace_items cni on cni.order_item_id=oi.id where oi.order_id=p_order_id and oi.item_type='custom_necklace'
        union all select cnc.charm_product_id,cnc.quantity from public.order_items oi join public.custom_necklace_items cni on cni.order_item_id=oi.id join public.custom_necklace_charms cnc on cnc.custom_necklace_item_id=cni.id where oi.order_id=p_order_id and oi.item_type='custom_necklace'
      ) select product_id,sum(quantity)::integer quantity from requirements where product_id is not null group by product_id
    loop
      select stock_quantity into v_previous from public.products where id=v_required.product_id for update; v_new:=v_previous-v_required.quantity;
      update public.products set stock_quantity=v_new where id=v_required.product_id;
      insert into public.inventory_movements(product_id,order_id,movement_type,quantity_change,previous_stock,new_stock,reason) values(v_required.product_id,p_order_id,'order_confirmed',-v_required.quantity,v_previous,v_new,'Stock deducted when order was confirmed');
    end loop;

    -- Refresh compatibility totals for every size-managed item.
    update public.product_variants pv set stock_quantity=(select coalesce(sum(psi.stock_quantity),0) from public.product_size_inventory psi where psi.variant_id=pv.id)
    where pv.id in (select distinct variant_id from public.product_size_inventory where product_id in (select product_id from public.order_items where order_id=p_order_id) and variant_id is not null);
    update public.products p set stock_quantity=(select coalesce(sum(psi.stock_quantity),0) from public.product_size_inventory psi where psi.product_id=p.id)
    where p.id in (select distinct product_id from public.product_size_inventory where product_id in (select product_id from public.order_items where order_id=p_order_id));

    update public.orders set status='confirmed',internal_notes=p_internal_notes,confirmed_at=coalesce(confirmed_at,now()),stock_deducted_at=now() where id=p_order_id;
    return query select true,'Order confirmed and stock deducted.'; return;
  end if;

  if p_next_status='cancelled' and v_order.stock_deducted_at is not null then
    for v_required in select * from public.inventory_movements where order_id=p_order_id and movement_type='order_confirmed' order by created_at
    loop
      if v_required.size_inventory_id is not null then
        select stock_quantity into v_previous from public.product_size_inventory where id=v_required.size_inventory_id for update;
        if v_previous is not null then v_new:=v_previous+abs(v_required.quantity_change); update public.product_size_inventory set stock_quantity=v_new where id=v_required.size_inventory_id; end if;
      elsif v_required.variant_id is not null then
        select stock_quantity into v_previous from public.product_variants where id=v_required.variant_id for update; v_new:=v_previous+abs(v_required.quantity_change); update public.product_variants set stock_quantity=v_new where id=v_required.variant_id;
      else
        select stock_quantity into v_previous from public.products where id=v_required.product_id for update; v_new:=v_previous+abs(v_required.quantity_change); update public.products set stock_quantity=v_new where id=v_required.product_id;
      end if;
      insert into public.inventory_movements(product_id,variant_id,size_inventory_id,order_id,movement_type,quantity_change,previous_stock,new_stock,reason)
      values(v_required.product_id,v_required.variant_id,v_required.size_inventory_id,p_order_id,'order_cancelled_restore',abs(v_required.quantity_change),v_previous,v_new,'Stock restored when confirmed order was cancelled');
    end loop;
    update public.product_variants pv set stock_quantity=(select coalesce(sum(psi.stock_quantity),0) from public.product_size_inventory psi where psi.variant_id=pv.id) where pv.id in (select distinct variant_id from public.product_size_inventory where variant_id is not null and product_id in (select product_id from public.order_items where order_id=p_order_id));
    update public.products p set stock_quantity=(select coalesce(sum(psi.stock_quantity),0) from public.product_size_inventory psi where psi.product_id=p.id) where p.id in (select distinct product_id from public.product_size_inventory where product_id in (select product_id from public.order_items where order_id=p_order_id));
  end if;

  update public.orders set status=p_next_status,internal_notes=p_internal_notes,
    confirmed_at=case when p_next_status='confirmed' then coalesce(confirmed_at,now()) else confirmed_at end,
    cancelled_at=case when p_next_status='cancelled' then coalesce(cancelled_at,now()) else cancelled_at end
  where id=p_order_id;
  if p_next_status='cancelled' and v_order.stock_deducted_at is not null then return query select true,'Order cancelled and stock restored.';
  elsif p_next_status='cancelled' then return query select true,'Order cancelled. No stock was restored because stock had not been deducted.'; end if;
  return query select true,'Order status updated.';
end;
$$;

comment on table public.product_size_inventory is 'Authoritative preset-size stock, optionally scoped to one exact product variant.';
comment on column public.inventory_movements.size_inventory_id is 'Exact preset-size inventory row changed by this movement.';
