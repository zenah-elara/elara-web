import { notFound } from "next/navigation";
import { FinishBadge } from "@/components/finish-badge";
import { SectionHeader } from "@/components/section-header";
import {
  deleteOrder,
  updateOrderWorkflow,
} from "@/features/admin/orders/actions";
import {
  getAdminOrderById,
  getInventoryMovementsByOrder,
} from "@/features/admin/orders/queries";
import type { AdminOrderItem } from "@/features/admin/orders/types";
import { formatPrice } from "@/lib/data";

type AdminOrderDetailPageProps = {
  params: Promise<{ orderId: string }>;
  searchParams?: Promise<{ message?: string }>;
};

const statusOptions = [
  "new",
  "contacted",
  "confirmed",
  "paid",
  "packed",
  "delivered",
  "cancelled",
] as const;

function formatStatus(status: string) {
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatDateTime(value: string | null) {
  return value ? new Date(value).toLocaleString() : "Not set";
}

function getPrimaryImage(
  product: AdminOrderItem["products"] | NonNullable<
    NonNullable<
      NonNullable<AdminOrderItem["custom_necklace_items"]>[number]["custom_necklace_charms"]
    >[number]["products"]
  >,
) {
  return (
    product?.product_images?.find((image) => image.is_primary) ??
    product?.product_images?.[0] ??
    null
  );
}

function ProductThumb({
  imageUrl,
  alt,
  label,
}: {
  imageUrl?: string | null;
  alt: string;
  label?: string;
}) {
  return (
    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[#efccd4] bg-[#fff1f6] text-xs font-semibold text-[#7A3F63]">
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt={alt} className="h-full w-full object-cover" />
      ) : (
        label ?? "elara."
      )}
    </div>
  );
}

type StockPreviewRow = {
  key: string;
  name: string;
  quantity: number;
  stock: number | null;
  label?: string;
};

function getStockPreviewRows(items: AdminOrderItem[] | null): StockPreviewRow[] {
  return (items ?? []).flatMap((item) => {
    if (item.item_type !== "custom_necklace") {
      return [
        {
          key: item.id,
          name: item.item_name,
          quantity: item.quantity,
          stock: item.products?.stock_quantity ?? null,
        },
      ];
    }

    const customItems = item.custom_necklace_items ?? [];

    return customItems.flatMap((customItem) => {
      const rows: StockPreviewRow[] = [
        {
          key: `${item.id}-${customItem.id}-chain`,
          name: customItem.chain_name,
          quantity: 1,
          stock: item.products?.stock_quantity ?? null,
          label: "Chain",
        },
      ];

      rows.push(
        ...(customItem.custom_necklace_charms ?? []).map((selected) => ({
          key: selected.id,
          name: selected.charm_name,
          quantity: selected.quantity,
          stock: selected.products?.stock_quantity ?? null,
          label: (selected.product_type ?? "charm").replace("_", " "),
        })),
      );

      return rows;
    });
  });
}

