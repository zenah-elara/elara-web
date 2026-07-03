# Phase 4G Homepage and Collection Assets

Phase 4G cleans up public navigation and adds admin-managed storefront imagery.

## Header Home Link

The public header now gives customers two ways back to the landing page:

- The elara. logo links to `/`.
- A visible `Home` nav link also points to `/`.

The header keeps:

- Home
- Collections
- Build Your Necklace
- Cart icon

The Order Request button was not brought back.

## Public Footer

The customer-facing footer no longer shows an Admin link.

Public footer links are customer-focused:

- Collections
- Build Your Necklace
- Order Request
- Instagram
- Facebook

Admin access still exists through `/admin/login`, but it is not advertised in
the storefront footer.

## Homepage Pills Removed

The hero pill cards were removed from the homepage:

- Honest details
- Everyday pieces
- Fair prices

The deeper brand promise section remains.

## Homepage Hero Image Admin Flow

Admins can manage the homepage hero image at:

`/admin/homepage`

The page supports:

- Upload/change homepage hero image
- Title/label
- Alt text
- Preview current image
- Clear current image

The storefront reads the active `homepage_hero` record from `site_assets`.
If no image exists, the homepage keeps the branded fallback visual.

## Collection Thumbnail Admin Flow

Collection create/edit screens now support:

- Thumbnail upload
- Image alt text
- Existing image preview on edit
- Clear current thumbnail on edit

Storefront collection cards use `collections.image_url` when available.
Collection detail pages also display the uploaded image above the collection
intro. If no image exists, the existing branded fallback remains.

## Storage Buckets

Migration `009_site_assets_and_collection_images.sql` creates/recommends these
public buckets:

- `site-assets`
- `collection-images`

Storage paths:

- Homepage hero: `site/homepage/{filename}`
- Collection thumbnails: `collections/{collection-id}/{filename}`

The migration also adds storage policies:

- Public read for both buckets.
- Active admins can insert/update/delete objects in both buckets.

## Migration

Run this migration manually in Supabase SQL Editor after migrations 001-008:

`supabase/migrations/009_site_assets_and_collection_images.sql`

It adds:

- `public.site_assets`
- Public read policy for active site assets
- Admin manage policy for site assets
- `collections.image_url`
- `collections.image_alt_text`
- Storage bucket setup and storage policies

Do not commit `.env.local`. Do not expose service role keys.

## Product Image Delete Check

Product uploaded images still have Delete buttons on the admin edit page.
Deleting a primary product image promotes the next available image to primary.
This behavior was preserved.

## Manual Test Checklist

1. Logo or Home link returns to `/`.
2. Public footer no longer shows Admin.
3. Homepage no longer shows Honest details / Everyday pieces / Fair prices pill cards.
4. Admin can open `/admin/homepage`.
5. Admin can upload homepage hero image.
6. Homepage displays uploaded hero image.
7. Admin can upload collection thumbnail.
8. Collections page displays uploaded thumbnail.
9. Collection detail displays uploaded image if applicable.
10. Public storefront still works if no images are uploaded.
