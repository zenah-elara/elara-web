-- elara. Phase 4F builder product types and arrangement storage
-- Adds V1 support for mini charms, connectors, chain length notes, and
-- customer-selected charm/pendant arrangement order.

alter table public.products
drop constraint if exists products_product_type_check,
add constraint products_product_type_check check (
  product_type in (
    'regular_product',
    'chain',
    'charm',
    'mini_charm',
    'pendant',
    'connector',
    'bracelet',
    'custom_necklace'
  )
);

alter table public.order_items
drop constraint if exists order_items_item_type_check,
add constraint order_items_item_type_check check (
  item_type in (
    'regular_product',
    'custom_necklace',
    'chain',
    'charm',
    'mini_charm',
    'pendant',
    'connector',
    'bracelet'
  )
);

alter table public.custom_necklace_items
add column if not exists chain_length text;

alter table public.custom_necklace_charms
add column if not exists product_type text,
add column if not exists arrangement_order integer not null default 0;

alter table public.custom_necklace_charms
drop constraint if exists custom_necklace_charms_product_type_check,
add constraint custom_necklace_charms_product_type_check check (
  product_type is null
  or product_type in (
    'charm',
    'mini_charm',
    'pendant',
    'connector'
  )
);

grant insert on public.custom_necklace_items to anon, authenticated;
grant insert on public.custom_necklace_charms to anon, authenticated;

create policy "Public can submit custom necklace item details"
on public.custom_necklace_items
for insert
to anon, authenticated
with check (true);

create policy "Public can submit custom necklace charm details"
on public.custom_necklace_charms
for insert
to anon, authenticated
with check (true);

comment on column public.custom_necklace_items.chain_length
is 'V1 builder selected chain length text, such as 16 inches, 18 inches, 20 inches, or Custom / to confirm.';

comment on column public.custom_necklace_charms.product_type
is 'Builder selected item type: charm, mini_charm, pendant, or connector.';

comment on column public.custom_necklace_charms.arrangement_order
is 'Customer-selected left-to-right arrangement order for custom necklace assembly.';

comment on policy "Public can submit custom necklace item details"
on public.custom_necklace_items
is 'Allows checkout to insert custom necklace chain/length details only. No public select/update/delete is granted.';

comment on policy "Public can submit custom necklace charm details"
on public.custom_necklace_charms
is 'Allows checkout to insert selected charms, pendants, mini charms, connectors, and arrangement order only. No public select/update/delete is granted.';
