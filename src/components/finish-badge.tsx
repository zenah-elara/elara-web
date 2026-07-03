import {
  getMaterialCareInstruction,
  getMaterialLabel,
  type ProductMaterialType,
} from "@/lib/materials";

export type ProductFinishType = ProductMaterialType;

export function getFinishCareCopy(finishType?: ProductFinishType | null) {
  return getMaterialCareInstruction(finishType);
}

export function getFinishLabel(finishType?: ProductFinishType | null) {
  return getMaterialLabel(finishType);
}

export function FinishBadge({
  finishType,
  className = "",
}: {
  finishType?: ProductFinishType | null;
  className?: string;
}) {
  const label = getFinishLabel(finishType);

  if (!label) return null;

  return (
    <span
      className={`inline-flex w-fit items-center rounded-full border border-[#e7c682] bg-[#fff8e8] px-3 py-1 text-xs font-semibold text-[#8a6732] ${className}`}
    >
      {label}
    </span>
  );
}
