export function ProductPublishingFields({
  defaultPublished = false,
}: {
  defaultPublished?: boolean;
}) {
  return (
    <fieldset className="rounded-2xl border border-[#efccd4] bg-[#fffaf8] p-5">
      <legend className="px-1 text-sm font-semibold text-cocoa">Publishing</legend>
      <div className="mt-2 grid gap-3 sm:grid-cols-2">
        <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[#efccd4] bg-white p-4">
          <input name="publication_status" type="radio" value="draft" defaultChecked={!defaultPublished} className="mt-1 h-4 w-4" />
          <span>
            <span className="block text-sm font-semibold text-[#7A3F63]">Draft</span>
            <span className="mt-1 block text-xs leading-5 text-[#8f5574]">Saved in Admin but hidden from customers.</span>
          </span>
        </label>
        <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[#efccd4] bg-white p-4">
          <input name="publication_status" type="radio" value="published" defaultChecked={defaultPublished} className="mt-1 h-4 w-4" />
          <span>
            <span className="block text-sm font-semibold text-[#7A3F63]">Published</span>
            <span className="mt-1 block text-xs leading-5 text-[#8f5574]">Visible to customers when the product is Active and its collection is Published.</span>
          </span>
        </label>
      </div>
      <p className="mt-3 text-xs leading-5 text-[#76504a]">
        Publishing releases the product. Active controls whether it is currently enabled for sale; an inactive product stays hidden even when Published.
      </p>
    </fieldset>
  );
}
