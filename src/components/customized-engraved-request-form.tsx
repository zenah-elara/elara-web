"use client";

import { useActionState, useMemo, useState } from "react";
import {
  submitCustomizedEngravedRequest,
  type CustomizedEngravedRequestState,
} from "@/features/customized-engraved/actions";

const fourWeekError =
  "Customized engraved requests must be submitted at least 4 weeks before the needed date.";

function getMinimumDate() {
  const date = new Date();
  date.setDate(date.getDate() + 28);

  return date.toISOString().slice(0, 10);
}

type FieldProps = {
  label: string;
  name: string;
  children?: React.ReactNode;
  helper?: string;
};

function Field({ label, name, children, helper }: FieldProps) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-[#7A3F63]">{label}</span>
      {children ?? (
        <input
          name={name}
          className="mt-2 w-full rounded-2xl border border-[#efccd4] bg-white/82 px-4 py-3 text-sm text-[#6f3f52] outline-none focus:border-[#D5A84F] focus:ring-2 focus:ring-[#D5A84F]/25"
        />
      )}
      {helper ? (
        <span className="mt-2 block text-xs leading-5 text-[#76504a]">
          {helper}
        </span>
      ) : null}
    </label>
  );
}

export function CustomizedEngravedRequestForm() {
  const minimumDate = useMemo(() => getMinimumDate(), []);
  const [error, setError] = useState("");
  const initialState: CustomizedEngravedRequestState = {
    success: false,
    message: "",
  };
  const [state, formAction, isPending] = useActionState(
    submitCustomizedEngravedRequest,
    initialState,
  );

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    const formData = new FormData(event.currentTarget);
    const neededByDate = String(formData.get("needed_by_date") ?? "");

    if (!neededByDate || neededByDate < minimumDate) {
      event.preventDefault();
      setError(fourWeekError);
      return;
    }

    setError("");
  }

  return (
    <section className="rounded-[2rem] border border-[#efccd4] bg-white/78 p-5 shadow-[0_22px_55px_rgba(211,140,157,0.14)] sm:p-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#c6a15a]">
          Request form
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-[#A55166] [font-family:Georgia,'Times_New_Roman',serif]">
          Tell us about your batch
        </h2>
        <p className="mt-3 text-sm leading-6 text-[#6f3f52]">
          We require at least 4 weeks before your needed date. Requests needed
          sooner than 4 weeks cannot be accepted.
        </p>
      </div>

      {state.message || error ? (
        <div
          className={`mt-5 rounded-2xl border p-4 text-sm font-semibold leading-6 ${
            state.success && !error
              ? "border-[#D5A84F]/70 bg-[#fff8e8] text-[#7A3F63]"
              : "border-[#efd2bc] bg-[#fff7ef] text-[#76504a]"
          }`}
        >
          {error || state.message}
        </div>
      ) : null}

      <form
        action={formAction}
        onSubmit={handleSubmit}
        className="mt-6 grid gap-5 md:grid-cols-2"
      >
        <Field label="Full name" name="full_name">
          <input
            name="full_name"
            required
            className="mt-2 w-full rounded-2xl border border-[#efccd4] bg-white/82 px-4 py-3 text-sm text-[#6f3f52] outline-none focus:border-[#D5A84F] focus:ring-2 focus:ring-[#D5A84F]/25"
          />
        </Field>
        <Field label="Contact method" name="contact_method">
          <select
            name="contact_method"
            required
            className="mt-2 w-full rounded-2xl border border-[#efccd4] bg-white/82 px-4 py-3 text-sm text-[#6f3f52] outline-none focus:border-[#D5A84F] focus:ring-2 focus:ring-[#D5A84F]/25"
          >
            <option>Instagram</option>
            <option>Facebook</option>
            <option>Phone</option>
            <option>Email</option>
          </select>
        </Field>
        <Field label="Contact details" name="contact_details">
          <input
            name="contact_details"
            required
            className="mt-2 w-full rounded-2xl border border-[#efccd4] bg-white/82 px-4 py-3 text-sm text-[#6f3f52] outline-none focus:border-[#D5A84F] focus:ring-2 focus:ring-[#D5A84F]/25"
          />
        </Field>
        <Field label="Purpose or occasion" name="purpose_or_occasion">
          <select
            name="purpose_or_occasion"
            className="mt-2 w-full rounded-2xl border border-[#efccd4] bg-white/82 px-4 py-3 text-sm text-[#6f3f52] outline-none focus:border-[#D5A84F] focus:ring-2 focus:ring-[#D5A84F]/25"
          >
            <option>Wedding</option>
            <option>Birthday</option>
            <option>Corporate</option>
            <option>Group gift</option>
            <option>Souvenir</option>
            <option>Reunion</option>
            <option>Other</option>
          </select>
        </Field>
        <Field label="Piece type" name="piece_type">
          <select
            name="piece_type"
            required
            className="mt-2 w-full rounded-2xl border border-[#efccd4] bg-white/82 px-4 py-3 text-sm text-[#6f3f52] outline-none focus:border-[#D5A84F] focus:ring-2 focus:ring-[#D5A84F]/25"
          >
            <option>Necklace</option>
            <option>Bracelet</option>
          </select>
        </Field>
        <Field label="Pendant shape" name="pendant_shape">
          <select
            name="pendant_shape"
            className="mt-2 w-full rounded-2xl border border-[#efccd4] bg-white/82 px-4 py-3 text-sm text-[#6f3f52] outline-none focus:border-[#D5A84F] focus:ring-2 focus:ring-[#D5A84F]/25"
          >
            <option>Circle</option>
            <option>Oval</option>
            <option>Heart</option>
            <option>Horizontal oval</option>
            <option>Not sure yet</option>
          </select>
        </Field>
        <Field label="Chain option" name="chain_option">
          <select
            name="chain_option"
            className="mt-2 w-full rounded-2xl border border-[#efccd4] bg-white/82 px-4 py-3 text-sm text-[#6f3f52] outline-none focus:border-[#D5A84F] focus:ring-2 focus:ring-[#D5A84F]/25"
          >
            <option>Basic</option>
            <option>Premium</option>
            <option>Not sure yet</option>
          </select>
        </Field>
        <Field label="Quantity" name="quantity">
          <select
            name="quantity"
            required
            className="mt-2 w-full rounded-2xl border border-[#efccd4] bg-white/82 px-4 py-3 text-sm text-[#6f3f52] outline-none focus:border-[#D5A84F] focus:ring-2 focus:ring-[#D5A84F]/25"
          >
            <option>10</option>
            <option>20</option>
            <option>More than 20</option>
          </select>
        </Field>
        <Field label="Customization type" name="customization_type">
          <select
            name="customization_type"
            required
            className="mt-2 w-full rounded-2xl border border-[#efccd4] bg-white/82 px-4 py-3 text-sm text-[#6f3f52] outline-none focus:border-[#D5A84F] focus:ring-2 focus:ring-[#D5A84F]/25"
          >
            <option>Photo</option>
            <option>Edited photo</option>
            <option>Words only</option>
            <option>Initials</option>
            <option>Other</option>
          </select>
        </Field>
        <Field label="Text to engrave or print" name="engraving_text" />
        <Field label="Font preference" name="font_preference" />
        <Field
          label="Design/photo link or reference link"
          name="design_reference_link"
          helper="You may include a Google Drive, Instagram, or reference link here. We will also message you after submission if we need the actual file."
        />
        <Field
          label="Needed by date"
          name="needed_by_date"
          helper="We require at least 4 weeks before your needed date. Requests needed sooner than 4 weeks cannot be accepted."
        >
          <input
            name="needed_by_date"
            type="date"
            min={minimumDate}
            required
            className="mt-2 w-full rounded-2xl border border-[#efccd4] bg-white/82 px-4 py-3 text-sm text-[#6f3f52] outline-none focus:border-[#D5A84F] focus:ring-2 focus:ring-[#D5A84F]/25"
          />
        </Field>
        <Field
          label="Delivery or pickup location"
          name="delivery_or_pickup_location"
        />
        <label className="block md:col-span-2">
          <span className="text-sm font-semibold text-[#7A3F63]">
            Additional notes
          </span>
          <textarea
            name="additional_notes"
            rows={4}
            className="mt-2 w-full rounded-2xl border border-[#efccd4] bg-white/82 px-4 py-3 text-sm text-[#6f3f52] outline-none focus:border-[#D5A84F] focus:ring-2 focus:ring-[#D5A84F]/25"
          />
        </label>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-[linear-gradient(135deg,#E2B4C1_0%,#D38C9D_42%,#A55166_100%)] px-6 py-2 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(211,140,157,0.3)] transition hover:-translate-y-0.5 md:col-span-2"
        >
          {isPending ? "Sending request..." : "Submit customized request"}
        </button>
      </form>
    </section>
  );
}
