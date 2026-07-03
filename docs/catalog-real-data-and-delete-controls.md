# elara. Catalog Real Data and Delete Controls

## Public Catalog Data

When Supabase is configured, public storefront pages must show only real products created through Admin/Supabase. Mock or demo products from local development data must not appear on customer-facing pages.

Mock data can still exist for local unconfigured development, but configured/live mode does not mix real Supabase products with fallback products.

## Empty States

- Product listings: "Products are being updated. Please check back soon."
- Collection detail pages: "No products available in this collection yet."
- Build Your Elara Piece setup: "Build Your Elara Piece needs active builder products first. Add chain, charm, pendant, mini charm, or connector products in Admin to start using the builder."
- Missing chain products: "Add an active chain product with stock in Admin to start building."
- Missing builder item products: "Add active charms, pendants, mini charms, or connectors in Admin to make them available here."

## Build Your Elara Piece Filtering

The builder uses real active Supabase products only when Supabase is configured.

- Chains require `product_type = 'chain'`.
- Builder items require `product_type` of `charm`, `pendant`, `mini_charm`, or `connector`.
- Public builder products must be active and have stock greater than zero.
- Inactive and out-of-stock products are not shown publicly.

## Collection Hard Delete

Admin collection edit pages include a permanent delete form with confirmation. The admin must check the confirmation and click "I understand, delete this collection".

Deleting a collection does not delete products. The schema uses `products.collection_id references public.collections(id) on delete set null`, so product rows remain and their collection link is cleared by the database.

After delete, Admin redirects to `/admin/collections?deleted=1` and shows "Collection deleted."

## RLS and Migrations

Collection delete access is already covered by `supabase/migrations/004_admin_catalog_crud_policies.sql`, which grants delete to authenticated active admin profile users only. No public delete policy is added.

No migration 014 was needed for this change because the existing admin catalog CRUD migration already includes the collection delete policy.

## Header Logo Treatment

The public header uses `public/elara-logo.png` inside a horizontal soft-pink logo area. The image uses `object-contain`, is not cropped, and sits inside the soft blush/ivory/pink gradient header.

## Manual Test Checklist

1. Fake products no longer appear on homepage product sections when Supabase is configured.
2. Fake products no longer appear in collections when Supabase is configured.
3. Fake products no longer appear in Build Your Elara Piece when Supabase is configured.
4. If there are no real chains, builder shows the missing chain setup message.
5. If there are no real charms, pendants, mini charms, or connectors, builder shows the missing item setup message.
6. Only admin-created active products with stock appear publicly.
7. Admin can hard-delete a collection after confirmation.
8. Deleting a collection does not delete products.
9. Public users cannot delete collections.
10. Header logo is readable and not clipped.
11. Header logo area feels like a cleaner horizontal brand mark/banner, not an awkward tiny square or huge badge.
12. Header remains natural and not oversized.
13. Palette stays pink, blush, ivory, cream, and champagne.
