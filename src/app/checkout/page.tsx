import { CheckoutView } from "@/components/checkout/checkout-view";
import { SectionHeader } from "@/components/section-header";

export default function CheckoutPage() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="rounded-[2rem] bg-gradient-to-br from-[#ffd8e8] via-[#fff7fa] to-[#fff4df] p-8 shadow-sm">
        <SectionHeader
          eyebrow="Order request"
          title="No guessing, no pressure."
          description="Since payment is not collected directly on the site yet, every order starts as a request. We'll personally confirm the details with you through your preferred contact method before anything is finalized."
        />
      </div>
      <CheckoutView />
    </section>
  );
}
