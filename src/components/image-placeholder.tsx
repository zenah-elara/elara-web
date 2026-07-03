type ImagePlaceholderProps = {
  label?: string;
  tone?: "pink" | "cream" | "gold";
  className?: string;
};

const tones = {
  pink: "from-[#ffdbe9] via-[#fff8fb] to-[#f3c6d6]",
  cream: "from-[#fff8ef] via-[#ffffff] to-[#f4dfbf]",
  gold: "from-[#fff0c9] via-[#fff9f0] to-[#efd39a]",
};

export function ImagePlaceholder({
  label = "Product photo coming soon",
  tone = "pink",
  className = "",
}: ImagePlaceholderProps) {
  return (
    <div
      className={`relative flex min-h-56 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br ${tones[tone]} soft-ring ${className}`}
      aria-label={label}
      role="img"
    >
      <div className="absolute inset-x-6 bottom-8 h-24 rounded-[1.5rem] bg-white/48 shadow-sm" />
      <div className="absolute left-10 top-10 h-20 w-20 rounded-full border-[8px] border-white/70 bg-[#ffe7f0]/60" />
      <div className="absolute right-10 top-12 h-12 w-12 rounded-full border border-[#c6a15a]/70 bg-white/55" />
      <div className="absolute left-8 top-1/2 h-px w-[78%] -rotate-12 bg-[#c6a15a]/75" />
      <div className="absolute bottom-14 left-14 h-8 w-8 rounded-full bg-[#f4b8ca] shadow-[0_0_0_6px_rgba(255,255,255,0.52)]" />
      <div className="absolute bottom-16 right-16 h-6 w-6 rounded-full bg-[#fff8ef] shadow-[0_0_0_1px_rgba(198,161,90,0.7)]" />
      <span className="absolute right-5 top-5 rounded-full bg-white/78 px-3 py-1 text-xs font-semibold text-[#b06a78]">
        product preview
      </span>
      <p className="relative max-w-52 rounded-full bg-white/78 px-5 py-3 text-center text-sm font-semibold leading-6 text-[#7b5651] shadow-sm">
        {label}
      </p>
    </div>
  );
}
