# Phase 4E Order Status and Inventory Workflow

Phase 4E adds the operational admin workflow for order status updates and stock
movement tracking.

## Status Workflow

Supported order statuses:

- `new`
- `contacted`
- `confirmed`
- `paid`
- `packed`
- `delivered`
- `cancelled`

Customers still create order requests only. Admins review each request and move
the order through the workflow manually.

## Stock Deduction

Stock does not deduct when checkout creates an order request.

Stock deducts only when an active admin marks an order as `confirmed`.

The `public.update_order_status_inventory()` RPC checks every order item first.
If any item does not have enough available stock, confirmation is blocked with a
safe admin-facing warning:

`Cannot confirm order. Not enough stock for [Product Name]. Available: X, needed: Y.`

If all items have enough stock, the RPC deducts product stock, writes an
`inventory_movements` row for each product, and sets:

- `orders.status = confirmed`
- `orders.confirmed_at`
- `orders.stock_deducted_at`

If a confirmed order is later moved to paid, packed, or delivered, stock remains
deducted and is not deducted again.

## Stock Restoration

If an order is cancelled before stock was deducted, only the status and
`cancelled_at` timestamp are updated.

If an order is cancelled after stock was deducted, the RPC restores each product
quantity, writes a positive `inventory_movements` row, and sets:

- `orders.status = cancelled`
- `orders.cancelled_at`

Cancelled orders cannot be reopened in V1. Create a new order request instead.
This avoids accidental double restoration or re-deduction.

## Inventory Movements

Inventory changes are tracked in `public.inventory_movements`.

For confirmed orders:

- `movement_type = order_confirmed`
- `quantity_change` is negative
- `reason = Stock deducted when order was confirmed`

For cancelled confirmed orders:

- `movement_type = order_cancelled_restore`
- `quantity_change` is positive
- `reason = Stock restored when confirmed order was cancelled`

Admins can review movement rows on the order detail page or at
`/admin/inventory`.

## Migration

Run this migration manually in the Supabase SQL Editor after migrations 001-006:

`supabase/migrations/007_order_status_inventory_workflow.sql`

The migration adds:

- Admin read policies for custom necklace order item tables.
- Admin select/insert policies for `inventory_movements`.
- The `public.update_order_status_inventory()` RPC.
- Authenticated execute access for active admins only.

Do not add service role keys to the frontend. Do not commit `.env.local`.

## Manual Test Checklist

1. Create product with stock `2`.
2. Customer submits order quantity `1`.
3. Admin sees order as `New`.
4. Stock remains `2`.
5. Admin marks `Contacted`.
6. Stock remains `2`.
7. Admin marks `Confirmed`.
8. Stock becomes `1`.
9. `inventory_movements` row is created with `-1`.
10. Admin marks `Paid`, `Packed`, then `Delivered`.
11. Stock stays `1`.
12. Create another order with quantity greater than stock.
13. Confirming shows the insufficient stock error.
14. Cancel confirmed order.
15. Stock restores.
16. `inventory_movements` row is created with `+1`.
17. Try reopening the cancelled order.
18. Admin sees: `Cancelled orders cannot be reopened in V1. Create a new order request instead.`
