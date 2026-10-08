// Read-only audit: public page HTML and Storage HEAD requests, never image bodies.
// No credentials, env files, uploads, metadata writes, or cache-busting URLs.
const site = new URL(process.argv[2] ?? "http://localhost:3017");
if (!['http:', 'https:'].includes(site.protocol) || site.username || site.password || site.search) {
  throw new Error("Supply a public site origin without credentials or query parameters.");
}
const storageHost = "qrfdfgwbdxlyhnnnonkn.supabase.co";
const objects = new Set();
const productPages = new Set();

function record(value) {
  try {
    const url = new URL(value.replaceAll("&amp;", "&"), site);
    if (url.pathname === "/_next/image") {
      record(url.searchParams.get("url") ?? "");
    } else if (url.protocol === "https:" && url.hostname === storageHost &&
      /^\/storage\/v1\/object\/public\/(product-images|site-assets)\//.test(url.pathname) &&
      !url.search && !url.username && !url.password) {
      objects.add(url.href);
    }
  } catch { /* Ignore non-image HTML fragments. */ }
}

async function inspectPage(path) {
  const response = await fetch(new URL(path, site), { signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error(`Public page ${path} returned ${response.status}.`);
  const html = await response.text();
  for (const match of html.matchAll(/(?:src|srcset)="([^"]+)"/g)) {
    for (const candidate of match[1].split(",")) record(candidate.trim().split(/\s/)[0]);
  }
  // Galleries are serialized in page props even when a thumbnail is not rendered yet.
  for (const match of html.matchAll(/https:\/\/[^\s"<>\\]+/g)) record(match[0]);
  for (const match of html.matchAll(/href="(\/products\/[^"?#]+)"/g)) productPages.add(match[1]);
}

await inspectPage("/");
await inspectPage("/shop-products");
for (const path of [...productPages].slice(0, 20)) await inspectPage(path);
console.log("Publicly referenced objects only; does not enumerate orphaned, draft, or private bucket objects.");
console.log("bucket\tpath\tstatus\tcache-control\tcontent-length\tage\tcdn-cache");
for (const value of [...objects].slice(0, 100)) {
  const url = new URL(value);
  const [bucket, ...path] = url.pathname.split("/object/public/")[1].split("/");
  try {
    const response = await fetch(url, { method: "HEAD", redirect: "error", signal: AbortSignal.timeout(20000) });
    console.log([bucket, path.join("/"), response.status,
      response.headers.get("cache-control") ?? "unknown",
      response.headers.get("content-length") ?? "unknown",
      response.headers.get("age") ?? "unknown",
      response.headers.get("cf-cache-status") ?? "unknown"].join("\t"));
  } catch {
    console.log([bucket,path.join("/"),"HEAD failed; no body downloaded"].join("\t"));
  }
}
console.log(`Found ${objects.size} referenced objects; checked at most 100. Inspected at most 20 product pages.`);
