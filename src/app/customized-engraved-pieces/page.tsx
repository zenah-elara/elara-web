import { Button } from "@/components/button";
import { CustomizedEngravedPortfolioCarousel } from "@/components/customized-engraved-portfolio-carousel";
import { CustomizedEngravedRequestForm } from "@/components/customized-engraved-request-form";
import { SectionHeader } from "@/components/section-header";

const instagramUrl =
  "https://www.instagram.com/elara.jewels.bcd?igsh=MTRoNTVjbDQyazltdw%3D%3D&utm_source=qr";
const facebookUrl = "https://www.facebook.com/elarajwels";

const rules = [
  ["Minimum order", "10 pieces"],
  ["Batch design", "One design/print per 10-piece batch"],
  ["Timeline", "Submit at least 4 weeks before needed date"],
  ["Sooner requests", "Requests needed sooner than 4 weeks cannot be accepted"],
  [
    "Production",
    "Production usually takes around 2 weeks, but requests must be submitted at least 4 weeks before the needed date",
  ],
  ["Bulk pricing", "More than 20 pieces: request or message for discounts"],
];

const pricingCards = [
  {
    title: "Circle, Oval, or Heart Necklace",
    lines: [
      "10 pcs with basic chain: ₱1,600",
      "10 pcs with premium chain: ₱1,800",
    ],
  },
  {
    title: "Horizontal Oval Necklace",
    lines: ["10 pcs with basic chain only: ₱1,500"],
  },
];

const steps = [
  "Choose your piece type, shape, and chain option.",
  "Send your photo, edited design, or text request.",
  "Submit your request with your quantity and event/order details.",
  "We will message you to confirm the design, timeline, final price, and payment details.",
];

export default function CustomizedEngravedPiecesPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="rounded-[2.25rem] border border-[#efccd4] bg-[linear-gradient(135deg,#fff9f5_0%,#fde7ef_54%,#fffaf3_100%)] p-5 shadow-[0_24px_60px_rgba(211,140,157,0.14)] sm:p-7">
        <div className="max-w-4xl">
          <p className="inline-flex w-fit rounded-full border border-[#f2c8d5] bg-white/72 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#A55166] shadow-sm">
            Bulk custom keepsakes
          </p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight text-[#A55166] sm:text-5xl [font-family:Georgia,'Times_New_Roman',serif]">
            Customized Engraved Pieces
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-[#6f3f52] sm:text-lg">
            Personalized keepsakes for groups, events, souvenirs, and special
            moments. Choose a shape, send your photo, edited design, or words,
            and we&apos;ll help turn it into a custom engraved piece made in batches.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button href="#customized-request-form">Start a request</Button>
            <a
              href={instagramUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#f2c8d5] bg-[#fff9f5]/94 px-6 py-2 text-sm font-semibold text-[#8f4968] shadow-[0_10px_22px_rgba(211,140,157,0.14)] transition hover:-translate-y-0.5 hover:bg-[#FBE6EE] hover:text-[#A55166]"
            >
              Message Instagram
            </a>
          </div>
        </div>
      </section>

      <CustomizedEngravedPortfolioCarousel />

      <section className="mt-14">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeader
            eyebrow="Pricing"
            title="Batch pricing for engraved keepsakes."
            description="Pricing starts at 10 pieces. One design or print applies per 10-piece batch."
          />
          <Button href="#customized-request-form">Start a request</Button>
        </div>
        <div className="mt-7 grid gap-5 lg:grid-cols-3">
          {pricingCards.map((card) => (
            <div key={card.title} className="rounded-3xl boutique-card p-6">
              <h3 className="text-lg font-semibold text-[#7A3F63]">
                {card.title}
              </h3>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-[#6f3f52]">
                {card.lines.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-5 rounded-2xl border border-[#efccd4] bg-white/78 p-5 text-sm leading-6 text-[#6f3f52]">
          For orders above 20 pieces, please submit a request or message us
          directly so we can discuss available discounts and details.
          <span className="mt-3 block text-[#76504a]">
            More options and available materials can be discussed through PM
            after your request is submitted.
          </span>
        </div>
      </section>

      <section className="mt-12 rounded-[2rem] border border-[#efccd4] bg-white/78 p-5 shadow-[0_18px_45px_rgba(211,140,157,0.12)] sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#c6a15a]">
          Key rules
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-[#A55166] [font-family:Georgia,'Times_New_Roman',serif]">
          What to know before requesting
        </h2>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {rules.map(([title, copy]) => (
            <div key={title} className="rounded-2xl bg-[#fff7fa] p-4">
              <p className="text-sm font-semibold text-[#7A3F63]">{title}</p>
              <p className="mt-1 text-sm leading-6 text-[#6f3f52]">{copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10 rounded-[2rem] border border-[#D5A84F]/60 bg-[#fff8e8] p-5 text-[#6f3f52] shadow-[0_18px_45px_rgba(211,140,157,0.13)] sm:p-6">
        <p className="text-sm font-semibold text-[#7A3F63]">
          Timeline notice
        </p>
        <p className="mt-2 text-sm leading-6">
          Production usually takes around 2 weeks, but we require requests to
          be submitted at least 4 weeks before the needed date so there is
          enough allowance for design confirmation, revisions, materials, and
          event preparation. Requests needed sooner than 4 weeks cannot be
          accepted.
        </p>
      </section>

      <section className="mt-14">
        <SectionHeader
          eyebrow="Customization"
          title="Send the details that make it yours."
          description="Customers may send a photo, edited design, initials, names, dates, short words, or a preferred text and font style."
        />
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            "a photo",
            "an already edited design",
            "initials, names, dates, or short words",
            "preferred text and font style",
          ].map((option) => (
            <div
              key={option}
              className="rounded-2xl border border-[#efccd4] bg-white/78 p-4 text-sm font-semibold text-[#7A3F63]"
            >
              {option}
            </div>
          ))}
        </div>
      </section>

      <section className="mt-14">
        <SectionHeader
          eyebrow="How it works"
          title="From idea to confirmed batch."
          description="Every customized engraved order starts as a request so we can confirm the design, timeline, final price, and payment details."
        />
        <div className="mt-7 grid gap-4 md:grid-cols-4">
          {steps.map((step, index) => (
            <div key={step} className="rounded-3xl boutique-card p-5">
              <p className="text-sm font-semibold text-[#c6a15a]">
                Step {index + 1}
              </p>
              <p className="mt-3 text-sm leading-6 text-[#6f3f52]">{step}</p>
            </div>
          ))}
        </div>
      </section>

      <div id="customized-request-form" className="mt-14 scroll-mt-28">
        <CustomizedEngravedRequestForm />
      </div>

      <section className="mt-10 rounded-[2rem] border border-[#efccd4] bg-white/78 p-6 text-sm leading-6 text-[#6f3f52] shadow-[0_18px_45px_rgba(211,140,157,0.12)]">
        <p className="font-semibold text-[#7A3F63]">
          Prefer to message first?
        </p>
        <p className="mt-2">
          You can also send your event date, quantity, design idea, and
          reference link directly through Instagram or Facebook.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <a
            href={instagramUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-10 items-center justify-center rounded-full bg-[#d38aa0] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#c77992]"
          >
            Instagram
          </a>
          <a
            href={facebookUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-10 items-center justify-center rounded-full border border-[#D5A84F] bg-[#FFF8F3] px-5 py-2 text-sm font-semibold text-[#7A3F63] hover:bg-[#FFEAF2]"
          >
            Facebook
          </a>
        </div>
      </section>
    </main>
  );
}
