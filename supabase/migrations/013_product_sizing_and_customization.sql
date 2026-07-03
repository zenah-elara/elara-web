-- elara. product sizing and customization support
-- Adds flexible size/length options for rings, bracelets, necklaces, and
-- chains, plus selected_size on order_items for regular product orders.

alter table public.products
drop constraint if exists products_product_type_check,
add constraint products_product_type_check check (
  product_type in (
    'regular_product',
    'necklace',
    'bracelet',
    'ring',
    'chain',
    'charm',
    'mini_charm',
    'pendant',
    'connector',
    'custom_necklace'
  )
);

alter table public.products
add column if not exists is_size_customizable boolean not null default false,
add column if not exists size_options text[],
add column if not exists size_label text,
add column if not exists fixed_size_note text;

alter table public.order_items
add column if not exists selected_size text;

comment on column public.products.is_size_customizable
is 'When true, customers can choose from size_options before adding this product to cart.';

comment on column public.products.size_options
is 'Available customer-facing sizes or lengths, such as ring sizes 5-9 or necklace lengths.';

comment on column public.products.size_label
is 'Customer-facing selector label, such as Ring size, Necklace length, Bracelet size, or Length.';

comment on column public.products.fixed_size_note
is 'Optional note shown when a product has fixed sizing and does not need customer selection.';

comment on column public.order_items.selected_size
is 'Selected size or length for regular product orders. Custom necklace chain length remains in custom_necklace_items.chain_length.';
