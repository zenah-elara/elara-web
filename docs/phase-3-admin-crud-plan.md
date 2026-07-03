# Phase 3 Admin CRUD Plan

Phase 3 should connect the app to Supabase and begin replacing mock admin surfaces with real, protected workflows. Do not add payment in this phase.

## 1. Supabase Client Setup

- Install and configure `@supabase/supabase-js`.
- Add browser/server client helpers using environment variables.
- Do not commit secrets.
- Keep public storefront reads separate from admin writes.
- Add production RLS policies only after the auth approach is decided.

## 2. Admin Product CRUD

- Create product list, create, edit, archive/reactivate, and detail screens.
- Support product fields from the schema: name, slug, collection, type, SKU, price, stock, low-stock threshold, material details, care instructions, flags, and sort order.
- Validate allowed `product_type` values.
- Prevent deleting products used by order history; prefer archiving with `is_active = false`.

## 3. Collection CRUD

- Add create, edit, sort, activate, and archive workflows for collections.
- Keep seeded collection slugs stable unless intentionally renamed.
- Surface product counts per collection for admin context.

## 4. Product Image Upload

- Choose a Supabase Storage bucket convention for product images.
- Add upload, replace, delete, primary image, and image sort controls.
- Write image metadata to `product_images`.
- Use descriptive `alt_text` for accessibility and product browsing.

## 5. Chain And Charm Filtering

- Add admin filters for `chain`, `charm`, and `pendant` product types.
- Add storefront/builder queries that only show active items with available stock.
- Use tags and collection assignment to organize builder options.

## 6. Inventory Adjustment Screen

- Add manual stock adjustment forms.
- Write all stock changes to `inventory_movements`.
- Require a reason for manual adjustments.
- Highlight low-stock products using `low_stock_threshold`.
- Never allow negative stock.

## 7. Order Request Viewer

- Add an admin order list with status filters.
- Add order detail pages showing customer contact information, order notes, line items, and custom necklace selections.
- Add status transitions: new, contacted, confirmed, paid, packed, delivered, cancelled.
- Confirming an order should deduct stock.
- Cancelling a confirmed order should restore stock.
- Log admin actions to `admin_activity_logs`.

## Suggested Acceptance Criteria

- Admin can create and update collections and products.
- Admin can upload and manage product images.
- Admin can identify low-stock items.
- Admin can review order requests without payment integration.
- Stock only changes through inventory adjustments, confirmed orders, or confirmed-order cancellation restoration.
- RLS remains enabled and no unsafe public write policies are introduced.
