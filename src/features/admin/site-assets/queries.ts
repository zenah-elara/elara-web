import { requireAdminUser } from "@/features/auth/queries";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

export type AdminSiteAsset = Database["public"]["Tables"]["site_assets"]["Row"];

async function getRequiredAdminSupabase() {
  await requireAdminUser();
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  return supabase;
}

export async function getAdminSiteAssetByKey(
  key: string,
): Promise<AdminSiteAsset | null> {
  const supabase = await getRequiredAdminSupabase();
  const { data, error } = await supabase
    .from("site_assets")
    .select("*")
    .eq("key", key)
    .maybeSingle();

  if (error) {
    console.warn("[admin site assets] getAdminSiteAssetByKey failed.");
    return null;
  }

  return data;
}
