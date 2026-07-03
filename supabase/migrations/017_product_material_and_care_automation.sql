-- elara. product material and care automation alignment.
-- Reuses products.finish_type as the customer-facing material selector.
-- Existing non_tarnish values are migrated to stainless_steel, which displays
-- publicly as "Non-tarnish / Stainless steel". No public write access is added.

update public.products
set finish_type = 'stainless_steel'
where finish_type = 'non_tarnish';

alter table public.products
drop constraint if exists products_finish_type_check,
add constraint products_finish_type_check check (
  finish_type is null
  or finish_type in ('gold_plated', 'stainless_steel')
);

comment on column public.products.finish_type
is 'Customer-facing product material: gold_plated or stainless_steel. Stainless steel displays as Non-tarnish / Stainless steel.';

comment on column public.products.finish_notes
is 'Optional customer-facing material notes shown with the automated material and care copy.';
