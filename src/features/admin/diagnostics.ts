import { collections as mockCollections, products as mockProducts } from "@/lib/data";
import {
  getSupabaseServerClient,
  isSupabaseConfigured,
} from "@/lib/supabase/server";

type SeededCollection = {
  name: string;
  slug: string;
};

export type CatalogDiagnostics = {
  dataSource: "mock" | "supabase";
  isConfigured: boolean;
  safeStatusMessage: string;
  collectionsCount: number;
  productsCount: number;
  ordersCount: number;
  seededCollections: SeededCollection[];
  warnings: string[];
};

const safeQueryWarning =
  "A read-only Supabase check failed. Verify the migration, RLS read policies, and public anon configuration.";

async function getTableCount(
  tableName: "collections" | "products" | "orders",
) {
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return { count: 0, warning: safeQueryWarning };
  }

  const { count, error } = await supabase
    .from(tableName)
    .select("*", { count: "exact", head: true });

  if (error) {
    return { count: 0, warning: safeQueryWarning };
  }

  return { count: count ?? 0, warning: null };
}

export async function getCatalogDiagnostics(): Promise<CatalogDiagnostics> {
  if (!isSupabaseConfigured) {
    return {
      dataSource: "mock",
      isConfigured: false,
      safeStatusMessage:
        "Using mock fallback. Supabase env vars are not configured.",
      collectionsCount: mockCollections.length,
      productsCount: mockProducts.length,
      ordersCount: 0,
      seededCollections: mockCollections.map(({ name, slug }) => ({
        name,
        slug,
      })),
      warnings: [],
    };
  }

  const supabase = await getSupabaseServerClient();
  const warnings: string[] = [];

  if (!supabase) {
    return {
      dataSource: "mock",
      isConfigured: false,
      safeStatusMessage:
        "Using mock fallback. Supabase env vars are not configured.",
      collectionsCount: mockCollections.length,
      productsCount: mockProducts.length,
      ordersCount: 0,
      seededCollections: mockCollections.map(({ name, slug }) => ({
        name,
        slug,
      })),
      warnings: [],
    };
  }

  const [collectionsCount, productsCount, ordersCount, collectionsResult] =
    await Promise.all([
      getTableCount("collections"),
      getTableCount("products"),
      getTableCount("orders"),
      supabase
        .from("collections")
        .select("name, slug")
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true }),
    ]);

  for (const result of [collectionsCount, productsCount, ordersCount]) {
    if (result.warning && !warnings.includes(result.warning)) {
      warnings.push(result.warning);
    }
  }

  if (collectionsResult.error) {
    warnings.push(
      "Seeded collections could not be read safely. Check migration status and read policies.",
    );
  }

  return {
    dataSource: "supabase",
    isConfigured: true,
    safeStatusMessage:
      warnings.length > 0
        ? "Supabase is configured, but one or more read-only checks need attention."
        : "Supabase is configured and read-only catalog checks completed.",
    collectionsCount: collectionsCount.count,
    productsCount: productsCount.count,
    ordersCount: ordersCount.count,
    seededCollections: collectionsResult.error
      ? []
      : (collectionsResult.data ?? []).map(({ name, slug }) => ({ name, slug })),
    warnings,
  };
}
