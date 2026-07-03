type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
};

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = "left",
}: SectionHeaderProps) {
  return (
    <div
      className={`mx-auto max-w-3xl ${
        align === "center" ? "text-center" : "text-left"
      }`}
    >
      {eyebrow ? (
        <p className="inline-flex rounded-full border border-[#f2c8d5] bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#A55166] shadow-sm">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="mt-4 text-3xl font-semibold leading-tight text-[#A55166] sm:text-4xl [font-family:Georgia,'Times_New_Roman',serif]">
        {title}
      </h2>
      {description ? (
        <p className="mt-4 text-base leading-7 text-[#6f3f52]">{description}</p>
      ) : null}
    </div>
  );
}
