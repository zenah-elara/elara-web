-- elara. V1 Supabase-ready schema
-- Phase 2 only: schema, constraints, seed collections, and stock workflow helpers.
-- Production RLS policies should be added during the auth/admin phase.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.collections (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text,
  sort_order integer default 0,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid references public.collections(id) on delete set null,
  name text not null,
  slug text unique not null,
  description text,
  price numeric(10,2) not null default 0,
  product_type text not null,
  sku text unique,
  material_details text,
  care_instructions text,
  stock_quantity integer not null default 0,
  low_stock_threshold integer not null default 3,
  is_active boolean default true,
  is_featured boolean default false,
  is_new_arrival boolean default false,
  sort_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint products_product_type_check check (
    product_type in (
      'regular_product',
      'chain',
      'charm',
      'pendant',
      'bracelet',
      'custom_necklace'
    )
  ),
  constraint products_stock_quantity_check check (stock_quantity >= 0),
  constraint products_low_stock_threshold_check check (low_stock_threshold >= 0),
  constraint products_price_check check (price >= 0)
);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade,
  image_url text not null,
  alt_text text,
  sort_order integer default 0,
  is_primary boolean default false,
  created_at timestamptz default now()
);

create table public.product_tags (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade,
  tag text not null,
  created_at timestamptz default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null,
  customer_name text not null,
  contact_number text not null,
  facebook_link text,
  instagram_username text,
  delivery_location text not null,
  preferred_contact_method text not null,
  order_notes text,
  internal_notes text,
  status text not null default 'new',
  subtotal numeric(10,2) not null default 0,
  estimated_total numeric(10,2) not null default 0,
  stock_deducted_at timestamptz,
  confirmed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint orders_status_check check (
    status in (
      'new',
      'contacted',
      'confirmed',
      'paid',
      'packed',
      'delivered',
      'cancelled'
    )
  ),
  constraint orders_preferred_contact_method_check check (
    preferred_contact_method in ('facebook', 'instagram', 'phone')
  ),
  constraint orders_subtotal_check check (subtotal >= 0),
  constraint orders_estimated_total_check check (estimated_total >= 0),
  constraint orders_contact_requirement_check check (
    facebook_link is not null
    or instagram_username is not null
    or contact_number is not null
  )
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete restrict,
  item_type text not null default 'regular_product',
  item_name text not null,
  unit_price numeric(10,2) not null default 0,
  quantity integer not null default 1,
  line_total numeric(10,2) not null default 0,
  created_at timestamptz default now(),
  constraint order_items_item_type_check check (
    item_type in (
      'regular_product',
      'custom_necklace',
      'chain',
      'charm',
      'pendant',
      'bracelet'
    )
  ),
  constraint order_items_unit_price_check check (unit_price >= 0),
  constraint order_items_quantity_check check (quantity > 0),
  constraint order_items_line_total_check check (line_total >= 0)
);

create table public.custom_necklace_items (
  id uuid primary key default gen_random_uuid(),
  order_item_id uuid references public.order_items(id) on delete cascade,
  chain_product_id uuid references public.products(id) on delete restrict,
  chain_name text not null,
  chain_price numeric(10,2) not null default 0,
  created_at timestamptz default now(),
  constraint custom_necklace_items_chain_price_check check (chain_price >= 0)
);

create table public.custom_necklace_charms (
  id uuid primary key default gen_random_uuid(),
  custom_necklace_item_id uuid references public.custom_necklace_items(id) on delete cascade,
  charm_product_id uuid references public.products(id) on delete restrict,
  charm_name text not null,
  charm_price numeric(10,2) not null default 0,
  quantity integer not null default 1,
  created_at timestamptz default now(),
  constraint custom_necklace_charms_charm_price_check check (charm_price >= 0),
  constraint custom_necklace_charms_quantity_check check (quantity > 0)
);

create table public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete restrict,
  order_id uuid references public.orders(id) on delete set null,
  movement_type text not null,
  quantity_change integer not null,
  previous_stock integer not null,
  new_stock integer not null,
  reason text,
  created_at timestamptz default now(),
  constraint inventory_movements_movement_type_check check (
    movement_type in (
      'manual_adjustment',
      'order_confirmed',
      'order_cancelled_restore',
      'restock'
    )
  ),
  constraint inventory_movements_previous_stock_check check (previous_stock >= 0),
  constraint inventory_movements_new_stock_check check (new_stock >= 0)
);

create table public.admin_activity_logs (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  details jsonb,
  created_at timestamptz default now()
);

