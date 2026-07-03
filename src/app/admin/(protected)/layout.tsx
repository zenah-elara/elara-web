import Link from "next/link";
import { signOut } from "@/features/auth/actions";
import { requireAdminUser } from "@/features/auth/queries";

const adminLinks = [
  ["Admin Dashboard", "/admin"],
  ["Homepage", "/admin/homepage"],
  ["Orders", "/admin/orders"],
  ["Customized Engraved Requests", "/admin/customized-engraved-requests"],
  ["Inventory", "/admin/inventory"],
  ["Products", "/admin/products"],
  ["Add Product", "/admin/products/new"],
  ["Collections", "/admin/collections"],
  ["Add Collection", "/admin/collections/new"],
  ["View Store", "/"],
];

export default async function ProtectedAdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user, adminProfile } = await requireAdminUser();
  const adminName = adminProfile.display_name ?? user.email ?? "Admin user";

  return (
    <div className="min-h-screen bg-[#fff8fb]">
      <div className="border-b border-[#efccd4] bg-[#fffaf8]">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">
              Admin area
            </p>
            <p className="mt-1 text-sm font-semibold text-[#7A3F63]">
              Signed in as {adminName}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {adminLinks.map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className="rounded-full border border-[#efccd4] bg-white/80 px-3 py-2 text-sm font-semibold text-[#76504a] transition hover:bg-[#fff1f6]"
              >
                {label}
              </Link>
            ))}
            <form action={signOut}>
              <button
                type="submit"
                className="inline-flex min-h-10 items-center justify-center rounded-full border border-[#d8b36a] bg-[#fffdf8]/85 px-4 py-2 text-sm font-semibold text-[#76504a] shadow-sm transition hover:bg-[#fff5e8]"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}
