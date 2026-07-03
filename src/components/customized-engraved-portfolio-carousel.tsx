"use client";

import { useState } from "react";

const examples = Array.from({ length: 6 }, (_, index) => index + 1);
const moreExamples: number[] = [];

export function CustomizedEngravedPortfolioCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeNumber = activeIndex + 1;

  function showPrevious() {
    setActiveIndex((index) =>
      index === 0 ? moreExamples.length - 1 : index - 1,
    );
  }

  function showNext() {
    setActiveIndex((index) =>
      index === moreExamples.length - 1 ? 0 : index + 1,
    );
  }

  return (
    <section className="mt-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="inline-flex rounded-full border border-[#f2c8d5] bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#A55166] shadow-sm">
            Portfolio
          </p>
          <h2 className="mt-4 text-3xl font-semibold leading-tight text-[#A55166] sm:text-4xl [font-family:Georgia,'Times_New_Roman',serif]">
            Custom piece examples
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6f3f52]">
            Some photos shown are examples of customized pieces we&apos;ve made
            before.
          </p>
        </div>
        <a
          href="#customized-request-form"
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#f2c8d5] bg-[#fff9f5]/94 px-6 py-2 text-sm font-semibold text-[#8f4968] shadow-[0_10px_22px_rgba(211,140,157,0.14)] transition hover:-translate-y-0.5 hover:bg-[#FBE6EE] hover:text-[#A55166]"
        >
          Request a similar piece
        </a>
      </div>

      <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {examples.map((example) => (
          <div
            key={example}
            className="flex aspect-[4/3] items-center justify-center rounded-[2rem] border border-[#efccd4] bg-[linear-gradient(135deg,#fff7fa_0%,#fde1eb_54%,#fff8e8_100%)] p-5 text-center shadow-[0_18px_42px_rgba(211,140,157,0.12)]"
          >
            <p className="text-sm font-semibold text-[#A55166]">
              Portfolio photo coming soon
            </p>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-[2rem] border border-[#efccd4] bg-white/78 p-5 shadow-[0_18px_42px_rgba(211,140,157,0.12)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#7A3F63]">
              More portfolio photos
            </p>
            <p className="mt-1 text-sm text-[#6f3f52]">
              More portfolio photos coming soon.
            </p>
          </div>
          <span className="rounded-full bg-[#fff7fa] px-4 py-2 text-sm font-semibold text-[#7A3F63]">
            {moreExamples.length > 0
              ? `${activeNumber} / ${moreExamples.length}`
              : "0 / 0"}
          </span>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={showPrevious}
            disabled={moreExamples.length === 0}
            className="inline-flex min-h-10 items-center justify-center rounded-full border border-[#D5A84F] bg-[#FFF8F3] px-4 py-2 text-sm font-semibold text-[#7A3F63] hover:bg-[#FFEAF2] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <span className="rounded-full bg-white/78 px-4 py-2 text-sm font-semibold text-[#7A3F63]">
            {moreExamples.length > 0
              ? `${activeNumber} / ${moreExamples.length}`
              : "More portfolio photos coming soon."}
          </span>
          <button
            type="button"
            onClick={showNext}
            disabled={moreExamples.length === 0}
            className="inline-flex min-h-10 items-center justify-center rounded-full border border-[#D5A84F] bg-[#FFF8F3] px-4 py-2 text-sm font-semibold text-[#7A3F63] hover:bg-[#FFEAF2] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
}
