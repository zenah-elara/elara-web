import Image from "next/image";
import Link from "next/link";

const instagramUrl =
  "https://www.instagram.com/elara.jewels.bcd?igsh=MTRoNTVjbDQyazltdw%3D%3D&utm_source=qr";
const facebookUrl = "https://www.facebook.com/elarajwels";

const footerLinks = [
  { label: "Shop Products", href: "/shop-products" },
  { label: "Build Your Elara Piece", href: "/build-your-necklace" },
  {
    label: "Customized Engraved Pieces",
    href: "/customized-engraved-pieces",
  },
];

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-[#f2c8d5]/80 bg-[radial-gradient(circle_at_18%_12%,rgba(247,218,231,0.72)_0,rgba(247,218,231,0.22)_34%,transparent_58%),linear-gradient(135deg,#fff7f9_0%,#fde7ef_48%,#fffaf3_100%)]">
      <div className="pointer-events-none absolute right-[12%] top-8 h-3 w-3 rounded-full bg-white/80 shadow-[24px_14px_0_rgba(251,230,238,0.9),52px_-8px_0_rgba(255,255,255,0.64)]" />
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-[1.25fr_1fr_0.8fr] lg:px-8">
        <div>
          <Link
            href="/"
            className="relative inline-flex h-[70px] w-[175px] overflow-hidden rounded-[26px] bg-[#F9BACF] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.42),0_12px_26px_rgba(211,140,157,0.14)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D5A84F] focus-visible:ring-offset-4 focus-visible:ring-offset-[#fff8fb]"
            aria-label="elara. home"
          >
            <Image
              src="/elara-logo.png"
              alt="elara. logo"
              width={1254}
              height={1254}
              className="absolute left-1/2 top-1/2 h-auto w-[112%] max-w-none -translate-x-1/2 -translate-y-[44%] object-contain object-center"
            />
          </Link>
          <p className="mt-4 max-w-md text-sm leading-6 text-[#6f3f52]">
            High-quality, affordable, transparent jewelry made accessible for
            every kind of woman.
          </p>
          <p className="mt-3 max-w-md text-sm font-semibold leading-6 text-[#A55166]">
            Based in Bacolod. Available for local delivery and nationwide
            shipping.
          </p>
        </div>
        <div className="grid gap-3 text-sm font-medium text-[#8F4968] sm:grid-cols-2">
          {footerLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full outline-none transition hover:text-[#A55166] focus-visible:ring-2 focus-visible:ring-[#D5A84F] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fff8fb]"
            >
              {link.label}
            </Link>
          ))}
          <a
            href={instagramUrl}
            target="_blank"
            rel="noreferrer"
            aria-label="Open elara. on Instagram"
            className="rounded-full outline-none transition hover:text-[#A55166] focus-visible:ring-2 focus-visible:ring-[#D5A84F] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fff8fb]"
          >
            Instagram
          </a>
          <a
            href={facebookUrl}
            target="_blank"
            rel="noreferrer"
            aria-label="Open elara. on Facebook"
            className="rounded-full outline-none transition hover:text-[#A55166] focus-visible:ring-2 focus-visible:ring-[#D5A84F] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fff8fb]"
          >
            Facebook
          </a>
        </div>
        <div className="rounded-[2rem] border border-[#efccd4] bg-white/76 p-5 text-sm leading-6 text-[#6f3f52] shadow-[0_16px_40px_rgba(211,140,157,0.13)] backdrop-blur">
          <p className="font-semibold text-[#A55166]">Order requests</p>
          <p className="mt-2">
            Submit your picks online, then confirm payment and delivery through
            Instagram, Facebook, or phone.
          </p>
        </div>
      </div>
    </footer>
  );
}
