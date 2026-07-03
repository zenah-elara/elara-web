"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminUser } from "@/features/auth/queries";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

type OrderStatus = Database["public"]["Tables"]["orders"]["Row"]["status"];
type OrderStatusRpcResult = {
  success: boolean;
  message: string;
};
type OrderStatusRpcClient = {
  rpc(
    fn: "update_order_status_inventory",
    args: {
      p_order_id: string;
      p_next_status: OrderStatus;
      p_internal_notes: string | null;
    },
  ): Promise<{ data: OrderStatusRpcResult[] | null; error: Error | null }>;
};

const validStatuses: OrderStatus[] = [
  "new",
  "contacted",
  "confirmed",
  "paid",
  "packed",
  "delivered",
  "cancelled",
];

function redirectWithMessage(path: string, message: string): never {
  redirect(`${path}?message=${encodeURIComponent(message)}`);
}

async function getAuthorizedSupabase() {
  await requireAdminUser();
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  return supabase;
}

export async function updateOrderWorkflow(orderId: string, formData: FormData) {
  const supabase = await getAuthorizedSupabase();
  const status = String(formData.get("status") ?? "") as OrderStatus;
  const internalNotes =
    String(formData.get("internal_notes") ?? "").trim() || null;

  if (!validStatuses.includes(status)) {
    redirectWithMessage(`/admin/orders/${orderId}`, "Invalid order status.");
  }

  const { data, error } = await (
    supabase as unknown as OrderStatusRpcClient
  ).rpc("update_order_status_inventory", {
    p_order_id: orderId,
    p_next_status: status,
    p_internal_notes: internalNotes,
  });

  if (error) {
    redirectWithMessage(
      `/admin/orders/${orderId}`,
      "Order status could not be updated.",
    );
  }

  const result = data?.[0];

  if (!result?.success) {
    redirectWithMessage(
      `/admin/orders/${orderId}`,
      result?.message ?? "Order status could not be updated.",
    );
  }

  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/products");
  revalidatePath("/admin/inventory");
  redirectWithMessage(
    `/admin/orders/${orderId}`,
    result?.message ?? "Order updated.",
  );
}

export async function deleteOrder(orderId: string, formData: FormData) {
  const supabase = await getAuthorizedSupabase();
  const confirmation = String(formData.get("confirmation") ?? "").trim();

  if (confirmation !== "DELETE") {
    redirectWithMessage(
      `/admin/orders/${orderId}`,
      "Type DELETE to confirm permanent order deletion.",
    );
  }

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, status, stock_deducted_at")
    .eq("id", orderId)
    .maybeSingle();
  const orderRecord = order as {
    id: string;
    status: OrderStatus;
    stock_deducted_at: string | null;
  } | null;

  if (orderError || !orderRecord) {
    redirectWithMessage(`/admin/orders/${orderId}`, "Order could not be found.");
  }

  if (
    orderRecord.stock_deducted_at &&
    orderRecord.status !== "cancelled"
  ) {
    redirectWithMessage(
      `/admin/orders/${orderId}`,
      "This order has deducted stock. Cancel it first to restore inventory before deleting.",
    );
  }

  const { data: orderItems, error: orderItemsError } = await supabase
    .from("order_items")
    .select("id")
    .eq("order_id", orderId);

  if (orderItemsError) {
    redirectWithMessage(
      `/admin/orders/${orderId}`,
      "Order items could not be checked before deletion.",
    );
  }

  const orderItemIds = ((orderItems ?? []) as { id: string }[]).map(
    (item) => item.id,
  );

  if (orderItemIds.length > 0) {
    const { data: customItems, error: customItemsError } = await supabase
      .from("custom_necklace_items")
      .select("id")
      .in("order_item_id", orderItemIds);

    if (customItemsError) {
      redirectWithMessage(
        `/admin/orders/${orderId}`,
        "Custom necklace rows could not be checked before deletion.",
      );
    }

    const customItemIds = ((customItems ?? []) as { id: string }[]).map(
      (item) => item.id,
    );

    if (customItemIds.length > 0) {
      const { error } = await supabase
        .from("custom_necklace_charms")
        .delete()
        .in("custom_necklace_item_id", customItemIds);

      if (error) {
        redirectWithMessage(
          `/admin/orders/${orderId}`,
          "Custom necklace charms could not be deleted.",
        );
      }

      const { error: customDeleteError } = await supabase
        .from("custom_necklace_items")
        .delete()
        .in("id", customItemIds);

      if (customDeleteError) {
        redirectWithMessage(
          `/admin/orders/${orderId}`,
          "Custom necklace rows could not be deleted.",
        );
      }
    }

    const { error } = await supabase
      .from("order_items")
      .delete()
      .eq("order_id", orderId);

    if (error) {
      redirectWithMessage(
        `/admin/orders/${orderId}`,
        "Order items could not be deleted.",
      );
    }
  }

  const { error: deleteError } = await supabase
    .from("orders")
    .delete()
    .eq("id", orderId);

  if (deleteError) {
    redirectWithMessage(
      `/admin/orders/${orderId}`,
      "Order could not be deleted.",
    );
  }

  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  redirect("/admin/orders?deleted=1");
}
