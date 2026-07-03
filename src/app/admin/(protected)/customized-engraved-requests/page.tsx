import { SectionHeader } from "@/components/section-header";
import { updateCustomizedEngravedRequestStatus } from "@/features/admin/customized-engraved/actions";
import { getCustomizedEngravedRequests } from "@/features/admin/customized-engraved/queries";
import {
  customizedEngravedRequestStatuses,
  getCustomizedEngravedStatusLabel,
} from "@/features/admin/customized-engraved/types";

type CustomizedEngravedRequestsPageProps = {
  searchParams?: Promise<{ message?: string }>;
};

function formatDate(value: string | null) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div className="rounded-2xl border border-[#efccd4] bg-white/78 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9d746d]">
        {label}
      </p>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#6f3f52]">
        {value || "Not provided"}
      </p>
    </div>
  );
}

export default async function CustomizedEngravedRequestsPage({
  searchParams,
}: CustomizedEngravedRequestsPageProps) {
  const [requests, params] = await Promise.all([
    getCustomizedEngravedRequests(),
    searchParams,
  ]);

  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <SectionHeader
        eyebrow="Admin"
        title="Customized engraved requests"
        description="Review bulk customized engraved inquiries and update their request status."
      />
      {params?.message ? (
        <div className="mt-6 rounded-2xl border border-[#efd2bc] bg-[#fff7ef] p-4 text-sm font-medium text-[#76504a]">
          {params.message}
        </div>
      ) : null}

      <div className="mt-8 space-y-5">
        {requests.map((request) => (
          <article
            key={request.id}
            className="rounded-3xl border border-[#efccd4] bg-white/82 p-5 shadow-sm"
          >
            <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-semibold text-[#7A3F63]">
                    {request.full_name}
                  </h2>
                  <span className="rounded-full bg-[#fff1f6] px-3 py-1 text-xs font-semibold text-rose">
                    {getCustomizedEngravedStatusLabel(request.status)}
                  </span>
                </div>
                <div className="mt-3 grid gap-2 text-sm leading-6 text-[#76504a] md:grid-cols-3">
                  <p>Submitted: {formatDate(request.created_at)}</p>
                  <p>Needed by: {formatDate(request.needed_by_date)}</p>
                  <p>Quantity: {request.quantity}</p>
                  <p>Contact: {request.contact_method}</p>
                  <p>Purpose: {request.purpose_or_occasion ?? "Not provided"}</p>
                  <p>
                    Piece: {request.piece_type}
                    {request.pendant_shape ? ` · ${request.pendant_shape}` : ""}
                  </p>
                </div>
              </div>
              <form
                action={updateCustomizedEngravedRequestStatus.bind(
                  null,
                  request.id,
                )}
                className="flex flex-wrap items-center gap-2 lg:justify-end"
              >
                <select
                  name="status"
                  defaultValue={request.status}
                  className="rounded-2xl border border-[#efccd4] bg-[#fffaf8] px-3 py-2 text-sm text-[#6f3f52]"
                >
                  {customizedEngravedRequestStatuses.map((status) => (
                    <option key={status} value={status}>
                      {getCustomizedEngravedStatusLabel(status)}
                    </option>
                  ))}
                </select>
                <button className="rounded-full bg-[#d38aa0] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#c77992]">
                  Update status
                </button>
              </form>
            </div>

            <details className="mt-5 rounded-2xl border border-[#efccd4] bg-[#fffaf8] p-4">
              <summary className="cursor-pointer text-sm font-semibold text-[#7A3F63]">
                View all request details
              </summary>
              <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                <DetailRow label="Contact details" value={request.contact_details} />
                <DetailRow
                  label="Customization type"
                  value={request.customization_type}
                />
                <DetailRow label="Chain option" value={request.chain_option} />
                <DetailRow
                  label="Text to engrave or print"
                  value={request.engraving_text}
                />
                <DetailRow label="Font preference" value={request.font_preference} />
                <DetailRow
                  label="Design/reference link"
                  value={request.design_reference_link}
                />
                <DetailRow
                  label="Delivery or pickup location"
                  value={request.delivery_or_pickup_location}
                />
                <DetailRow
                  label="Additional notes"
                  value={request.additional_notes}
                />
              </div>
            </details>
          </article>
        ))}
        {requests.length === 0 ? (
          <div className="rounded-3xl boutique-card p-8 text-center text-[#76504a]">
            No customized engraved requests yet.
          </div>
        ) : null}
      </div>
    </section>
  );
}
