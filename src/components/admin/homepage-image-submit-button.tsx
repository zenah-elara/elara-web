"use client";

import { useFormStatus } from "react-dom";

export function HomepageImageSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#d38aa0] px-5 py-2 text-sm font-semibold text-white shadow-[0_12px_25px_rgba(201,130,149,0.22)] transition hover:bg-[#c97890] disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? "Uploading..." : "Save homepage image"}
    </button>
  );
}
