"use client";

import { useActionState } from "react";
import { updateHomepageHero } from "@/features/admin/site-assets/actions";
import type { HomepageHeroActionState } from "@/features/admin/site-assets/actions";
import { HomepageImageSubmitButton } from "./homepage-image-submit-button";

type HomepageImageFormProps = {
  existingImageUrl?: string | null;
  title?: string | null;
  altText?: string | null;
  initialMessage?: string | null;
};

export function HomepageImageForm({
  existingImageUrl,
  title,
  altText,
  initialMessage,
}: HomepageImageFormProps) {
  const initialState: HomepageHeroActionState = {
    success: false,
    message: initialMessage ?? "",
  };
  const [state, formAction] = useActionState(updateHomepageHero, initialState);

  return (
    <form action={formAction} className="space-y-5 rounded-3xl boutique-card p-6">
      {state.message ? (
        <div
          className={`rounded-2xl border p-4 text-sm font-medium ${
            state.success
              ? "border-[#D5A84F]/70 bg-[#fff8e8] text-[#7A3F63]"
              : "border-[#efd2bc] bg-[#fff7ef] text-[#76504a]"
          }`}
        >
          {state.message}
        </div>
      ) : null}
      <input
        type="hidden"
        name="existing_image_url"
        value={existingImageUrl ?? ""}
      />
      <label className="block">
        <span className="text-sm font-semibold text-cocoa">Title / label</span>
        <input
          name="title"
          defaultValue={title ?? "Homepage hero"}
          className="mt-2 w-full rounded-2xl border border-[#efccd4] bg-[#fffaf8] px-4 py-3 text-sm text-cocoa outline-none"
        />
      </label>
      <label className="block">
        <span className="text-sm font-semibold text-cocoa">Hero image</span>
        <input
          name="image"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="mt-2 w-full text-sm text-[#76504a]"
        />
        <span className="mt-2 block text-xs font-medium text-[#8f4f68]">
          Upload a JPG, PNG, or WebP image under 8 MB.
        </span>
      </label>
      <label className="block">
        <span className="text-sm font-semibold text-cocoa">Alt text</span>
        <input
          name="alt_text"
          defaultValue={altText ?? ""}
          className="mt-2 w-full rounded-2xl border border-[#efccd4] bg-[#fffaf8] px-4 py-3 text-sm text-cocoa outline-none"
        />
      </label>
      <label className="flex items-center gap-3 text-sm font-semibold text-cocoa">
        <input name="clear_image" type="checkbox" className="h-4 w-4" />
        Clear current image
      </label>
      <HomepageImageSubmitButton />
    </form>
  );
}
