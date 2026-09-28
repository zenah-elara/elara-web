-- Records the single order-level material and care acknowledgment made by a
-- customer immediately before submitting an order request.

alter table public.orders
add column if not exists material_acknowledged_at timestamptz;

comment on column public.orders.material_acknowledged_at
is 'Timestamp when the customer confirmed the order material and care review.';
