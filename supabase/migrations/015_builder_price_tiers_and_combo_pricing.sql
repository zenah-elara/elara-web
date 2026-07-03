-- elara. builder pricing tier support
-- Adds an optional tier used by Build Your Elara Piece combo pricing.
-- Existing products default to basic. Public write access is not granted.

alter table public.products
add column if not exists builder_price_tier text not null default 'basic';

alter table public.products
drop constraint if exists products_builder_price_tier_check,
add constraint products_builder_price_tier_check check (
  builder_price_tier in ('basic', 'premium')
);

comment on column public.products.builder_price_tier
is 'Build Your Elara Piece pricing tier. Used for chains and mini charms; charm, pendant, and connector pricing ignores this field.';
