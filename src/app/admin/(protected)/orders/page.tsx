import Link from "next/link";
import { SectionHeader } from "@/components/section-header";
import {
  type AdminOrderFilters,
  getAdminOrders,
  getOrderStatusCounts,
  type AdminOrderStatus,
} from "@/features/admin/orders/queries";
import { formatPrice } from "@/lib/data";

const statusTabs: { label: string; value: AdminOrderStatus }[] = [
  { label: "All", value: "all" },
  { label: "New", value: "new" },
  { label: "Contacted", value: "contacted" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Paid", value: "paid" },
  { label: "Packed", value: "packed" },
  { label: "Delivered / Accomplished", value: "delivered" },
  { label: "Cancelled", value: "cancelled" },
  { label: "Incomplete", value: "incomplete" },
];

function formatDelivery(order: {
  delivery_method?: string | null;
  courier_service?: string | null;
}) {
  if (order.delivery_method === "bacolod_delivery") {
    return order.courier_service === "maxim"
      ? "Maxim / Bacolod Delivery"
      : "Grab Express / Bacolod Delivery";
  }

  if (order.delivery_method === "outside_bacolod_shipping") {
    return "J&T Express / Outside Bacolod";
  }

  if (order.delivery_method === "dropoff_store") {
    return "Drop-off at agreed store";
  }

  return "Not set";
}

function getOrderPreviewImage(order: Awaited<ReturnType<typeof getAdminOrders>>[number]) {
  const firstItem = order.order_items?.[0];
  const image =
    firstItem?.products?.product_images?.find((candidate) => candidate.is_primary) ??
    firstItem?.products?.product_images?.[0];

  return {
    imageUrl: image?.image_url ?? null,
    altText: image?.alt_text ?? firstItem?.item_name ?? "Order preview",
    label: !firstItem
      ? "No items"
      : firstItem.item_type === "custom_necklace"
        ? "Custom"
        : "Item",
  };
}

type AdminOrdersPageProps = {
  searchParams?: Promise<{
    status?: AdminOrderStatus;
    deleted?: string;
    q?: string;
    dateFrom?: string;
    dateTo?: string;
  }>;
};

export default async function AdminOrdersPage({
  searchParams,
}: AdminOrdersPageProps) {
  const params = await searchParams;
  const activeStatus = statusTabs.some((tab) => tab.value === params?.status)
    ? (params?.status ?? "all")
    : "all";
  const filters: AdminOrderFilters = {
    status: activeStatus,
    q: params?.q,
    dateFrom: params?.dateFrom,
    dateTo: params?.dateTo,
  };
  const [orders, counts] = await Promise.all([
    getAdminOrders(filters),
    getOrderStatusCounts(),
  ]);
  const hasActiveFilters = Boolean(
    activeStatus !== "all" || params?.q || params?.dateFrom || params?.dateTo,
  );

  function statusHref(status: AdminOrderStatus) {
    const query = new URLSearchParams();

    if (status !== "all") query.set("status", status);
    if (params?.q) query.set("q", params.q);
    if (params?.dateFrom) query.set("dateFrom", params.dateFrom);
    if (params?.dateTo) query.set("dateTo", params.dateTo);

    const suffix = query.toString();
    return suffix ? `/admin/orders?${suffix}` : "/admin/orders";
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <SectionHeader
        eyebrow="Admin"
        title="Orders"
        description="Review incoming order requests. Stock is deducted only after an admin marks an order Confirmed."
      />
      <div className="mt-5 flex flex-wrap gap-2">
        {[
          ["Back to Admin", "/admin"],
          ["Products", "/admin/products"],
          ["Collections", "/admin/collections"],
          ["Inventory", "/admin/inventory"],
        ].map(([label, href]) => (
          <Link
            key={href}
            href={href}
            className="rounded-full border border-[#d8b36a] bg-[#fffdf8] px-4 py-2 text-sm font-semibold text-[#76504a]"
          >
            {label}
          </Link>
        ))}
      </div>
      {params?.deleted === "1" ? (
        <div className="mt-6 rounded-2xl border border-[#d8b36a] bg-[#fff8e8] p-4 text-sm font-semibold text-[#7A3F63]">
          Order deleted.
        </div>
      ) : null}
      <div className="mt-6 flex flex-wrap gap-2">
        {statusTabs.map((tab) => (
          <Link
            key={tab.value}
            href={statusHref(tab.value)}
            className={`rounded-full border px-4 py-2 text-sm font-semibold ${
              activeStatus === tab.value
                ? "border-[#d8b36a] bg-[#fff1f6] text-rose"
                : "border-[#efccd4] bg-white/80 text-[#76504a]"
            }`}
          >
            {tab.label}
            {` (${counts[tab.value] ?? 0})`}
          </Link>
        ))}
      </div>
      <form
        action="/admin/orders"
        className="mt-5 grid gap-3 rounded-3xl border border-[#efccd4] bg-white/82 p-4 shadow-sm md:grid-cols-[160px_1fr_150px_150px_auto]"
      >
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#9d746d]">
            Status
          </span>
          <select
            name="status"
            defaultValue={activeStatus}
            className="mt-2 w-full rounded-2xl border border-[#efccd4] bg-[#fffaf8] px-3 py-2 text-sm font-semibold text-[#7A3F63]"
          >
            {statusTabs.map((tab) => (
              <option key={tab.value} value={tab.value}>
                {tab.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#9d746d]">
            Search
          </span>
          <input
            name="q"
            defaultValue={params?.q ?? ""}
            placeholder="Search product, item, customer, or order number"
            className="mt-2 w-full rounded-2xl border border-[#efccd4] bg-[#fffaf8] px-3 py-2 text-sm text-[#7A3F63]"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#9d746d]">
            Date from
          </span>
          <input
            name="dateFrom"
            type="date"
            defaultValue={params?.dateFrom ?? ""}
            className="mt-2 w-full rounded-2xl border border-[#efccd4] bg-[#fffaf8] px-3 py-2 text-sm text-[#7A3F63]"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#9d746d]">
            Date to
          </span>
          <input
            name="dateTo"
            type="date"
            defaultValue={params?.dateTo ?? ""}
            className="mt-2 w-full rounded-2xl border border-[#efccd4] bg-[#fffaf8] px-3 py-2 text-sm text-[#7A3F63]"
          />
        </label>
        <div className="flex items-end gap-2">
          <button className="rounded-full bg-[#d38aa0] px-4 py-2 text-sm font-semibold text-white shadow-sm">
            Apply
          </button>
          {hasActiveFilters ? (
            <Link
              href="/admin/orders"
              className="rounded-full border border-[#d8b36a] bg-[#fffdf8] px-4 py-2 text-sm font-semibold text-[#76504a]"
            >
              Clear
            </Link>
          ) : null}
        </div>
      </form>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          ["All", counts.all, "/admin/orders"],
          ["New", counts.new, "/admin/orders?status=new"],
          ["Delivered", counts.delivered, "/admin/orders?status=delivered"],
          ["Cancelled", counts.cancelled, "/admin/orders?status=cancelled"],
          ["Incomplete", counts.incomplete, "/admin/orders?status=incomplete"],
        ].map(([label, count, href]) => (
          <Link
            key={label}
            href={String(href)}
            className="rounded-2xl border border-[#efccd4] bg-[#fffaf8] p-3"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9d746d]">
              {label}
            </p>
            <p className="mt-1 text-xl font-semibold text-[#7A3F63]">
              {count}
            </p>
          </Link>
        ))}
      </div>
      <div className="mt-7 overflow-x-auto rounded-3xl border border-[#efccd4] bg-white/86 shadow-sm">
        <div className="min-w-[980px]">
          <div className="grid grid-cols-[58px_132px_1fr_170px_180px_106px_96px_116px_96px_76px] gap-3 border-b border-[#efccd4] bg-[#fff7fa] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9d746d]">
            <span>Preview</span>
            <span>Order</span>
            <span>Customer</span>
            <span>Contact</span>
            <span>Delivery</span>
            <span>Status</span>
            <span>Total</span>
            <span>Stock</span>
            <span>Created</span>
            <span>Action</span>
          </div>
          {orders.map((order) => {
            const preview = getOrderPreviewImage(order);

            return (
              <div
                key={order.id}
                className="grid grid-cols-[58px_132px_1fr_170px_180px_106px_96px_116px_96px_76px] items-center gap-3 border-b border-[#f5dce4] px-4 py-3 text-xs text-[#76504a] last:border-b-0"
              >
              <span className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl border border-[#efccd4] bg-[#fff1f6] text-[9px] font-semibold text-[#7A3F63]">
                {preview.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={preview.imageUrl}
                    alt={preview.altText}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  preview.label
                )}
              </span>
              <span className="font-semibold text-[#7A3F63]">
                {order.order_number}
              </span>
              <span>{order.customer_name}</span>
              <span className="leading-5">
                <span className="block font-semibold capitalize text-[#7A3F63]">
                  {order.preferred_contact_method}
                </span>
                <span>{order.contact_number}</span>
              </span>
              <span>{formatDelivery(order)}</span>
              <span className="rounded-full bg-[#fff1f6] px-2.5 py-1 text-center text-[11px] font-semibold text-rose">
                {order.status}
              </span>
              <span>{formatPrice(Number(order.estimated_total))}</span>
              <span
                className={`rounded-full px-2.5 py-1 text-center text-[11px] font-semibold ${
                  order.stock_deducted_at
                    ? "bg-[#fff8e8] text-[#8a6732]"
                    : order.status === "new" || order.status === "contacted"
                      ? "bg-[#fff1f6] text-rose"
                      : "bg-white text-[#76504a]"
                }`}
              >
                {order.stock_deducted_at
                  ? "Deducted"
                  : order.status === "new" || order.status === "contacted"
                    ? "Needs confirmation"
                    : "Not deducted"}
              </span>
              <span>
                {order.created_at
                  ? new Date(order.created_at).toLocaleDateString()
                  : "No date"}
              </span>
              <Link
                href={`/admin/orders/${order.id}`}
                className="rounded-full border border-[#d8b36a] bg-[#fffdf8] px-3 py-1.5 text-center text-xs font-semibold text-[#76504a]"
              >
                View
              </Link>
            </div>
            );
          })}
          {orders.length === 0 ? (
            <div className="px-5 py-8 text-sm text-[#76504a]">
              No orders match these filters.
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