export default async function AdminOrderDetailPage({
  params,
  searchParams,
}: AdminOrderDetailPageProps) {
  const [{ orderId }, query] = await Promise.all([params, searchParams]);
  const [order, inventoryMovements] = await Promise.all([
    getAdminOrderById(orderId),
    getInventoryMovementsByOrder(orderId),
  ]);

  if (!order) {
    notFound();
  }

  const deliveryTitle =
    order.delivery_method === "bacolod_delivery"
      ? order.courier_service === "maxim"
        ? "Maxim / Bacolod Delivery"
        : "Grab Express / Bacolod Delivery"
      : order.delivery_method === "outside_bacolod_shipping"
        ? "J&T Express / Outside Bacolod Shipping"
        : order.delivery_method === "dropoff_store"
          ? "Drop-off at agreed store"
          : "Delivery not set";
  const deliveryDetail =
    order.delivery_method === "outside_bacolod_shipping"
      ? order.shipping_address
      : order.delivery_method === "dropoff_store"
        ? order.dropoff_location
        : order.delivery_location;
  const statusBadgeClass =
    order.status === "cancelled"
      ? "border-[#e9a3ad] bg-[#fff1f4] text-[#a33d5e]"
      : order.status === "confirmed" ||
          order.status === "paid" ||
          order.status === "packed" ||
          order.status === "delivered"
        ? "border-[#d8b36a] bg-[#fff8e8] text-[#8a6732]"
        : "border-[#efccd4] bg-[#fff1f6] text-rose";
  const stockPreviewRows = getStockPreviewRows(order.order_items);
  const hasSavedItems = (order.order_items ?? []).length > 0;

  return (
    <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <SectionHeader
        eyebrow="Admin order"
        title={order.order_number}
        description="Review the request, confirm customer details, and update the order status. Stock deducts only when the order is marked Confirmed."
      />
      {query?.message ? (
        <div className="mt-6 rounded-2xl border border-[#efd2bc] bg-[#fff7ef] p-4 text-sm font-medium text-[#76504a]">
          {query.message}
        </div>
      ) : null}
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
        <div className="rounded-3xl boutique-card p-6">
          <h2 className="text-2xl font-semibold text-[#7A3F63]">
            Items ordered
          </h2>
          <div className="mt-5 space-y-4">
            {!hasSavedItems ? (
              <div className="rounded-2xl border border-[#efd2bc] bg-[#fff7ef] p-4 text-sm font-semibold text-[#76504a]">
                No items were saved for this order. This order may be
                incomplete.
              </div>
            ) : null}
            {(order.order_items ?? []).map((item) => {
              if (item.item_type !== "custom_necklace") {
                const primaryImage = getPrimaryImage(item.products);

                return (
                  <div
                    key={`${item.id}-preview`}
                    className="flex gap-4 rounded-2xl border border-[#efccd4] bg-[#fffaf8] p-4"
                  >
                    <ProductThumb
                      imageUrl={primaryImage?.image_url}
                      alt={primaryImage?.alt_text ?? item.item_name}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-[#7A3F63]">
                        {item.item_name}
                      </p>
                      <p className="mt-1 text-xs text-[#76504a]">
                        {item.products?.product_type?.replace("_", " ") ??
                          "product"}
                      </p>
                      <div className="mt-2">
                        <FinishBadge finishType={item.products?.finish_type} />
                      </div>
                      <div className="mt-3 grid gap-2 text-sm text-[#76504a] sm:grid-cols-3">
                        <span>Qty: {item.quantity}</span>
                        <span>Unit: {formatPrice(Number(item.unit_price))}</span>
                        <span>Total: {formatPrice(Number(item.line_total))}</span>
                      </div>
                      {item.selected_size ? (
                        <p className="mt-2 text-xs font-semibold text-[#7A3F63]">
                          Size / length: {item.selected_size}
                        </p>
                      ) : null}
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={`${item.id}-preview`}
                  className="rounded-2xl border border-[#efccd4] bg-[#fffaf8] p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-[#7A3F63]">
                        Custom Necklace
                      </p>
                      <p className="mt-1 text-sm text-[#76504a]">
                        Total: {formatPrice(Number(item.line_total))}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 space-y-4">
                    {(item.custom_necklace_items ?? []).map((customItem) => {
                      const chainImage = getPrimaryImage(item.products);
                      const customRows =
                        customItem.custom_necklace_charms ?? [];
                      const connectors = customRows.filter(
                        (selected) => selected.product_type === "connector",
                      );
                      const arrangedItems = customRows
                        .filter((selected) => selected.product_type !== "connector")
                        .sort(
                          (a, b) =>
                            (a.arrangement_order ?? 0) -
                            (b.arrangement_order ?? 0),
                        );
                      const connector = connectors[0] ?? null;
                      const connectorImage = connector
                        ? getPrimaryImage(connector.products)
                        : null;

                      return (
                        <div key={`${customItem.id}-preview`}>
                          <div className="grid gap-3 rounded-2xl bg-white/75 p-3 sm:grid-cols-2">
                            <div className="flex gap-3">
                              <ProductThumb
                                imageUrl={chainImage?.image_url}
                                alt={chainImage?.alt_text ?? customItem.chain_name}
                                label="Chain"
                              />
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#c6a15a]">
                                  Chain
                                </p>
                                <p className="font-semibold text-[#7A3F63]">
                                  {customItem.chain_name}
                                </p>
                                  <p className="text-sm text-[#76504a]">
                                    Length: {customItem.chain_length ?? "Not set"}
                                  </p>
                                  <div className="mt-2">
                                    <FinishBadge
                                      finishType={item.products?.finish_type}
                                    />
                                  </div>
                                </div>
                            </div>
                            {connector ? (
                              <div className="flex gap-3">
                                <ProductThumb
                                  imageUrl={connectorImage?.image_url}
                                  alt={connectorImage?.alt_text ?? connector.charm_name}
                                  label="Conn"
                                />
                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#c6a15a]">
                                    Connector
                                  </p>
                                  <p className="font-semibold text-[#7A3F63]">
                                    {connector.charm_name}
                                  </p>
                                  <p className="text-sm text-[#76504a]">
                                    {formatPrice(Number(connector.charm_price))}
                                  </p>
                                  <div className="mt-2">
                                    <FinishBadge
                                      finishType={connector.products?.finish_type}
                                    />
                                  </div>
                                </div>
                              </div>
                            ) : null}
                          </div>
                          <div className="mt-4 rounded-2xl border border-[#f0c9d6] bg-white/75 p-4">
                            <p className="font-semibold text-[#7A3F63]">
                              {connector ? "Inside connector" : "Arrangement"}
                            </p>
                            <div className="mt-3 grid gap-3 sm:grid-cols-2">
                              {arrangedItems.map((selected, index) => {
                                const image = getPrimaryImage(selected.products);

                                return (
                                  <div
                                    key={`${selected.id}-preview`}
                                    className="flex gap-3 rounded-2xl bg-[#fff7fa] p-3"
                                  >
                                    <ProductThumb
                                      imageUrl={image?.image_url}
                                      alt={image?.alt_text ?? selected.charm_name}
                                      label={String(index + 1)}
                                    />
                                    <div>
                                      <p className="font-semibold text-[#7A3F63]">
                                        {index + 1}. {selected.charm_name}
                                      </p>
                                      <p className="text-xs text-[#76504a]">
                                        {(selected.product_type ?? "charm").replace(
                                          "_",
                                          " ",
                                        )}{" "}
                                        · Qty {selected.quantity}
                                      </p>
                                      <p className="text-xs font-semibold text-[#9A4F78]">
                                        {formatPrice(Number(selected.charm_price))}
                                      </p>
                                      <div className="mt-2">
                                        <FinishBadge
                                          finishType={selected.products?.finish_type}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-3xl boutique-card p-6">
          <h2 className="text-2xl font-semibold text-[#7A3F63]">
            Text breakdown
          </h2>
          <div className="mt-5 space-y-3">
            {(order.order_items ?? []).map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-[#efccd4] bg-[#fffaf8] p-4"
              >
                <div className="flex justify-between gap-4">
                  <div>
                    <p className="font-semibold text-[#7A3F63]">
                      {item.item_name}
                    </p>
                    <p className="mt-1 text-xs text-[#76504a]">
                      Quantity: {item.quantity}
                    </p>
                    {item.selected_size ? (
                      <p className="mt-1 text-xs font-semibold text-[#7A3F63]">
                        Size / length: {item.selected_size}
                      </p>
                    ) : null}
                  </div>
                  <p className="font-semibold text-[#7A3F63]">
                    {formatPrice(Number(item.line_total))}
                  </p>
                </div>
                {item.item_type === "custom_necklace" ? (
                  <div className="mt-4 rounded-2xl border border-[#f0c9d6] bg-white/75 p-4 text-sm leading-6 text-[#76504a]">
                    {(item.custom_necklace_items ?? []).map((customItem) => {
                      const customRows = customItem.custom_necklace_charms ?? [];
                      const connectors = customRows.filter(
                        (selected) => selected.product_type === "connector",
                      );
                      const arrangedItems = customRows
                        .filter((selected) => selected.product_type !== "connector")
                        .sort(
                          (a, b) =>
                            (a.arrangement_order ?? 0) -
                            (b.arrangement_order ?? 0),
                        );

                      return (
                        <div key={customItem.id}>
                          <p>
                            <span className="font-semibold text-[#7A3F63]">
                              Chain:
                            </span>{" "}
                            {customItem.chain_name}
                            {customItem.chain_length
                              ? `, ${customItem.chain_length}`
                              : ""}
                          </p>
                          {connectors.length > 0 ? (
                            <p>
                              <span className="font-semibold text-[#7A3F63]">
                                Connector:
                              </span>{" "}
                              {connectors
                                .map((connector) => connector.charm_name)
                                .join(", ")}
                            </p>
                          ) : null}
                          <p className="mt-3 font-semibold text-[#7A3F63]">
                            {connectors.length > 0
                              ? "Inside connector"
                              : "Arrangement"}
                          </p>
                          <ol className="mt-2 list-decimal space-y-1 pl-5">
                            {arrangedItems.map((selected) => (
                              <li key={selected.id}>
                                {selected.charm_name} ·{" "}
                                {(selected.product_type ?? "charm").replace(
                                  "_",
                                  " ",
                                )}{" "}
                                · Qty {selected.quantity} ·{" "}
                                {formatPrice(Number(selected.charm_price))}
                              </li>
                            ))}
                          </ol>
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-2xl bg-[#fff1f6] p-4 text-sm leading-6 text-[#76504a]">
            <p className="font-semibold text-[#7A3F63]">Order notes</p>
            <p className="mt-2">{order.order_notes || "No customer notes."}</p>
          </div>
          <div className="mt-4 rounded-2xl bg-[#fff7fa] p-4 text-sm leading-6 text-[#76504a]">
            <p className="font-semibold text-[#7A3F63]">Internal notes</p>
            <p className="mt-2">{order.internal_notes || "No internal notes."}</p>
          </div>
          <form
            action={updateOrderWorkflow.bind(null, order.id)}
            className="mt-6 rounded-3xl border border-[#efccd4] bg-[#fffaf8] p-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#c6a15a]">
                  Order Status
                </p>
                <p className="mt-2 font-semibold text-[#7A3F63]">
                  Stock is deducted only when an order is marked Confirmed.
                </p>
              </div>
              <span
                className={`rounded-full border px-4 py-2 text-xs font-semibold ${statusBadgeClass}`}
              >
                {formatStatus(order.status)}
              </span>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold text-[#7A3F63]">
                  Status
                </span>
                <select
                  name="status"
                  defaultValue={order.status}
                  className="mt-2 w-full rounded-2xl border border-[#efccd4] bg-white px-4 py-3 text-sm text-[#7A3F63]"
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {formatStatus(status)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block sm:col-span-2">
                <span className="text-sm font-semibold text-[#7A3F63]">
                  Internal notes
                </span>
                <textarea
                  name="internal_notes"
                  rows={4}
                  defaultValue={order.internal_notes ?? ""}
                  className="mt-2 w-full rounded-2xl border border-[#efccd4] bg-white px-4 py-3 text-sm text-[#7A3F63]"
                />
              </label>
            </div>
            <div className="mt-5 grid gap-3 rounded-2xl border border-[#efccd4] bg-white/75 p-4 text-sm text-[#76504a]">
              <p className="font-semibold text-[#7A3F63]">
                Stock impact preview
              </p>
              {stockPreviewRows.map((item) => {
                const currentStock = item.stock;
                const afterConfirmation =
                  currentStock === null ? null : currentStock - item.quantity;
                const insufficient =
                  afterConfirmation !== null && afterConfirmation < 0;

                return (
                  <div
                    key={item.key}
                    className="grid gap-2 rounded-2xl bg-[#fff7fa] p-3 sm:grid-cols-[1fr_100px_120px_120px]"
                  >
                    <span className="font-medium text-[#7A3F63]">
                      {item.name}
                      {item.label ? (
                        <span className="ml-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#c6a15a]">
                          {item.label}
                        </span>
                      ) : null}
                    </span>
                    <span>Qty: {item.quantity}</span>
                    <span>
                      Stock: {currentStock === null ? "Unknown" : currentStock}
                    </span>
                    <span
                      className={
                        insufficient ? "font-semibold text-[#b23b5a]" : ""
                      }
                    >
                      After:{" "}
                      {afterConfirmation === null ? "Unknown" : afterConfirmation}
                    </span>
                    {insufficient ? (
                      <p className="sm:col-span-4 text-xs font-semibold text-[#b23b5a]">
                        Not enough stock to confirm this order.
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>
            <div className="mt-5 grid gap-2 rounded-2xl bg-[#fff1f6] p-4 text-sm text-[#76504a] sm:grid-cols-3">
              <p>
                <span className="font-semibold text-[#7A3F63]">
                  Stock deducted:
                </span>{" "}
                {order.stock_deducted_at ? "Yes" : "No"}
              </p>
              <p>
                <span className="font-semibold text-[#7A3F63]">
                  Confirmed:
                </span>{" "}
                {formatDateTime(order.confirmed_at)}
              </p>
              <p>
                <span className="font-semibold text-[#7A3F63]">
                  Cancelled:
                </span>{" "}
                {formatDateTime(order.cancelled_at)}
              </p>
            </div>
            <button className="mt-5 rounded-full bg-[#d38aa0] px-5 py-2 text-sm font-semibold text-white">
              Save status
            </button>
          </form>
          <div className="mt-6 rounded-3xl border border-[#efccd4] bg-[#fffaf8] p-5">
            <h2 className="text-xl font-semibold text-[#7A3F63]">
              Inventory movements
            </h2>
            <div className="mt-4 space-y-3 text-sm text-[#76504a]">
              {inventoryMovements.map((movement) => (
                <div
                  key={movement.id}
                  className="rounded-2xl border border-[#efccd4] bg-white/75 p-4"
                >
                  <div className="flex flex-wrap justify-between gap-3">
                    <p className="font-semibold text-[#7A3F63]">
                      {movement.products?.name ?? "Product"}
                    </p>
                    <p
                      className={
                        movement.quantity_change < 0
                          ? "font-semibold text-[#b23b5a]"
                          : "font-semibold text-[#7A8F53]"
                      }
                    >
                      {movement.quantity_change > 0 ? "+" : ""}
                      {movement.quantity_change}
                    </p>
                  </div>
                  <p className="mt-2">
                    {movement.movement_type} · {movement.previous_stock} →{" "}
                    {movement.new_stock}
                  </p>
                  <p className="mt-1 text-xs">
                    {movement.reason ?? "No reason"} ·{" "}
                    {formatDateTime(movement.created_at)}
                  </p>
                </div>
              ))}
              {inventoryMovements.length === 0 ? (
                <p>No inventory movements recorded for this order yet.</p>
              ) : null}
            </div>
          </div>
          <div className="mt-6 rounded-3xl border border-[#e9a3ad] bg-[#fff7fa] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rose">
              Danger zone
            </p>
            <h2 className="mt-2 text-xl font-semibold text-[#7A3F63]">
              Delete order permanently
            </h2>
            <p className="mt-3 text-sm leading-6 text-[#76504a]">
              This permanently deletes the order and related order item/custom
              necklace rows. If this order has deducted stock, cancel it first
              to restore inventory before deleting.
            </p>
            <form
              action={deleteOrder.bind(null, order.id)}
              className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]"
            >
              <label className="block">
                <span className="text-sm font-semibold text-[#7A3F63]">
                  Type DELETE to confirm
                </span>
                <input
                  name="confirmation"
                  className="mt-2 w-full rounded-2xl border border-[#e9a3ad] bg-white px-4 py-3 text-sm text-[#7A3F63] outline-none"
                />
              </label>
              <button className="self-end rounded-full bg-[#fff1f6] px-5 py-3 text-sm font-semibold text-rose transition hover:bg-[#ffe2ee]">
                I understand, delete this order
              </button>
            </form>
          </div>
        </div>
        </div>
        <aside className="h-fit rounded-[2rem] border border-[#f0c9d6] bg-white/82 p-6 text-sm leading-6 text-[#76504a] shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#c6a15a]">
            Customer
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-[#7A3F63]">
            {order.customer_name}
          </h2>
          <div className="mt-5 space-y-3">
            <p>Phone: {order.contact_number}</p>
            <p>Facebook: {order.facebook_link || "None"}</p>
            <p>Instagram: {order.instagram_username || "None"}</p>
            <p>Preferred: {order.preferred_contact_method}</p>
            <p>Delivery: {deliveryTitle}</p>
            <p>Location: {deliveryDetail || "Not provided"}</p>
            <p>Status: {order.status}</p>
            <p className="font-semibold text-[#7A3F63]">
              Total: {formatPrice(Number(order.estimated_total))}
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}
