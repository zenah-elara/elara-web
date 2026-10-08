# Existing Storage cache audit

Audit date: October 9, 2026 (Asia/Manila).

## Observed public-object response headers

Read-only discovery used public HTML from the local production build (backed by
the current Supabase catalog), the homepage, Shop Products, and up to 20 product
detail pages. Only HEAD requests were made to Storage; no image bodies were
downloaded by the audit script, and no cache-busting query parameters were added.

All 87 distinct referenced objects returned HTTP 200, Cache-Control: no-cache,
and cf-cache-status: MISS from the sampled edge:

| Bucket | Checked objects | Observed Cache-Control |
| --- | ---: | --- |
| product-images | 86 | no-cache |
| site-assets | 1 | no-cache |

Homepage image: site/homepage/1788957214801-img-0271-large.jpeg, Content-Length
195366 bytes. Product examples range from approximately 147 KB to 7.72 MB.
HEAD Content-Length describes original object size, not transferred audit bytes.

This is NOT complete bucket enumeration. Unreferenced files, old homepage assets,
draft products, and products beyond the inspected pages may remain. Stored
cacheControl metadata was not directly accessible through a connected authorized
Storage/database session. Served response headers were measured, not inferred.

no-cache permits storing a response but requires revalidation before reuse; it is
not no-store. A sampled MISS is not proof of all historical requests/billing.

## Can cache metadata be changed without replacing files?

No safe supported metadata-only cache update was established for the installed
Supabase client. StorageFileApi.update(path, fileBody, options) replaces the file,
and the source's updateMetadata method is commented out/unavailable.
Do not mistake user metadata for the HTTP Cache-Control header.

Supabase instructs users to treat storage schema records as read-only. Editing
storage.objects.metadata via SQL is not a supported way to synchronize the
underlying object and CDN headers. No such write was made or provided.

Therefore NO existing cache metadata, file bytes, dimensions, quality, paths,
URLs, bucket settings or policies were changed.

## What would be required instead?

1. Run supabase/manual/audit_existing_storage_cache.sql in SQL Editor to enumerate
   all objects and their stored cacheControl values. It contains SELECT only.
2. Compare stored values against the HEAD headers. If metadata already has a long
   max-age but the public endpoint serves no-cache, investigate with Supabase
   support before replacing anything. An upstream report describes this mismatch;
   it does not establish the cause or deployed version for this project.
3. With the currently supported SDK, changing the stored cacheControl normally
   requires fetching the ORIGINAL bytes and using update at the existing key with
   cacheControl: '31536000' and the original MIME type. The public URL can remain
   the same, but this IS a file replacement/re-upload, which was explicitly not
   authorized for this task. Do not execute it yet.
4. Any later approved replacement needs a backup, unchanged-byte checksum check,
   preserved MIME type, object/version review, and verification of public headers
   after CDN propagation. New headers do not instantly change already-cached
   browser responses. Alternatively a new unique path changes references/URLs;
   that also needs separate approval. Neither approach was implemented.
5. Server-side copy-to-self is not assumed to be a safe metadata-only solution:
   it replaces an object and an upstream copy report notes cache metadata issues.

## Current upload overwrite audit

All five application upload paths use unique UUID filenames, upsert:false and
cacheControl:'31536000':

- src/components/admin/product-image-uploader.tsx (shared product photos)
- src/components/admin/variant-image-uploader.tsx (variant photos)
- src/components/admin/homepage-image-form.tsx (homepage photo)
- src/components/admin/collection-image-uploader.tsx (collection cover)
- src/features/admin/catalog/actions.ts (server-side product uploads)

No application Storage update, copy, move, or upsert:true path was found.
Database row updates are not Storage object overwrites. Existing delete/cleanup
logic remains unchanged and was not executed. Dashboard/manual uploads outside
the repository are not covered by this code audit.

## Added files and validation

- scripts/audit-storage-cache.mjs: repeatable read-only public header probe;
  excludes credentials/query URLs, restricts Storage host/buckets, limits requests.
- supabase/manual/audit_existing_storage_cache.sql: complete read-only metadata
  inventory and per-bucket cache-control summary, to run manually.
- docs/existing-storage-cache-audit.md: this report.

Run the header probe against a running local build or the deployed public origin:

```sh
node scripts/audit-storage-cache.mjs http://localhost:3017
pbcopy < "supabase/manual/audit_existing_storage_cache.sql"
```

Lint, node syntax check and git diff --check passed. The live header probe completed
successfully. No app runtime code changed in this follow-up; no build was required.
Pre-existing image-optimization/inventory worktree changes were preserved.

## Sources

- [Supabase Storage schema](https://supabase.com/docs/guides/storage/schema/design)
  explains that direct SQL access is read-only and operations should use the API.
- [Supabase replace-file API](https://supabase.com/docs/reference/javascript/v1/storage-from-update)
  documents that update requires a file body.
- [Upstream public-header report](https://github.com/supabase/storage/issues/1290)
  reports no-cache despite stored cacheControl; requires project-specific diagnosis.
- [Upstream copy metadata report](https://github.com/supabase/storage/issues/1109)
  describes problems updating cacheControl via copy.
