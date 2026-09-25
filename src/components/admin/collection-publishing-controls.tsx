"use client";

import { useState } from "react";
import {
  publishAllReadyCollections,
  setCollectionPublished,
} from "@/features/admin/catalog/actions";

type Confirmation = "unpublish" | "publish-all" | null;

function ConfirmationPanel({
  title,
  copy,
  confirmLabel,
  action,
  onCancel,
}: {
  title: string;
  copy: string;
  confirmLabel: string;
  action: () => Promise<void>;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#532b45]/25 px-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="collection-confirmation-title"
        className="w-full max-w-md rounded-3xl border border-[#efccd4] bg-[#fffaf8] p-6 shadow-[0_24px_70px_rgba(122,63,99,0.2)]"
      >
        <h2
          id="collection-confirmation-title"
          className="text-xl font-semibold text-[#7A3F63]"
        >
          {title}
        </h2>
        <p className="mt-3 text-sm leading-6 text-[#8f5574]">{copy}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-[#efccd4] bg-white px-4 py-2 text-sm font-semibold text-[#7A3F63]"
          >
            Cancel
          </button>
          <form action={action}>
            <button className="rounded-full bg-[#d38aa0] px-4 py-2 text-sm font-semibold text-white">
              {confirmLabel}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export function CollectionPublishControl({
  collectionId,
  isPublished,
}: {
  collectionId: string;
  isPublished: boolean;
}) {
  const [confirmation, setConfirmation] = useState<Confirmation>(null);

  if (!isPublished) {
    return (
      <form action={setCollectionPublished.bind(null, collectionId, true)}>
        <button className="rounded-full bg-[#fff1f6] px-3 py-1 text-xs font-semibold text-[#8f4f68]">
          Publish
        </button>
      </form>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirmation("unpublish")}
        className="rounded-full bg-[#fff1f6] px-3 py-1 text-xs font-semibold text-[#8f4f68]"
      >
        Unpublish
      </button>
      {confirmation === "unpublish" ? (
        <ConfirmationPanel
          title="Unpublish this collection?"
          copy="This collection will be hidden from customers, but all Admin data will be kept."
          confirmLabel="Unpublish"
          action={setCollectionPublished.bind(null, collectionId, false)}
          onCancel={() => setConfirmation(null)}
        />
      ) : null}
    </>
  );
}

export function PublishAllCollectionsControl() {
  const [confirmation, setConfirmation] = useState<Confirmation>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirmation("publish-all")}
        className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#d8b36a] bg-[#fffdf8] px-5 py-2 text-sm font-semibold text-[#7A3F63] shadow-sm transition hover:bg-[#fff1f6]"
      >
        Publish all ready collections
      </button>
      {confirmation === "publish-all" ? (
        <ConfirmationPanel
          title="Publish all ready collections?"
          copy="This will make all ready draft collections and their products visible to customers."
          confirmLabel="Publish all"
          action={publishAllReadyCollections}
          onCancel={() => setConfirmation(null)}
        />
      ) : null}
    </>
  );
}
