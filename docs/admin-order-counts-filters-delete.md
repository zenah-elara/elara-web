# Admin Order Counts, Filters, Delete, and Header Logo

## Header Logo Fix

The public header still uses `public/elara-logo.png` and does not crop or replace the logo.

Final sizing:

- Mobile/base wrapper: `134px` wide, `84px` tall.
- Tablet wrapper: `164px` wide, `94px` tall.
- Desktop wrapper: `196px` wide, `108px` tall.
- Image fit: `object-contain`.
- Image position: centered.

The header is slightly taller so the full square logo can display without clipping or overflow.

## Count Mismatch Root Cause

The admin orders list query was selecting the new `finish_type` product column through the nested product relationship. If migration `012_admin_order_delete_and_product_materials.sql` had not been applied yet, that nested select could fail and return an empty orders list, while dashboard diagnostics could still count order rows.

The orders list no longer depends on `finish_type`, so it remains readable even before the material disclosure migration is applied.

## Final Count Logic

The dashboard order metrics and `/admin/orders?status=all` now use the same admin orders query/count logic.

Dashboard order metrics include:

- Total Orders
- New Orders
- Contacted
- Confirmed
- Paid
- Packed
- Delivered / Accomplished
- Cancelled
- Incomplete

Incomplete orders are orders with zero saved `order_items`. They are not hidden; they are visible under the Incomplete filter.

## Status Filters

`/admin/orders` defaults to All.

Supported status query params:

- `/admin/orders?status=all`
- `/admin/orders?status=new`
- `/admin/orders?status=contacted`
- `/admin/orders?status=confirmed`
- `/admin/orders?status=paid`
- `/admin/orders?status=packed`
- `/admin/orders?status=delivered`
- `/admin/orders?status=cancelled`
- `/admin/orders?status=incomplete`

Each tab shows a count from the same source used by the table.

## Product and Search Filter

The text search field uses the `q` query param:

`/admin/orders?q=bow`

It searches:

- order number
- customer name
- contact details
- regular order item names
- joined product names
- custom necklace chain names
- custom necklace charm names

## Date Filters

Date filters use `created_at`:

- `dateFrom`
- `dateTo`

Example:

`/admin/orders?dateFrom=2026-06-01&dateTo=2026-06-10`

## Clear Filters

The Clear button returns to:

`/admin/orders`

This restores the All orders list.

## Order Delete Behavior

Each order detail page has a danger-zone delete form. Admin must type `DELETE` before the hard-delete action runs.

After a successful delete, admin is redirected to:

`/admin/orders?deleted=1`

The list shows:

`Order deleted.`

## Inventory Safety Rule

If `stock_deducted_at` is set and the order status is not `cancelled`, hard delete is blocked.

The order must be cancelled first so the existing inventory workflow can restore stock before the row is removed.

## Migration Step

Run this migration manually in Supabase SQL Editor if it has not already been applied:

`supabase/migrations/012_admin_order_delete_and_product_materials.sql`

It adds admin delete policies for order cleanup and product finish disclosure columns.

## Manual Test Checklist

1. Header logo is larger, readable, not clipped, and not overflowing.
2. Dashboard Orders count matches `/admin/orders?status=all`.
3. New Orders button only shows status `new`.
4. Cancelled tab only shows `cancelled`.
5. Product/item search finds an order by product name.
6. Date filter works by created date.
7. Clear filters restores list.
8. Incomplete orders are visible under Incomplete.
9. New/test order can be deleted after confirmation.
10. Confirmed stock-deducted order cannot be deleted until cancelled.
11. Cancelled/restored order can be deleted.
12. Public users cannot delete orders.
