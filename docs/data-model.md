# elara. Data Model

This document describes the Phase 2 Supabase-ready schema for the elara. storefront. The app still uses local mock data in Phase 2; this schema prepares the database layer for later product, inventory, custom necklace, and order workflows.

## Tables

### collections

Stores storefront groupings such as Ocean Collection, Dainty Collection, Gem Collection, Charm Bar, New Arrivals, and Best Sellers. Collections have a unique `slug`, display metadata, sorting, and an `is_active` flag.

### products

Stores every sellable or selectable catalog item. Regular jewelry, bracelets, chains, charms, pendants, and custom necklace placeholder products all live in this table. The `product_type` field controls how the item is used:

- `regular_product`: standard product listing
- `chain`: selectable chain for Build Your Necklace
- `charm`: selectable charm for Build Your Necklace
- `pendant`: selectable pendant for Build Your Necklace
- `bracelet`: bracelet product
- `custom_necklace`: parent/placeholder product type for custom necklace order items

Product rows include pricing, stock, low-stock threshold, flags for featured/new arrivals, SKU, material details, care instructions, and catalog sorting. Stock is constrained to never go below zero.

### product_images

Stores one or more image URLs per product. `is_primary` identifies the preferred storefront image, and `sort_order` controls gallery order. Actual upload/storage wiring belongs in a later phase.

### product_tags

Stores flexible product labels such as `heart`, `gold`, `pearl`, or `best seller`. These are separate rows so product filtering can grow without changing the `products` table shape.

### orders

Stores customer order requests. Customers do not pay on-site yet; elara. will contact them through Facebook, Instagram, or phone to confirm details, payment, and delivery.

The admin order workflow uses these statuses:

- `new`
- `contacted`
- `confirmed`
- `paid`
- `packed`
- `delivered`
- `cancelled`

`subtotal` and `estimated_total` are nonnegative. `stock_deducted_at`, `confirmed_at`, and `cancelled_at` support the inventory workflow.

### order_items

Stores line items for each order request. Regular products use `product_id`, `unit_price`, `quantity`, and `line_total`. Custom necklace orders use an `item_type` of `custom_necklace` and are expanded through the custom necklace tables.

### custom_necklace_items

Links one custom necklace order item to the selected chain. The table snapshots `chain_name` and `chain_price` at order time so future product edits do not change historical order details.

### custom_necklace_charms

Stores the selected charms or pendants for a custom necklace. Each row snapshots the selected item name, price, product reference, and quantity.

### inventory_movements

Audits every stock-changing event. The table records the product, optional order, movement type, quantity change, previous stock, new stock, reason, and timestamp.

Movement types:

- `manual_adjustment`
- `order_confirmed`
- `order_cancelled_restore`
- `restock`

### admin_activity_logs

Stores future admin audit events, such as product edits, inventory adjustments, order status changes, and collection updates. Auth/user attribution can be added once admin authentication exists.

## Regular Products

Regular storefront products are rows in `products` with `product_type = 'regular_product'` or another direct sellable type such as `bracelet`. They can belong to one collection, have many images and tags, and appear in orders through `order_items`.

## Chains, Charms, And Pendants

Chains, charms, and pendants are also products. This keeps pricing, stock, images, tags, active state, and inventory movements consistent across the whole catalog.

For Build Your Necklace:

- Chains use `product_type = 'chain'`.
- Charms use `product_type = 'charm'`.
- Pendants use `product_type = 'pendant'`.
- The builder filters active products by these product types.

## Custom Necklace Orders

A custom necklace order is stored as:

1. One `orders` row.
2. One `order_items` row with `item_type = 'custom_necklace'`.
3. One `custom_necklace_items` row for the selected chain.
4. One or more `custom_necklace_charms` rows for the selected charms or pendants.

The total price should be calculated by the application from the selected chain plus selected charms/pendants, then stored on the order item and order totals. Names and prices are snapshotted in custom necklace tables for historical accuracy.

## Stock Timing

Stock should not be deducted when a customer submits an order request. At that point, elara. still needs to confirm item availability, payment, and delivery details with the customer.

Stock deducts only when an admin marks the order as `confirmed`. The migration includes helper functions and a status-change trigger to deduct stock at confirmation time and write inventory movement records.

## Cancellation And Restoration

If a confirmed order is later marked `cancelled`, previously deducted stock should be restored. The migration includes restoration helpers that add stock back and create `order_cancelled_restore` inventory movements.

The schema prevents negative stock through product constraints and stock deduction checks. If any item has insufficient stock at confirmation time, the confirmation should fail so the admin can contact the customer.

## Recommended Next Implementation Order

1. Add Supabase client setup without exposing secrets.
2. Add read-only product and collection queries.
3. Add product image storage/upload conventions.
4. Build admin product and collection CRUD.
5. Build chain, charm, and pendant filtering for the necklace builder.
6. Add inventory adjustment screens backed by `inventory_movements`.
7. Add customer order request submission.
8. Add admin order viewer and status workflow.
9. Add admin authentication and production RLS policies before launch.
