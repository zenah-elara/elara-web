"use client";

import { useState } from "react";
import { getMaterialCareCopy } from "@/lib/materials";

export function ProductMaterialFields({
  defaultMaterial = "gold_plated",
  defaultAdditionalNote = "",
}: {
  defaultMaterial?: "gold_plated" | "stainless_steel";
  defaultAdditionalNote?: string | null;
}) {
  const [material, setMaterial] = useState(defaultMaterial);

  return (
    <section className="rounded-2xl border border-[#efccd4] bg-[#fffaf8] p-5">
      <p className="text-sm font-semibold text-cocoa">Material</p>
      <p className="mt-2 text-xs leading-5 text-[#76504a]">
        Select the product&apos;s default material. Its standard customer care information is added automatically.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="flex items-center gap-3 rounded-2xl border border-[#efccd4] bg-white/75 px-4 py-3 text-sm font-semibold text-cocoa">
          <input name="finish_type" type="radio" value="gold_plated" checked={material === "gold_plated"} onChange={() => setMaterial("gold_plated")} />
          Gold-plated
        </label>
        <label className="flex items-center gap-3 rounded-2xl border border-[#efccd4] bg-white/75 px-4 py-3 text-sm font-semibold text-cocoa">
          <input name="finish_type" type="radio" value="stainless_steel" checked={material === "stainless_steel"} onChange={() => setMaterial("stainless_steel")} />
          Non-tarnish / Stainless steel
        </label>
      </div>
      <div className="mt-4 rounded-2xl border border-[#ead8ad] bg-[#fffaf0] p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#9a7840]">Customer care note</p>
        <p className="mt-2 text-xs leading-5 text-[#76504a]">{getMaterialCareCopy(material)}</p>
      </div>
      <label className="mt-4 block">
        <span className="text-sm font-semibold text-cocoa">Additional material note</span>
        <span className="mt-1 block text-xs leading-5 text-[#76504a]">
          Optional. Add this only if there is something specific customers should know about this product beyond the standard material care information.
        </span>
        <textarea name="finish_notes" rows={2} defaultValue={defaultAdditionalNote ?? ""} className="mt-2 w-full rounded-2xl border border-[#efccd4] bg-white px-4 py-3 text-sm text-cocoa outline-none" />
      </label>
    </section>
  );
}
