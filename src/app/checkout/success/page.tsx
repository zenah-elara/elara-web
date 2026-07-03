import Link from "next/link";

type CheckoutSuccessPageProps = {
  searchParams?: Promise<{ order?: string; orderNumber?: string }>;
};

export default async function CheckoutSuccessPage({
  searchParams,
}: CheckoutSuccessPageProps) {
  const params = await searchParams;
  const orderNumber = params?.orderNumber ?? params?.order;

  return (
    <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="rounded-[2rem] bg-gradient-to-br from-[#ffd8e8] via-[#fff7fa] to-[#fff4df] p-8 text-center shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#c6a15a]">
          Order request sent
        </p>
        <h1 className="mt-4 text-4xl font-semibold text-[#7A3F63]">
          Your order request has been submitted.
        </h1>
        {orderNumber ? (
          <p className="mt-4 text-lg font-semibold text-[#9A4F78]">
            Order number: {orderNumber}
          </p>
        ) : null}
        <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-[#76504a]">
          We&apos;ll contact you through your selected contact method to confirm
          availability, payment, and delivery.
        </p>
        <Link
          href="/collections"
          className="mt-7 inline-flex min-h-11 items-center justify-center rounded-full bg-[#d38aa0] px-5 py-2 text-sm font-semibold text-white"
        >
          Continue shopping
        </Link>
      </div>
    </section>
  );
}
