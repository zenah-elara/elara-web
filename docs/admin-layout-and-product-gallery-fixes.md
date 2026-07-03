# Admin Layout and Product Gallery Fixes

## Customer Product Gallery

Public product detail pages now use an interactive product image gallery.

- The primary image is shown first.
- Additional images appear as thumbnails.
- Clicking a thumbnail changes the main image.
- Previous and next controls are available when there is more than one image.
- Image alt text is used when available.
- Product name is used as fallback alt text.
- If no product images exist, the branded placeholder is shown.

## Admin-Only Layout and Navigation

Admin routes no longer show the public storefront header/footer.

Protected admin routes now use a dedicated admin header with:

- Admin Dashboard
- Orders
- Products
- Add Product
- Collections
- Add Collection
- View Store
- Sign out

This removes customer-facing admin confusion from links such as Cart, public
Collections, Build Your Necklace, and Order Request.

## Accessing the Public Store From Admin

Admins can use the `View Store` link in the admin navigation to return to the
public storefront homepage.

Admin collection, product, and order pages also include clear admin navigation
buttons such as Back to Admin, Products, Collections, Orders, Add Product, and
Add Collection.

## Deleted Product Visibility

Public catalog product detail lookup no longer falls back to mock data when
Supabase successfully returns no matching active product.

This prevents deleted or inactive Supabase products from reappearing on public
product pages because of mock fallback data. Mock fallback is still used only
when Supabase is unavailable or a query fails.

Admin product create, update, deactivate, image changes, and delete now
revalidate storefront catalog paths more broadly, including:

- `/`
- `/collections`
- `/products`
- affected `/products/[slug]` pages when known

## Manual Testing Checklist

- Product detail can switch between multiple images.
- Product detail next/previous works when multiple images exist.
- Product detail shows placeholder when no images exist.
- Admin dashboard does not show Order Request, Cart, or customer nav.
- Admin collections page has Back to Admin.
- Admin products page has Back to Admin.
- Admin orders page has Back to Admin.
- View Store takes admin to public homepage.
- Deleted product no longer appears publicly.
- Deactivated product does not appear publicly.
- Public storefront still has normal customer header/footer.
