import Link from "next/link";
import { SectionHeader } from "@/components/section-header";
import { getRecentInventoryMovements } from "@/features/admin/orders/queries";

function formatDateTime(value: string | null) {
  return value ? new Date(value).toLocaleString() : "No date";
}

function formatMovementType(type: string) {
  return type
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default async function AdminInventoryPage() {
  const movements = await getRecentInventoryMovements();

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <SectionHeader
        eyebrow="Admin"
        title="Inventory"
        description="Review recent stock changes created by confirmed and cancelled order workflows."
      />
      <div className="mt-5 flex flex-wrap gap-2">
        {[
          ["Back to Admin", "/admin"],
          ["Orders", "/admin/orders"],
          ["Products", "/admin/products"],
          ["Collections", "/admin/collections"],
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
      <div className="mt-8 overflow-x-auto rounded-3xl border border-[#efccd4] bg-white/82 shadow-sm">
        <div className="min-w-[980px]">
          <div className="grid grid-cols-[1.2fr_170px_110px_120px_1.4fr_150px_150px] gap-4 border-b border-[#efccd4] bg-[#fff7fa] px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#9d746d]">
            <span>Product</span>
            <span>Movement</span>
            <span>Change</span>
            <span>Stock</span>
            <span>Reason</span>
            <span>Order</span>
            <span>Date</span>
          </div>
          {movements.map((movement) => (
            <div
              key={movement.id}
              className="grid grid-cols-[1.2fr_170px_110px_120px_1.4fr_150px_150px] items-center gap-4 border-b border-[#f5dce4] px-5 py-4 text-sm text-[#76504a] last:border-b-0"
            >
              <span className="font-semibold text-[#7A3F63]">
                {movement.products?.name ?? "Product"}
              </span>
              <span>{formatMovementType(movement.movement_type)}</span>
              <span
                className={
                  movement.quantity_change < 0
                    ? "font-semibold text-[#b23b5a]"
                    : "font-semibold text-[#7A8F53]"
                }
              >
                {movement.quantity_change > 0 ? "+" : ""}
                {movement.quantity_change}
              </span>
              <span>
                {movement.previous_stock} → {movement.new_stock}
              </span>
              <span>{movement.reason ?? "No reason"}</span>
              <span>
                {movement.order_id ? (
                  <Link
                    href={`/admin/orders/${movement.order_id}`}
                    className="font-semibold text-[#7A3F63] underline-offset-4 hover:underline"
                  >
                    {movement.orders?.order_number ?? "View order"}
                  </Link>
                ) : (
                  "No order"
                )}
              </span>
              <span>{formatDateTime(movement.created_at)}</span>
            </div>
          ))}
          {movements.length === 0 ? (
            <div className="px-5 py-8 text-sm text-[#76504a]">
              No inventory movements yet.
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
