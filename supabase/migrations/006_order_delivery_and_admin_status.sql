-- elara. Phase 4D delivery details and admin order status refinement
-- Adds explicit delivery fields for Bacolod delivery, outside Bacolod shipping,
-- and agreed store drop-off. No meet-up option is supported.

alter table public.orders
add column if not exists delivery_method text,
add column if not exists courier_service text,
add column if not exists dropoff_location text,
add column if not exists shipping_address text;

alter table public.orders
drop constraint if exists orders_delivery_method_check,
add constraint orders_delivery_method_check check (
  delivery_method is null
  or delivery_method in (
    'bacolod_delivery',
    'outside_bacolod_shipping',
    'dropoff_store'
  )
);

alter table public.orders
drop constraint if exists orders_courier_service_check,
add constraint orders_courier_service_check check (
  courier_service is null
  or courier_service in ('grab_express', 'maxim', 'jnt_express')
);

comment on column public.orders.delivery_method
is 'Order request delivery method: bacolod_delivery, outside_bacolod_shipping, or dropoff_store.';

comment on column public.orders.courier_service
is 'Courier/service for delivery: grab_express, maxim, or jnt_express. Drop-off orders may leave this null.';

comment on column public.orders.delivery_location
is 'Bacolod delivery address or pin location for Grab Express or Maxim.';

comment on column public.orders.shipping_address
is 'Complete shipping address for outside Bacolod J&T Express orders.';

comment on column public.orders.dropoff_location
is 'Agreed store or drop-off location. No meet-up option is supported.';
