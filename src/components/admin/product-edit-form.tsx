"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { ProductVariantFormProvider } from "@/components/admin/product-variant-form-context";
import { updateProduct } from "@/features/admin/catalog/actions";

export function ProductEditForm({
  productId,
  defaultHasVariants,
  children,
}: {
  productId: string;
  defaultHasVariants: boolean;
  children: React.ReactNode;
}) {
  const [state, action] = useActionState(updateProduct.bind(null, productId), {
    success: false,
    message: "",
  });

  return (
    <form
      action={action}
      noValidate
      className="mt-8 space-y-6 rounded-3xl boutique-card p-6"
    >
      {state.message ? (
        <div
          role={state.success ? "status" : "alert"}
          className={`rounded-2xl border p-4 text-sm font-semibold ${
            state.success
              ? "border-[#b9d5bd] bg-[#f2fbf3] text-[#447451]"
              : "border-[#e6a9b8] bg-[#fff1f5] text-[#8e3658]"
          }`}
        >
          {state.message}
        </div>
      ) : null}
      <ProductVariantFormProvider defaultHasVariants={defaultHasVariants}>
        {children}
        <SaveProductButton />
      </ProductVariantFormProvider>
    </form>
  );
}

function SaveProductButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#d38aa0] px-5 py-2 text-sm font-semibold text-white shadow-[0_12px_25px_rgba(201,130,149,0.22)] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Saving..." : "Save product"}
    </button>
  );
}
