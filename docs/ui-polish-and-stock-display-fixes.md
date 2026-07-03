# UI Polish and Stock Display Fixes

## Scope

This pass focused on small public UI polish, customer-safe stock language, a header logo crop fix, and a more compact admin orders table.

## Customer Stock Display

Customer-facing product surfaces no longer show exact stock counts. The storefront now uses customer-safe labels:

- `In stock` when stock is above the low-stock threshold.
- `Low stock` when `stock_quantity <= low_stock_threshold`.
- `Out of stock` when stock is zero or below.

The low-stock threshold comes from `products.low_stock_threshold` when Supabase data is available. Mock products fall back to the default threshold used by the stock badge.

Exact quantities remain available in admin inventory and admin order detail views where operational stock counts are useful.

## Updated Public Surfaces

- Product cards use the customer-safe stock badge.
- Product detail pages use the customer-safe stock badge.
- Cart items no longer show exact stock counts.
- The necklace builder shows availability without exposing exact item counts.
- Checkout validation copy no longer tells customers the exact remaining quantity.

## Header Logo Crop

The header still uses `public/elara-logo.png`. The logo remains inside the existing fixed frame, but its object position was adjusted so the top loop of the script wordmark is not clipped while keeping the header height controlled.

## Admin Orders Compacting

The admin orders list was tightened without changing order data logic:

- Reduced table minimum width.
- Combined preferred contact method and phone into one compact column.
- Reduced preview size, row padding, and column gaps.
- Kept status, stock deduction state, totals, created date, and view action visible.

## Storefront Polish

The public storefront received restrained visual polish:

- Product and collection cards have cleaner borders, softer shadows, and more intentional hover states.
- Section eyebrows now read as subtle champagne labels.
- Buttons have slightly more polished hover states.
- A few older cocoa/brown text accents were shifted toward the elara. rose/plum palette.

## Guardrails

No changes were made to:

- Environment files or secrets.
- Supabase migrations.
- Payment.
- Auth.
- Product CRUD behavior.
- Builder logic beyond customer-facing stock wording.
- Order saving logic.
