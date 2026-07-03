import { requireAdminUser } from "@/features/auth/queries";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type {
  AdminCollection,
  AdminProduct,
  AdminProductFilters,
} from "./types";

function safeAdminWarning(queryName: string) {
  console.warn(`[admin catalog] ${queryName} failed.`);
}

async function getRequiredAdminSupabase() {
  await requireAdminUser();
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  return supabase;
}

export async function getAdminCollections(): Promise<AdminCollection[]> {
  const supabase = await getRequiredAdminSupabase();
  const { data, error } = await supabase
    .from("collections")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    safeAdminWarning("getAdminCollections");
    return [];
  }

  return data ?? [];
}

export async function getAdminCollectionById(
  collectionId: string,
): Promise<AdminCollection | null> {
  const supabase = await getRequiredAdminSupabase();
  const { data, error } = await supabase
    .from("collections")
    .select("*")
    .eq("id", collectionId)
    .maybeSingle();

  if (error) {
    safeAdminWarning("getAdminCollectionById");
    return null;
  }

  return data;
}

export async function getAdminProducts(
  filters: AdminProductFilters = {},
): Promise<AdminProduct[]> {
  const supabase = await getRequiredAdminSupabase();
  let query = supabase
    .from("products")
    .select(
      `
        *,
        collections(id, name, slug),
        product_images(*),
        product_tags(*)
      `,
    )
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (filters.status === "active") {
    query = query.eq("is_active", true);
  }

  if (filters.status === "inactive") {
    query = query.eq("is_active", false);
  }

  if (filters.productType && filters.productType !== "all") {
    query = query.eq("product_type", filters.productType);
  }

  if (filters.collectionId && filters.collectionId !== "all") {
    query = query.eq("collection_id", filters.collectionId);
  }

  const { data, error } = await query;

  if (error) {
    safeAdminWarning("getAdminProducts");
    return [];
  }

  const products = (data ?? []) as AdminProduct[];

  if (filters.lowStock) {
    return products.filter(
      (product) => product.stock_quantity <= product.low_stock_threshold,
    );
  }

  return products;
}

export async function getAdminProductById(
  productId: string,
): Promise<AdminProduct | null> {
  const supabase = await getRequiredAdminSupabase();
  const { data, error } = await supabase
    .from("products")
    .select(
      `
        *,
        collections(id, name, slug),
        product_images(*),
        product_tags(*)
      `,
    )
    .eq("id", productId)
    .maybeSingle();

  if (error) {
    safeAdminWarning("getAdminProductById");
    return null;
  }

  return data as AdminProduct | null;
}
