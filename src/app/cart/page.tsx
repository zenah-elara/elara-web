import { CartView } from "@/components/cart/cart-view";
import { SectionHeader } from "@/components/section-header";

export default function CartPage() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
      <SectionHeader
        eyebrow="Cart"
        title="Your cart"
        description="Review your pieces before sending an order request. Payment is confirmed later through your preferred contact method."
      />
      <CartView />
    </section>
  );
}
