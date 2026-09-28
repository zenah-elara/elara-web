"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { ProductVariantFormProvider } from "@/components/admin/product-variant-form-context";
import { createProduct } from "@/features/admin/catalog/actions";

export function ProductCreateForm({ children }: { children: React.ReactNode }) {
  const [state, action] = useActionState(createProduct, {
    success: false,
    message: "",
  });

  return (
    <form action={action} className="mt-8 space-y-6 rounded-3xl boutique-card p-6">
      {state.message ? (
        <div role="alert" className="rounded-2xl border border-[#e6a9b8] bg-[#fff1f5] p-4 text-sm font-semibold text-[#8e3658]">
          {state.message}
        </div>
      ) : null}
      <ProductVariantFormProvider defaultHasVariants={false}>
        {children}
        <CreateProductButton />
      </ProductVariantFormProvider>
    </form>
  );
}

function CreateProductButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#d38aa0] px-5 py-2 text-sm font-semibold text-white shadow-[0_12px_25px_rgba(201,130,149,0.22)] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Creating product..." : "Create product"}
    </button>
  );
}
