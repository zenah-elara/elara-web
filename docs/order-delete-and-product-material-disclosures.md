# Order Delete and Product Material Disclosures

## Homepage Pill Row Removal

The small hero pill row under the homepage CTA was removed. The homepage keeps the existing headline, subtext, CTA buttons, and the approved brand promise section.

## Admin Order Hard Delete

Admins now have a danger-zone delete form on each order detail page. The form requires typing `DELETE` before the action will run.

After a successful delete, the admin is redirected to:

`/admin/orders?deleted=1`

The orders list then shows:

`Order deleted.`

## Inventory Safety Rule

Hard delete is blocked when an order has `stock_deducted_at` set and the order is not `cancelled`.

The admin message is:

`This order has deducted stock. Cancel it first to restore inventory before deleting.`

This keeps V1 from deleting confirmed orders without restoring stock. Once an order is cancelled and inventory has been restored through the existing workflow, hard delete is allowed.

The delete action removes child rows first when needed:

- `custom_necklace_charms`
- `custom_necklace_items`
- `order_items`
- `orders`

Inventory movement rows are not manually deleted; the schema keeps them as audit records and sets `order_id` to null when the order row is deleted.

## Product Finish Setup

Migration `012_admin_order_delete_and_product_materials.sql` adds product finish disclosure fields:

- `finish_type`
- `finish_notes`

Allowed `finish_type` values:

- `gold_plated`
- `non_tarnish`

Admin product create/edit now includes a Finish / Material Disclosure section with:

- Not selected
- Gold-plated
- Non-tarnish
- Optional finish notes

## Customer-Facing Finish Badges

Finish badges appear subtly when a product has a selected finish:

- Product cards
- Product detail page
- Build Your Elara Piece item cards
- Cart item summaries

Admin order detail also shows finish labels where product joins are available.

## Customer Care Wording

Gold-plated:

Gold-plated pieces may eventually tarnish with frequent exposure to water, perfume, sweat, or chemicals. Keep dry and store properly for longer wear.

Non-tarnish:

Made for longer wear and designed not to tarnish under normal care. We still recommend keeping pieces dry and storing them properly.

## Manual Supabase Step

Run this migration manually in Supabase SQL Editor before relying on the new fields or order delete policies:

`supabase/migrations/012_admin_order_delete_and_product_materials.sql`

Do not paste service role keys into the frontend and do not commit `.env.local`.

## Manual Test Checklist

1. Homepage no longer shows the removed hero pill row.
2. Admin can delete an unconfirmed/new test order after typing `DELETE`.
3. Admin cannot delete a confirmed stock-deducted order until it is cancelled.
4. Cancelled/restored order can be deleted.
5. Product form has Gold-plated / Non-tarnish field.
6. Product card shows finish badge when selected.
7. Product detail shows care/finish explanation when selected.
8. Builder item cards show finish badge when selected.
9. Cart does not show exact stock counts and shows finish badge when selected.
10. Public users cannot delete orders.
