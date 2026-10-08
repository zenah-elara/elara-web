-- READ ONLY: complete bucket inventory, including unreferenced/draft objects.
-- Run manually in Supabase SQL Editor. Do NOT UPDATE storage.objects metadata.
select bucket_id, name, created_at, updated_at,
  metadata->>'cacheControl' as stored_cache_control,
  metadata->>'size' as stored_size_bytes,
  metadata->>'mimetype' as mime_type
from storage.objects
where bucket_id in ('product-images', 'site-assets')
order by bucket_id, name;

-- Metadata does not prove what a CDN edge actually serves. Compare with HEAD
-- requests to unchanged public URLs; do not add cache-busting query parameters.
select bucket_id, metadata->>'cacheControl' as stored_cache_control,
  count(*) as object_count
from storage.objects
where bucket_id in ('product-images', 'site-assets')
group by bucket_id, metadata->>'cacheControl'
order by bucket_id, stored_cache_control;
