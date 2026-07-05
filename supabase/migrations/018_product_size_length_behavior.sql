-- elara. product size/length behavior alignment
-- Adds an explicit storefront behavior while preserving legacy preset options.

alter table public.products
add column if not exists size_length_behavior text not null default 'none',
add column if not exists custom_length_label text,
add column if not exists custom_length_help_text text;

alter table public.products
drop constraint if exists products_size_length_behavior_check,
add constraint products_size_length_behavior_check check (
  size_length_behavior in ('none', 'preset', 'custom', 'preset_and_custom')
);

alter table public.order_items
add column if not exists selected_size_label text,
add column if not exists selected_custom_length text,
add column if not exists selected_custom_length_label text;

-- Preserve existing products that already required a choice from size_options.
update public.products
set size_length_behavior = 'preset'
where size_length_behavior = 'none'
  and is_size_customizable = true
  and coalesce(cardinality(size_options), 0) > 0;

comment on column public.products.size_length_behavior
is 'Customer size/length UI behavior: none, preset, custom, or preset_and_custom.';

comment on column public.products.custom_length_label
is 'Customer-facing label for a requested custom length, such as Bracelet length or Necklace length.';

comment on column public.products.custom_length_help_text
is 'Optional customer-facing guidance shown below the custom length input.';

comment on column public.order_items.selected_custom_length
is 'Customer-requested custom length for a regular product order item.';

comment on column public.order_items.selected_size_label
is 'Customer-facing label saved with selected_size, such as Ring size.';

comment on column public.order_items.selected_custom_length_label
is 'Customer-facing label saved with selected_custom_length, such as Bracelet length.';
