import { Button } from "./button";

type HeroSectionProps = {
  heroImage?: {
    imageUrl: string;
    altText: string;
  } | null;
};

export function HeroSection({ heroImage }: HeroSectionProps) {
  return (
    <section className="relative isolate overflow-hidden bg-[radial-gradient(circle_at_12%_8%,rgba(247,218,231,0.9)_0,rgba(247,218,231,0.36)_32%,transparent_58%),radial-gradient(circle_at_86%_10%,rgba(255,244,234,0.94)_0,rgba(255,244,234,0.42)_34%,transparent_60%),linear-gradient(135deg,#fff9f5_0%,#fde7ef_54%,#fff4ea_100%)]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-16 lg:px-8">
        <div className="grid items-center gap-8 rounded-[2.5rem] bg-[linear-gradient(135deg,rgba(255,249,245,0.84),rgba(251,230,238,0.7)_48%,rgba(255,244,234,0.82))] p-5 shadow-[0_30px_90px_rgba(211,140,157,0.18)] sm:p-7 md:grid-cols-[0.9fr_1.1fr] lg:gap-12 lg:p-9">
          <div className="relative px-1 py-4 sm:px-3 lg:px-5">
            <span
              aria-hidden="true"
              className="absolute right-5 top-1 hidden text-2xl leading-none text-[#D38C9D]/50 md:block"
            >
              ♡
            </span>
            <p className="inline-flex rounded-full bg-white/58 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#A55166] shadow-sm">
              Accessible quality, expressive pieces
            </p>
            <h1 className="mt-5 max-w-2xl text-4xl font-semibold leading-[1.08] text-[#A55166] sm:text-[44px] lg:text-[3.45rem] [font-family:Georgia,'Times_New_Roman',serif]">
              High-quality jewelry, made accessible for every kind of woman.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-[#6f3f52] sm:text-lg">
              From everyday pieces to playful charms and statement stacks,
              elara. curates jewelry with thoughtful quality and prices that
              make self-expression easier to enjoy.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button href="/collections">Shop Collections</Button>
              <Button href="/build-your-necklace" variant="secondary">
                Build Your Elara Piece
              </Button>
            </div>
          </div>
          <div className="relative min-h-[390px] overflow-hidden rounded-[2.25rem] bg-[linear-gradient(135deg,#fffaf3_0%,#fde7ef_50%,#fff8f8_100%)] shadow-[0_24px_64px_rgba(211,140,157,0.22)] sm:min-h-[450px] lg:min-h-[520px]">
          {heroImage?.imageUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={heroImage.imageUrl}
                alt={heroImage.altText}
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#7A3F63]/12 via-transparent to-white/10" />
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_34%_24%,rgba(255,255,255,0.7)_0,rgba(255,255,255,0.2)_28%,transparent_52%),linear-gradient(135deg,#FBE6EE,#FFF9F5_48%,#F7DAE7)]">
              <p className="rounded-full bg-white/58 px-5 py-2 text-sm font-semibold text-[#A55166] shadow-sm">
                Product photo coming soon
              </p>
            </div>
          )}
          </div>
        </div>
      </div>
    </section>
  );
}
