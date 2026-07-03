export function getCustomerStockLabel(stock: number, lowStockThreshold = 3) {
  if (stock <= 0) return "Out of stock";
  if (stock <= lowStockThreshold) return "Low stock";
  return "In stock";
}

export function StockBadge({
  stock,
  lowStockThreshold = 3,
}: {
  stock: number;
  lowStockThreshold?: number;
}) {
  const label = getCustomerStockLabel(stock, lowStockThreshold);
  const tone =
    label === "In stock"
      ? "border-[#dfc68f] bg-[#fff9ea] text-[#9a7638]"
      : label === "Low stock"
        ? "border-[#e7b5b5] bg-[#fff0f3] text-[#ad6570]"
        : "border-[#decfc9] bg-[#f7f1ef] text-[#8a716b]";

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${tone}`}>
      {label}
    </span>
  );
}
