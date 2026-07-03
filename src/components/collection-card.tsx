import Link from "next/link";
import type { Collection } from "@/lib/data";

export function CollectionCard({ collection }: { collection: Collection }) {
  return (
    <Link
      href={`/collections/${collection.slug}`}
      className="group relative block overflow-hidden rounded-[2.5rem] border border-[#f2c8d5] bg-[linear-gradient(180deg,#fffdf8,#fff4f8)] shadow-[0_20px_48px_rgba(211,140,157,0.16)] transition hover:-translate-y-1 hover:border-[#E2B4C1] hover:shadow-[0_30px_70px_rgba(211,140,157,0.24)]"
    >
      <div className="pointer-events-none absolute right-6 top-5 z-10 h-2 w-2 rounded-full bg-white/86 shadow-[18px_10px_0_rgba(251,230,238,0.95),34px_-4px_0_rgba(255,255,255,0.72)]" />
      <div className={`relative h-48 bg-gradient-to-br ${collection.accent}`}>
        {collection.imageUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={collection.imageUrl}
              alt={collection.imageAlt ?? collection.name}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#7A3F63]/20 to-transparent" />
          </>
        ) : (
          <>
            <div className="absolute inset-x-7 bottom-7 h-20 rounded-[1.8rem] bg-white/52 shadow-[0_14px_30px_rgba(201,130,149,0.12)]" />
            <div className="absolute bottom-12 left-10 h-14 w-14 rounded-full border-[7px] border-white/65 bg-[#ffe7f0]/55" />
            <div className="absolute bottom-16 right-12 h-px w-28 -rotate-12 bg-[#c6a15a]/75" />
            <div className="absolute right-12 top-14 h-10 w-10 rounded-full border border-[#c6a15a]/65 bg-white/45" />
          </>
        )}
        <div className="absolute left-6 top-6 rounded-full border border-white/80 bg-white/82 px-3 py-1 text-xs font-semibold text-[#A55166] shadow-sm">
          {collection.badge ?? "collection"}
        </div>
      </div>
      <div className="p-6">
        <h3 className="text-xl font-semibold text-[#A55166]">
          {collection.name}
        </h3>
        <p className="mt-2 text-sm leading-6 text-[#6f3f52]">
          {collection.description}
        </p>
        <p className="mt-5 text-sm font-semibold text-[#D38C9D] group-hover:text-[#A55166]">
          View collection
        </p>
      </div>
    </Link>
  );
}
