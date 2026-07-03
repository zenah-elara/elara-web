import Link from "next/link";
import { SectionHeader } from "@/components/section-header";
import {
  getAdminCollections,
  getAdminProducts,
} from "@/features/admin/catalog/queries";
import { getCatalogDiagnostics } from "@/features/admin/diagnostics";
import { getCustomizedEngravedRequestCounts } from "@/features/admin/customized-engraved/queries";
import { getOrderStatusCounts } from "@/features/admin/orders/queries";

const adminCards = [
  {
    title: "Homepage",
    href: "/admin/homepage",
    quickHref: null,
    quickLabel: null,
    description: "Upload and manage the landing page hero image.",
  },
  {
    title: "Collections",
    href: "/admin/collections",
    quickHref: "/admin/collections/new",
    quickLabel: "Add collection",
    description: "Create and manage storefront collection drops.",
  },
  {
    title: "Products",
    href: "/admin/products",
    quickHref: "/admin/products/new",
    quickLabel: "Add product",
    description: "Create products, edit stock, tags, and image records.",
  },
  {
    title: "Inventory",
    href: "/admin/inventory",
    quickHref: null,
    quickLabel: null,
    description: "Review stock deductions and restorations from order status changes.",
  },
  {
    title: "Orders",
    href: "/admin/orders",
    quickHref: null,
    quickLabel: null,
    description: "Review incoming order requests.",
  },
  {
    title: "Customized Engraved Requests",
    href: "/admin/customized-engraved-requests",
    quickHref: null,
    quickLabel: null,
    description: "Review bulk engraved/photo/text inquiry requests.",
  },
  {
    title: "Necklace Builder Items",
    href: null,
    quickHref: null,
    quickLabel: null,
    description: "Builder item workflows will be added later.",
  },
];

