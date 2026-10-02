# Exact inventory and sold-out visibility

## Deployment

Apply `supabase/migrations/024_fix_variant_inventory_and_out_of_stock.sql` in
Supabase SQL Editor after migrations 020 and 023. It replaces the existing
`update_order_status_inventory` RPC without rewriting stock or publication flags.
Do not reapply edited older migrations. No secrets or service-role key are needed.

To copy from the project directory:

```sh
pbcopy < "supabase/migrations/024_fix_variant_inventory_and_out_of_stock.sql"
```

The live applied function was not inspected or changed during development. The
repository's 020/023 functions already route valid variant IDs, but 023 chooses
inventory by matching-row existence rather than inventory mode, can skip missing
variant rows during validation, checks quantities before row locks, and refreshes
derived totals. The old Admin order preview also displayed parent stock for
variant orders. Apply 024 and test an actual order to confirm the live deployment.

## Inventory sources

| Mode | Deduct/restore source |
| --- | --- |
| Product only | `products.stock_quantity` |
| Finish/Color only | Selected `product_variants.id` |
| Preset sizes only | Exact product size row with `variant_id IS NULL` |
| Finish/Color + preset sizes | Exact variant + size row |

`order_items.variant_id` preserves the selected variant. `selected_size` is the
chosen size value; `selected_size_label` is its customer-facing caption (such as
Ring size), not the inventory lookup value. Confirmation resolves the size row
and records its stable `size_inventory_id` in `inventory_movements`. Cancellation
restores that ID even if size labels or product settings change later. Missing
original rows stop restoration rather than restoring to the wrong pool.

The first transition to Confirmed deducts aggregated quantities. Reconfirming
does not deduct twice. Cancellation restores once. Requests/Add to Cart do not
deduct. Products and exact inventory rows are locked before validation; all
changes run inside the RPC transaction, with an exception block rolling back
stock, movements, and status together. Size inventory is never deducted together
with generic product/variant stock. Builder parts retain product-level behavior.

## Storefront

Published, active regular products remain visible when sold out, with published
collection requirements preserved. Customer stock derives from active variants
and current size options. Admin physical totals still count inactive inventory.
Missing/zero size rows disable those options; sold-out selections disable Add to
Cart. Existing cards show stock labels and remain clickable. Product details,
photos, material, and care remain visible. Builder queries keep their stock-only
visibility rules. Existing in-stock-first Shop Products sorting remains intact.

Stock never automatically deactivates or unpublishes a product/collection.
Restocking uses live rows and normal catalog revalidation, so no republish or
redeploy is necessary. Order status changes revalidate public catalog routes.
Checkout rechecks exact pools and aggregates repeated cart lines, preventing
orders exceeding a bucket's current quantity.

## Checks

Automated availability tests:

```sh
node --test tests/catalog-availability.test.mjs tests/admin-stock.test.mjs
```

The RPC test uses isolated PostgreSQL (PGlite), with no live credentials or data.
Install a temporary runtime outside the project, then run:

```sh
npm install --prefix /private/tmp/elara-inventory-check --no-save @electric-sql/pglite
ELARA_SQL_TEST_RUNTIME=/private/tmp/elara-inventory-check/node_modules/@electric-sql/pglite node --test tests/inventory-rpc.test.mjs
```

After applying migration 024, manually verify:

1. Confirm a variant order with quantity 2: only its variant decreases by 2.
2. Confirm a variant + size order: only that size row changes; compare movement IDs.
3. Cancel each: exact stock restores once. Repeated confirmation/cancellation does
   not create duplicate movements.
4. Confirm an order containing an insufficient bucket: all stock/status remains
   unchanged and Admin shows a safe error.
5. Set all active sellable rows to zero: cards and direct details stay visible,
   display Out of stock, and block ordering.
6. Test one sold-out variant/size beside an available option; switching selections
   changes availability correctly. Restock and refresh to verify it is orderable.
7. Reduce stock after adding to cart: checkout blocks the unavailable selection.

Automated SQL tests use an isolated schema fixture. Live Supabase RLS and
concurrent sessions still need deployment verification; no live orders are
confirmed/cancelled automatically.