create index collections_slug_idx on public.collections(slug);
create index products_slug_idx on public.products(slug);
create index products_collection_id_idx on public.products(collection_id);
create index products_product_type_idx on public.products(product_type);
create index products_is_active_idx on public.products(is_active);
create index orders_order_number_idx on public.orders(order_number);
create index orders_status_idx on public.orders(status);
create index orders_created_at_idx on public.orders(created_at);
create index order_items_order_id_idx on public.order_items(order_id);
create index inventory_movements_product_id_idx on public.inventory_movements(product_id);
create index inventory_movements_order_id_idx on public.inventory_movements(order_id);

create trigger set_collections_updated_at
before update on public.collections
for each row
execute function public.set_updated_at();

create trigger set_products_updated_at
before update on public.products
for each row
execute function public.set_updated_at();

create trigger set_orders_updated_at
before update on public.orders
for each row
execute function public.set_updated_at();

create or replace function public.deduct_product_stock(
  p_product_id uuid,
  p_order_id uuid,
  p_quantity integer,
  p_reason text
)
returns void
language plpgsql
as $$
declare
  v_previous_stock integer;
  v_new_stock integer;
begin
  if p_quantity <= 0 then
    raise exception 'Stock deduction quantity must be positive.';
  end if;

  select stock_quantity
  into v_previous_stock
  from public.products
  where id = p_product_id
  for update;

  if v_previous_stock is null then
    raise exception 'Product % was not found.', p_product_id;
  end if;

  if v_previous_stock < p_quantity then
    raise exception 'Insufficient stock for product %. Requested %, available %.',
      p_product_id,
      p_quantity,
      v_previous_stock;
  end if;

  v_new_stock = v_previous_stock - p_quantity;

  update public.products
  set stock_quantity = v_new_stock
  where id = p_product_id;

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
    p_product_id,
    p_order_id,
    'order_confirmed',
    -p_quantity,
    v_previous_stock,
    v_new_stock,
    p_reason
  );
end;
$$;

create or replace function public.restore_product_stock(
  p_product_id uuid,
  p_order_id uuid,
  p_quantity integer,
  p_reason text
)
returns void
language plpgsql
as $$
declare
  v_previous_stock integer;
  v_new_stock integer;
begin
  if p_quantity <= 0 then
    raise exception 'Stock restore quantity must be positive.';
  end if;

  select stock_quantity
  into v_previous_stock
  from public.products
  where id = p_product_id
  for update;

  if v_previous_stock is null then
    raise exception 'Product % was not found.', p_product_id;
  end if;

  v_new_stock = v_previous_stock + p_quantity;

  update public.products
  set stock_quantity = v_new_stock
  where id = p_product_id;

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
    p_product_id,
    p_order_id,
    'order_cancelled_restore',
    p_quantity,
    v_previous_stock,
    v_new_stock,
    p_reason
  );
end;
$$;

create or replace function public.deduct_order_stock(p_order_id uuid)
returns void
language plpgsql
as $$
declare
  v_order public.orders%rowtype;
  v_item record;
  v_charm record;
begin
  select *
  into v_order
  from public.orders
  where id = p_order_id
  for update;

  if v_order.id is null then
    raise exception 'Order % was not found.', p_order_id;
  end if;

  if v_order.stock_deducted_at is not null then
    return;
  end if;

  for v_item in
    select *
    from public.order_items
    where order_id = p_order_id
  loop
    if v_item.item_type = 'custom_necklace' then
      for v_charm in
        select chain_product_id as product_id, 1 as quantity
        from public.custom_necklace_items
        where order_item_id = v_item.id

        union all

        select charm_product_id as product_id, quantity
        from public.custom_necklace_charms cnc
        join public.custom_necklace_items cni
          on cni.id = cnc.custom_necklace_item_id
        where cni.order_item_id = v_item.id
      loop
        perform public.deduct_product_stock(
          v_charm.product_id,
          p_order_id,
          v_charm.quantity,
          'Stock deducted when custom necklace order was confirmed.'
        );
      end loop;
    else
      perform public.deduct_product_stock(
        v_item.product_id,
        p_order_id,
        v_item.quantity,
        'Stock deducted when order was confirmed.'
      );
    end if;
  end loop;

  update public.orders
  set
    stock_deducted_at = now(),
    confirmed_at = coalesce(confirmed_at, now())
  where id = p_order_id;
end;
$$;