export default async function AdminPage() {
  const [
    diagnostics,
    orderStatusCounts,
    customizedRequestCounts,
    products,
    collections,
  ] = await Promise.all([
    getCatalogDiagnostics(),
    getOrderStatusCounts(),
    getCustomizedEngravedRequestCounts(),
    getAdminProducts(),
    getAdminCollections(),
  ]);
  const activeProducts = products.filter((product) => product.is_active).length;
  const inactiveProducts = products.length - activeProducts;
  const lowStockProducts = products.filter(
    (product) => product.stock_quantity <= product.low_stock_threshold,
  ).length;
  const activeCollections = collections.filter(
    (collection) => collection.is_active,
  ).length;

  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <SectionHeader
        eyebrow="Admin"
        title="Operations dashboard"
        description="Manage catalog actions, order queues, and storefront readiness from one admin workspace."
      />
      <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
        {[
          ["Add Product", "/admin/products/new"],
          ["Add Collection", "/admin/collections/new"],
          ["Edit Homepage", "/admin/homepage"],
          ["View Orders", "/admin/orders"],
          ["Engraved Requests", "/admin/customized-engraved-requests"],
          ["View Inventory", "/admin/inventory"],
          ["View Products", "/admin/products"],
          ["View Collections", "/admin/collections"],
        ].map(([label, href]) => (
          <Link
            key={href}
            href={href}
            className="rounded-2xl border border-[#d8b36a] bg-[#fffdf8] px-4 py-3 text-center text-sm font-semibold text-[#76504a] shadow-sm transition hover:bg-[#fff5e8]"
          >
            {label}
          </Link>
        ))}
      </div>
      <div className="mt-6 inline-flex rounded-full border border-[#efccd4] bg-white/75 px-4 py-2 text-xs font-semibold text-[#76504a]">
        Data source:{" "}
        {diagnostics.dataSource === "supabase"
          ? "Supabase configured"
          : "Mock fallback"}
      </div>

      <section className="mt-8 rounded-3xl boutique-card p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">
              System status
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-cocoa">
              Supabase readiness
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#76504a]">
              {diagnostics.safeStatusMessage}
            </p>
          </div>
          <span className="rounded-full bg-[#fff1f4] px-3 py-1 text-xs font-semibold text-rose">
            Configured: {diagnostics.isConfigured ? "Yes" : "No"}
          </span>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {[
            ["Collections", diagnostics.collectionsCount],
            ["Products", diagnostics.productsCount],
            ["Orders", orderStatusCounts.all],
            ["Engraved Requests", customizedRequestCounts.all],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-2xl border border-[#efccd4] bg-[#fffaf8] p-4"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9d746d]">
                {label}
              </p>
              <p className="mt-2 text-2xl font-semibold text-cocoa">
                {value}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-6">
          <h3 className="text-sm font-semibold text-cocoa">
            Seeded collections
          </h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {diagnostics.seededCollections.length > 0 ? (
              diagnostics.seededCollections.map((collection) => (
                <span
                  key={collection.slug}
                  className="rounded-full border border-[#ecd9be] bg-white/80 px-3 py-1 text-xs font-semibold text-[#8d6a2f]"
                >
                  {collection.name}
                </span>
              ))
            ) : (
              <span className="text-sm text-[#76504a]">
                No collections readable yet.
              </span>
            )}
          </div>
        </div>

        {diagnostics.warnings.length > 0 ? (
          <div className="mt-6 rounded-2xl border border-[#efd2bc] bg-[#fff7ef] p-4">
            <h3 className="text-sm font-semibold text-cocoa">
              Safe warnings
            </h3>
            <ul className="mt-2 space-y-2 text-sm leading-6 text-[#76504a]">
              {diagnostics.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <section className="mt-8 rounded-3xl border border-[#efccd4] bg-white/82 p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-2xl font-semibold text-[#7A3F63]">
            Order queue
          </h2>
          <Link
            href="/admin/orders"
            className="rounded-full border border-[#d8b36a] bg-[#fffdf8] px-4 py-2 text-sm font-semibold text-[#76504a]"
          >
            View all
          </Link>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            ["Total Orders", "all"],
            ["New Orders", "new"],
            ["Contacted", "contacted"],
            ["Confirmed", "confirmed"],
            ["Paid", "paid"],
            ["Packed", "packed"],
            ["Delivered / Accomplished", "delivered"],
            ["Cancelled", "cancelled"],
            ["Incomplete", "incomplete"],
          ].map(([label, status]) => (
            <Link
              key={status}
              href={
                status === "all"
                  ? "/admin/orders"
                  : `/admin/orders?status=${status}`
              }
              className="rounded-2xl border border-[#efccd4] bg-[#fffaf8] p-4"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9d746d]">
                {label}
              </p>
              <p className="mt-2 text-2xl font-semibold text-[#7A3F63]">
                {orderStatusCounts[status as keyof typeof orderStatusCounts] ??
                  0}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-8 rounded-3xl border border-[#efccd4] bg-white/82 p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-[#7A3F63]">
          Catalog management
        </h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            ["Products", products.length, "/admin/products"],
            ["Collections", collections.length, "/admin/collections"],
            ["Low Stock Products", lowStockProducts, "/admin/products?low_stock=on"],
            ["Active Products", activeProducts, "/admin/products?status=active"],
            ["Inactive Products", inactiveProducts, "/admin/products?status=inactive"],
          ].map(([label, value, href]) => (
            <Link
              key={label}
              href={String(href)}
              className="rounded-2xl border border-[#efccd4] bg-[#fffaf8] p-4"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9d746d]">
                {label}
              </p>
              <p className="mt-2 text-2xl font-semibold text-[#7A3F63]">
                {value}
              </p>
            </Link>
          ))}
        </div>
        <p className="mt-4 text-sm text-[#76504a]">
          Active collections: {activeCollections}
        </p>
      </section>

      <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
        {adminCards.map((card) => (
          <div
            key={card.title}
            className="rounded-3xl border border-[#efccd4] bg-white/80 p-6 shadow-sm"
          >
            <p className="text-sm font-semibold text-gold">Manage</p>
            <h2 className="mt-3 text-xl font-semibold text-cocoa">
              {card.title}
            </h2>
            <p className="mt-3 text-sm leading-6 text-[#76504a]">
              {card.description}
            </p>
            {card.title === "Orders" ? (
              <p className="mt-3 rounded-full bg-[#fff1f6] px-3 py-1 text-xs font-semibold text-rose">
                New requests: {orderStatusCounts.new}
              </p>
            ) : null}
            {card.title === "Customized Engraved Requests" ? (
              <p className="mt-3 rounded-full bg-[#fff1f6] px-3 py-1 text-xs font-semibold text-rose">
                New requests: {customizedRequestCounts.new}
              </p>
            ) : null}
            {card.href ? (
              <div className="mt-5 flex flex-wrap gap-2">
                <Link
                  href={card.href}
                  className="inline-flex rounded-full border border-[#d8b36a] bg-[#fffdf8] px-4 py-2 text-sm font-semibold text-[#76504a]"
                >
                  Open
                </Link>
                {card.quickHref ? (
                  <Link
                    href={card.quickHref}
                    className="inline-flex rounded-full bg-[#d38aa0] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#c77992]"
                  >
                    {card.quickLabel}
                  </Link>
                ) : null}
              </div>
            ) : (
              <span className="mt-5 inline-flex rounded-full bg-[#fff1f6] px-4 py-2 text-sm font-semibold text-rose">
                Later
              </span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
