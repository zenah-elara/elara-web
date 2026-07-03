"use server";

import { getSupabasePublicServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

type RequestInsert =
  Database["public"]["Tables"]["customized_engraved_requests"]["Insert"];

export type CustomizedEngravedRequestState = {
  success: boolean;
  message: string;
};

const successMessage =
  "Thank you! Your customized engraved request has been sent. We’ll message you to confirm the design, timeline, final price, and payment details.";
const failureMessage =
  "Your request could not be sent. Please try again or message us directly on Instagram or Facebook.";
const fourWeekError =
  "Customized engraved requests must be submitted at least 4 weeks before the needed date.";

function clean(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function optionalText(formData: FormData, key: string) {
  const value = clean(formData, key);

  return value || null;
}

function minimumNeededByDate() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 28);

  return date;
}

function isValidNeededByDate(value: string) {
  if (!value) {
    return false;
  }

  const neededBy = new Date(`${value}T00:00:00`);

  return Number.isFinite(neededBy.getTime()) && neededBy >= minimumNeededByDate();
}

function logRequestFailure(step: string, error?: unknown) {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  const safeError = error as {
    code?: string;
    message?: string;
    details?: string;
    hint?: string;
  } | null;

  console.warn("[customized engraved requests] submit failed", {
    step,
    error: safeError
      ? {
          code: safeError.code,
          message: safeError.message,
          details: safeError.details,
          hint: safeError.hint,
        }
      : null,
  });
}

export async function submitCustomizedEngravedRequest(
  _previousState: CustomizedEngravedRequestState,
  formData: FormData,
): Promise<CustomizedEngravedRequestState> {
  const supabase = getSupabasePublicServerClient();

  if (!supabase) {
    logRequestFailure("supabase_not_configured");
    return { success: false, message: failureMessage };
  }

  const fullName = clean(formData, "full_name");
  const contactMethod = clean(formData, "contact_method");
  const contactDetails = clean(formData, "contact_details");
  const pieceType = clean(formData, "piece_type");
  const quantity = clean(formData, "quantity");
  const customizationType = clean(formData, "customization_type");
  const neededByDate = clean(formData, "needed_by_date");

  if (
    !fullName ||
    !contactMethod ||
    !contactDetails ||
    !pieceType ||
    !quantity ||
    !customizationType
  ) {
    return {
      success: false,
      message: "Please complete the required request details.",
    };
  }

  if (!isValidNeededByDate(neededByDate)) {
    return { success: false, message: fourWeekError };
  }

  const payload: RequestInsert = {
    full_name: fullName,
    contact_method: contactMethod,
    contact_details: contactDetails,
    purpose_or_occasion: optionalText(formData, "purpose_or_occasion"),
    piece_type: pieceType,
    pendant_shape: optionalText(formData, "pendant_shape"),
    chain_option: optionalText(formData, "chain_option"),
    quantity,
    customization_type: customizationType,
    engraving_text: optionalText(formData, "engraving_text"),
    font_preference: optionalText(formData, "font_preference"),
    design_reference_link: optionalText(formData, "design_reference_link"),
    needed_by_date: neededByDate,
    delivery_or_pickup_location: optionalText(
      formData,
      "delivery_or_pickup_location",
    ),
    additional_notes: optionalText(formData, "additional_notes"),
  };

  const { error } = await supabase
    .from("customized_engraved_requests")
    .insert(payload as never);

  if (error) {
    logRequestFailure("insert", error);
    return { success: false, message: failureMessage };
  }

  return { success: true, message: successMessage };
}
