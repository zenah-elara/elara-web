# Marina custom-length inventory investigation

## Reproduced cause

Migration 023's confirmation function first subtracts the requested quantity from
the exact variant and records a correct movement. It then unconditionally refreshes
ALL variants with size rows for products in that order from the sum of those rows.
For custom-only Gold=20/Silver=12 with stale zero-stock size rows, a Gold quantity-1
order records 20->19, then overwrites both Gold and Silver to zero. Cancellation
has the same unsafe refresh. This is a database mutation, not a display problem.

Zero-stock historical size rows can legitimately remain after changing sizing
mode to preserve inventory movement references. Do not blindly delete them.

## Existing correction

Migration 024 already removes these derived refreshes and uses the product's
current sizing mode. Custom-only variants use product_variants.stock_quantity;
selected_custom_length is customization, not a stock bucket. Exact variant UUIDs
are preserved by cart/checkout and validated against the product. Preset-size
products continue to use exact size rows. Restoration follows recorded source IDs.

No 025 is added: the checked-in 024 already handles this reproducible defect.
No applied migration was edited and no physical stock was guessed or reset.
Sold-out visibility and purchase restrictions are unchanged.

## Live verification required

There is no connected database session available in this task. Marina's actual
ID, mode, stock, stale rows, recent order, deployed RPC, and extra live triggers
have NOT been verified. The reproduction establishes a matching defect, not proof
of which version is deployed. Run this read-only script in Supabase SQL Editor:

```sh
pbcopy < "supabase/manual/diagnose_marina_variant_inventory.sql"
```

Review all result sets. If the deployed RPC still contains the unconditional
`coalesce(sum(psi.stock_quantity),0)` compatibility refresh from 023, apply the
existing `supabase/migrations/024_fix_variant_inventory_and_out_of_stock.sql`
through the project's migration workflow, after review. If 024 is already live,
inspect the returned trigger functions and order movements before changing SQL.
Do not reapply old migrations or create duplicate patches without that evidence.
Admin should reconcile stored quantities against verified physical inventory only
after the mutation issue is corrected; movement history cannot safely infer stock
after repeated manual corrections.

## Regression coverage

`tests/inventory-rpc.test.mjs` executes the actual 023 function to demonstrate the
zeroing, then 024 with the same stale rows for custom-length necklaces and bracelets.
It checks Gold 20->19 and 20->18, Silver 12->11, untouched sibling variants,
custom length 17 without size mutations/creation, exact movement source, repeated
confirmation, exact cancellation restoration and repeated cancellation.
`tests/checkout-inventory.test.mjs` verifies custom length and variant UUID persist
without selecting stale zero-stock size inventory.

Run the SQL suite using an isolated PGlite runtime (no live database writes):

```sh
ELARA_SQL_TEST_RUNTIME=/path/to/node_modules/@electric-sql/pglite node --test tests/inventory-rpc.test.mjs
node --test tests/checkout-inventory.test.mjs tests/catalog-availability.test.mjs tests/admin-stock.test.mjs
```