create or replace function public.restore_order_stock(p_order_id uuid)
returns void
language plpgsql
as $$
declare
  v_order public.orders%rowtype;
  v_item record;
  v_charm record;
begin
  select *
  into v_order
  from public.orders
  where id = p_order_id
  for update;

  if v_order.id is null then
    raise exception 'Order % was not found.', p_order_id;
  end if;

  if v_order.stock_deducted_at is null then
    return;
  end if;

  for v_item in
    select *
    from public.order_items
    where order_id = p_order_id
  loop
    if v_item.item_type = 'custom_necklace' then
      for v_charm in
        select chain_product_id as product_id, 1 as quantity
        from public.custom_necklace_items
        where order_item_id = v_item.id

        union all

        select charm_product_id as product_id, quantity
        from public.custom_necklace_charms cnc
        join public.custom_necklace_items cni
          on cni.id = cnc.custom_necklace_item_id
        where cni.order_item_id = v_item.id
      loop
        perform public.restore_product_stock(
          v_charm.product_id,
          p_order_id,
          v_charm.quantity,
          'Stock restored when confirmed order was cancelled.'
        );
      end loop;
    else
      perform public.restore_product_stock(
        v_item.product_id,
        p_order_id,
        v_item.quantity,
        'Stock restored when confirmed order was cancelled.'
      );
    end if;
  end loop;

  update public.orders
  set
    stock_deducted_at = null,
    cancelled_at = coalesce(cancelled_at, now())
  where id = p_order_id;
end;
$$;

create or replace function public.mark_order_confirmed(p_order_id uuid)
returns void
language plpgsql
as $$
begin
  perform public.deduct_order_stock(p_order_id);

  update public.orders
  set
    status = 'confirmed',
    confirmed_at = coalesce(confirmed_at, now())
  where id = p_order_id;
end;
$$;

create or replace function public.mark_order_cancelled(p_order_id uuid)
returns void
language plpgsql
as $$
begin
  perform public.restore_order_stock(p_order_id);

  update public.orders
  set
    status = 'cancelled',
    cancelled_at = coalesce(cancelled_at, now())
  where id = p_order_id;
end;
$$;

comment on function public.mark_order_confirmed(uuid) is 'Admin workflow helper for Phase 3. Confirms an order and deducts stock only at confirmation time.';
comment on function public.mark_order_cancelled(uuid) is 'Admin workflow helper for Phase 3. Cancels an order and restores stock when it had already been deducted.';

alter table public.collections enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_tags enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.custom_necklace_items enable row level security;
alter table public.custom_necklace_charms enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.admin_activity_logs enable row level security;

comment on table public.collections is 'RLS enabled. Add public read and admin write policies in the auth/admin phase.';
comment on table public.products is 'RLS enabled. Add public read and admin write policies in the auth/admin phase.';
comment on table public.product_images is 'RLS enabled. Add public read and admin write policies in the auth/admin phase.';
comment on table public.product_tags is 'RLS enabled. Add public read and admin write policies in the auth/admin phase.';
comment on table public.orders is 'RLS enabled. Add customer order submission and admin workflow policies in the auth/admin phase.';
comment on table public.order_items is 'RLS enabled. Add policies with order request and admin workflow in a later phase.';
comment on table public.custom_necklace_items is 'RLS enabled. Add policies with order request and admin workflow in a later phase.';
comment on table public.custom_necklace_charms is 'RLS enabled. Add policies with order request and admin workflow in a later phase.';
comment on table public.inventory_movements is 'RLS enabled. Admin-only policies should be added in the auth/admin phase.';
comment on table public.admin_activity_logs is 'RLS enabled. Admin-only policies should be added in the auth/admin phase.';

insert into public.collections (name, slug, description, sort_order)
values
  ('Ocean Collection', 'ocean-collection', 'Soft shell charms, coastal textures, and pearl-lit details.', 10),
  ('Dainty Collection', 'dainty-collection', 'Lightweight bracelets and everyday pieces with a gentle glow.', 20),
  ('Gem Collection', 'gem-collection', 'Delicate gem-inspired drops with polished gold accents.', 30),
  ('Charm Bar', 'charm-bar', 'Build a personal necklace with curated chains and charms.', 40),
  ('New Arrivals', 'new-arrivals', 'Fresh pieces for soft styling and sweet everyday layering.', 50),
  ('Best Sellers', 'best-sellers', 'Customer favorites selected for gifting, stacking, and daily wear.', 60)
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  sort_order = excluded.sort_order,
  is_active = true,
  updated_at = now();
