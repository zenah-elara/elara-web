import { getSupabasePublicServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

export type SiteAsset = Database["public"]["Tables"]["site_assets"]["Row"];

function safeSiteAssetWarning(queryName: string) {
  console.warn(`[site assets] ${queryName} failed; using fallback visual.`);
}

export async function getActiveSiteAssetByKey(
  key: string,
): Promise<SiteAsset | null> {
  const supabase = getSupabasePublicServerClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("site_assets")
    .select("*")
    .eq("key", key)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    safeSiteAssetWarning("getActiveSiteAssetByKey");
    return null;
  }

  return data;
}
