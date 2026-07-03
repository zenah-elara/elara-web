import Image from "next/image";
import Link from "next/link";

const navItems = [
  { label: "Home", href: "/" },
  { label: "Shop Products", href: "/shop-products" },
  {
    label: "Build Your Elara Piece",
    href: "/build-your-necklace",
    className: "hidden sm:inline-flex",
  },
  {
    label: "Customized Engraved Pieces",
    href: "/customized-engraved-pieces",
  },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 h-[72px] border-b border-[#f2c8d5]/70 bg-[linear-gradient(90deg,#fff9f5_0%,#fde7ef_50%,#fff4ea_100%)] shadow-[0_10px_26px_rgba(211,140,157,0.1)] sm:h-[80px] lg:h-[86px]">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-2 px-3 sm:gap-2.5 sm:px-5 lg:gap-4 lg:px-8">
        <Link
          href="/"
          className="inline-flex w-[140px] shrink-0 items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D5A84F] focus-visible:ring-offset-4 focus-visible:ring-offset-[#fff8fb] lg:w-[180px]"
          aria-label="elara. home"
        >
          <Image
            src="/elara-header-logo.png"
            alt="elara. logo"
            width={1420}
            height={520}
            priority
            className="h-auto w-full rounded-[18px] object-contain object-center lg:rounded-[22px]"
          />
        </Link>
        <nav className="flex min-w-0 flex-1 items-center justify-start gap-1 overflow-x-auto text-[0.86rem] font-semibold leading-none text-[#8F4968] sm:justify-center sm:gap-1.5 sm:text-[0.92rem] md:gap-3 md:overflow-visible lg:gap-4 lg:text-[0.96rem] [font-family:Georgia,'Times_New_Roman',serif]">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`shrink-0 rounded-full px-2 py-1 outline-none transition hover:bg-white/70 hover:text-[#A55166] focus-visible:ring-2 focus-visible:ring-[#D5A84F] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fff8fb] sm:px-2.5 lg:px-3 ${
                item.className ?? ""
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <Link
          href="/cart"
          aria-label="View cart"
          className="inline-flex min-h-10 min-w-10 shrink-0 items-center justify-center rounded-full border border-[#e0b866]/80 bg-[#fffaf3]/90 px-2.5 py-1 text-2xl leading-none text-[#8F4968] shadow-sm transition hover:bg-white hover:text-[#A55166] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D5A84F] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fff8fb]"
        >
          <span aria-hidden="true">🛒</span>
        </Link>
      </div>
    </header>
  );
}
