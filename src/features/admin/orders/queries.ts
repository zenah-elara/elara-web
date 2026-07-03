import { requireAdminUser } from "@/features/auth/queries";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type {
  AdminInventoryMovement,
  AdminOrder,
  AdminOrderDetail,
} from "./types";
import type { Database } from "@/lib/supabase/types";

export type AdminOrderStatus =
  | Database["public"]["Tables"]["orders"]["Row"]["status"]
  | "all"
  | "incomplete";

export type AdminOrderFilters = {
  status?: AdminOrderStatus;
  q?: string;
  dateFrom?: string;
  dateTo?: string;
};

const statuses = [
  "new",
  "contacted",
  "confirmed",
  "paid",
  "packed",
  "delivered",
  "cancelled",
] as const;

export type AdminOrderCounts = Record<
  "all" | "incomplete" | (typeof statuses)[number],
  number
>;

function safeOrderWarning(queryName: string) {
  console.warn(`[admin orders] ${queryName} failed.`);
}

async function getRequiredAdminSupabase() {
  await requireAdminUser();
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  return supabase;
}

function normalizeFilters(filtersOrStatus?: AdminOrderFilters | AdminOrderStatus) {
  if (!filtersOrStatus) {
    return { status: "all" as AdminOrderStatus };
  }

  if (typeof filtersOrStatus === "string") {
    return { status: filtersOrStatus };
  }

  return {
    ...filtersOrStatus,
    status: filtersOrStatus.status ?? "all",
  };
}

function isIncompleteOrder(order: AdminOrder) {
  return (order.order_items ?? []).length === 0;
}

function getOrderSearchText(order: AdminOrder) {
  const itemText = (order.order_items ?? [])
    .flatMap((item) => [
      item.item_name,
      item.products?.name,
      ...(item.custom_necklace_items ?? []).flatMap((customItem) => [
        customItem.chain_name,
        ...(customItem.custom_necklace_charms ?? []).map(
          (charm) => charm.charm_name,
        ),
      ]),
    ])
    .filter(Boolean)
    .join(" ");

  return [
    order.order_number,
    order.customer_name,
    order.contact_number,
    order.facebook_link,
    order.instagram_username,
    itemText,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function applyAdminOrderFilters(
  orders: AdminOrder[],
  filters: AdminOrderFilters,
) {
  const status = filters.status ?? "all";
  const query = filters.q?.trim().toLowerCase();
  const fromTime = filters.dateFrom
    ? new Date(`${filters.dateFrom}T00:00:00`).getTime()
    : null;
  const toTime = filters.dateTo
    ? new Date(`${filters.dateTo}T23:59:59`).getTime()
    : null;

  return orders.filter((order) => {
    if (status === "incomplete" && !isIncompleteOrder(order)) {
      return false;
    }

    if (status !== "all" && status !== "incomplete" && order.status !== status) {
      return false;
    }

    if (query && !getOrderSearchText(order).includes(query)) {
      return false;
    }

    if (fromTime !== null || toTime !== null) {
      const createdTime = order.created_at
        ? new Date(order.created_at).getTime()
        : null;

      if (createdTime === null) {
        return false;
      }

      if (fromTime !== null && createdTime < fromTime) {
        return false;
      }

      if (toTime !== null && createdTime > toTime) {
        return false;
      }
    }

    return true;
  });
}

async function getAllAdminOrders(): Promise<AdminOrder[]> {
  const supabase = await getRequiredAdminSupabase();
  const { data, error } = await supabase
    .from("orders")
    .select(
      `
        *,
        order_items(
          *,
          products(name, slug, stock_quantity, product_type, product_images(*)),
          custom_necklace_items(
            *,
            custom_necklace_charms(*)
          )
        )
      `,
    )
    .order("created_at", { ascending: false });

  if (error) {
    safeOrderWarning("getAllAdminOrders");
    return [];
  }

  return (data ?? []) as AdminOrder[];
}

export async function getAdminOrders(
  filtersOrStatus: AdminOrderFilters | AdminOrderStatus = "all",
): Promise<AdminOrder[]> {
  const filters = normalizeFilters(filtersOrStatus);
  const orders = await getAllAdminOrders();

  return applyAdminOrderFilters(orders, filters);
}

export async function getAdminOrderById(
  orderId: string,
): Promise<AdminOrderDetail | null> {
  const supabase = await getRequiredAdminSupabase();
  const { data, error } = await supabase
    .from("orders")
    .select(
      `
        *,
        order_items(
          *,
          products(name, slug, stock_quantity, product_type, product_images(*)),
          custom_necklace_items(
            *,
            custom_necklace_charms(
              *,
              products(name, slug, stock_quantity, product_type, product_images(*))
            )
          )
        )
      `,
    )
    .eq("id", orderId)
    .maybeSingle();

  if (error) {
    safeOrderWarning("getAdminOrderById");
    return null;
  }

  return data as AdminOrderDetail | null;
}

export async function getInventoryMovementsByOrder(
  orderId: string,
): Promise<AdminInventoryMovement[]> {
  const supabase = await getRequiredAdminSupabase();
  const { data, error } = await supabase
    .from("inventory_movements")
    .select(
      `
        *,
        products(name, slug),
        orders(order_number)
      `,
    )
    .eq("order_id", orderId)
    .order("created_at", { ascending: false });

  if (error) {
    safeOrderWarning("getInventoryMovementsByOrder");
    return [];
  }

  return (data ?? []) as AdminInventoryMovement[];
}

export async function getRecentInventoryMovements(): Promise<
  AdminInventoryMovement[]
> {
  const supabase = await getRequiredAdminSupabase();
  const { data, error } = await supabase
    .from("inventory_movements")
    .select(
      `
        *,
        products(name, slug),
        orders(order_number)
      `,
    )
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    safeOrderWarning("getRecentInventoryMovements");
    return [];
  }

  return (data ?? []) as AdminInventoryMovement[];
}

export async function getNewOrdersCount() {
  const counts = await getOrderStatusCounts();
  return counts.new;
}

export async function getOrderStatusCounts(): Promise<AdminOrderCounts> {
  const orders = await getAllAdminOrders();

  return {
    all: orders.length,
    incomplete: orders.filter(isIncompleteOrder).length,
    ...Object.fromEntries(
      statuses.map((status) => [
        status,
        orders.filter((order) => order.status === status).length,
      ]),
    ),
  } as AdminOrderCounts;
}
