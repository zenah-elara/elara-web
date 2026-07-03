# Checkout Order Items Fix

This fix addresses the confirmed checkout case where an `orders` row was
created and appeared in admin, but `order_items` or Build Your Elara Piece
detail rows were missing afterward.

## Root Cause

The customer-facing checkout action created the parent `orders` row first, then
inserted child rows afterward. If the child insert failed, checkout returned a
partial-save message and the incomplete order could still appear in admin.

Schema review showed `order_items.product_id` is intended to be nullable, but
custom necklace parent item rows were still being saved with the chain product
id instead of as a true custom order item. Live Supabase projects can also fail
if later checkout insert grants/policies were missing, duplicated, or not
applied in order.

## Migrations 010 and 011

Migration `supabase/migrations/010_fix_order_item_and_custom_necklace_saving.sql`
was created.

It safely:

- Ensures `order_items.product_id` can be nullable.
- Recreates public insert policies for `orders`, `order_items`,
  `custom_necklace_items`, and `custom_necklace_charms`.
- Keeps public access write-only.
- Recreates active-admin read policies for order item and custom necklace rows.
- Keeps regular product validation requiring `product_id`.

Run migration 010 manually in Supabase SQL Editor after migrations 001-009.

Migration `supabase/migrations/011_fix_order_items_insert_schema_and_policies.sql`
was also created as a targeted follow-up. It:

- Keeps `order_items.product_id` nullable.
- Recreates the `order_items_item_type_check` constraint to allow
  `regular_product` and `custom_necklace`.
- Recreates insert policies for `order_items`, `custom_necklace_items`, and
  `custom_necklace_charms`.
- Requires regular product item rows to have `product_id`.
- Allows custom necklace parent rows to have `product_id = null`.

Run migration 011 manually in Supabase SQL Editor after migration 010.

## Regular Product Orders

Regular product checkout saves:

- `orders`
- `order_items.order_id`
- `order_items.product_id`
- `order_items.item_type = regular_product`
- `order_items.item_name`
- `order_items.unit_price`
- `order_items.quantity`
- `order_items.line_total`

The app validates that regular product cart items have a real product UUID.

## Build Your Elara Piece Orders

Custom piece checkout saves:

- One `order_items` row with `item_type = custom_necklace`,
  `product_id = null`, and item name `Build Your Elara Piece`
- One `custom_necklace_items` row with chain product, chain name, chain price,
  and chain length
- Optional connector row in `custom_necklace_charms` with
  `product_type = connector` and `arrangement_order = -1`
- Selected charms, pendants, and mini charms in `custom_necklace_charms` with
  normal arrangement order

Connector is separate from the movable arrangement.

## Error Handling

Checkout now returns success only after all required rows are saved.

Before creating the parent order row, checkout validates that every cart item
has the required product id, name, price, and quantity details. Invalid cart
state returns:

`Some cart items are missing product details. Please remove and add them again.`

If any child insert fails, the action:

- Logs the failing step in development only.
- Logs safe Supabase error fields: code, message, details, and hint.
- Does not log secrets or env values.
- Attempts a best-effort cleanup of the just-created order.
- Returns a customer-safe retry/contact message.

The cart clears only after full success.

If child rows fail after the parent order is created, the action attempts to
delete the just-created order. Existing broken test orders can be
ignored/cancelled manually.

## Admin Order Preview

Admin order detail shows an `Items ordered` preview.

Regular products show thumbnail, name, quantity, unit price, line total, and
product type.

Build Your Elara Piece orders show chain, length, connector when selected,
inside-connector/arrangement items, quantity, price, and total.

If an existing test order has no saved item rows, admin shows:

`No items were saved for this order. This order may be incomplete.`

Existing test orders without saved items can be ignored/cancelled manually.

## Header Height Note

The public header keeps the current logo size, nav font size, nav font style,
and cart icon size. The header was made thinner by tightening vertical spacing,
line-height, and alignment only.

## Manual Test Checklist

1. Regular product checkout saves order and items.
2. Customer sees success page with order number.
3. Admin order detail shows product thumbnail/name/quantity/price.
4. Build Your Elara Piece checkout saves order, chain, connector, and arranged items.
5. Customer sees success page with order number.
6. Admin order detail shows chain, length, connector, and inside-connector/arrangement items.
7. No partial-save message appears after successful order.
8. Cart clears only after success.
