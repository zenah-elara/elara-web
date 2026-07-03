# Product Sizing and Customization

## Header Exact Sizing Fix

The public header uses a stable, non-cropping logo setup:

- Desktop header height: `96px`
- Desktop logo wrapper: `164px x 72px`
- Mobile header height: `82px`
- Mobile logo wrapper: `126px x 56px`
- Logo image: `object-contain`
- Logo position: center

The header does not use `object-cover`, negative margins, transforms, or a large visible logo badge/card.

## Product Types

Product setup now supports:

- `regular_product`
- `necklace`
- `bracelet`
- `ring`
- `chain`
- `charm`
- `mini_charm`
- `pendant`
- `connector`
- `custom_necklace`

Existing products remain supported.

## Ring Size Support

Ring sizes can be configured with size options such as:

`5, 6, 7, 8, 9`

Admins can enter only the sizes available for a specific ring. For example, a ring with only sizes 6 and 7 should use:

`6, 7`

Customers only see the options saved for that product.

## Bracelet Sizing

Bracelets can be fixed-size or customizable.

For customizable bracelets, enable size customization and add options such as:

`Small, Medium, Large`

or:

`6 inches, 6.5 inches, 7 inches`

For fixed bracelets, leave customization off and optionally add a fixed size note.

## Necklace and Chain Lengths

Necklaces/chains can be fixed or customizable.

For customizable chains, enable size customization and add available lengths such as:

`16 inches, 18 inches, 20 inches, Custom / to confirm`

For fixed chains, leave customization off and add a fixed size note if helpful.

## Data Model

Migration `013_product_sizing_and_customization.sql` adds:

- `products.is_size_customizable`
- `products.size_options`
- `products.size_label`
- `products.fixed_size_note`
- `order_items.selected_size`

## Admin Setup Guide

In product create/edit, use the Size / Length Options section:

1. Turn on `Customers can choose a size/length for this product` when selection is required.
2. Set a clear label like `Ring size`, `Necklace length`, `Bracelet size`, or `Length`.
3. Enter comma-separated options.
4. For fixed-size products, leave customization off and use Fixed size note.

## Customer Behavior

Product detail pages require a size/length selection only when:

- `is_size_customizable` is true
- `size_options` has at least one option

Fixed-size products show the fixed size note when available.

Cart and checkout summaries show the selected size/length for regular products.

Admin order detail shows selected size/length for regular product order rows.

## Build Your Elara Piece Chain Length Behavior

The builder asks for chain length only when the selected chain has:

- `is_size_customizable = true`
- one or more `size_options`

If the selected chain is fixed-size, the builder does not ask for length and shows the fixed size note when available.

## Manual Supabase Step

Run this migration manually in Supabase SQL Editor:

`supabase/migrations/013_product_sizing_and_customization.sql`

## Manual Test Checklist

1. Header is clean, no giant logo badge, no clipped logo.
2. Header logo uses exact sizing and object-contain.
3. Admin can create ring with sizes 6 and 7 only.
4. Product detail shows only sizes 6 and 7.
5. Cart shows selected ring size.
6. Admin order detail shows selected ring size.
7. Admin can create chain with customizable lengths.
8. Builder asks for length only for customizable chain.
9. Admin can create fixed chain.
10. Builder does not ask for length for fixed chain.
11. Bracelet can be fixed or customizable.
