"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminUser } from "@/features/auth/queries";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  customizedEngravedRequestStatuses,
  type CustomizedEngravedRequestStatus,
} from "./types";

async function getRequiredAdminSupabase() {
  await requireAdminUser();
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  return supabase;
}

export async function updateCustomizedEngravedRequestStatus(
  requestId: string,
  formData: FormData,
) {
  const status = String(formData.get("status") ?? "");

  if (
    !customizedEngravedRequestStatuses.includes(
      status as CustomizedEngravedRequestStatus,
    )
  ) {
    redirect(
      "/admin/customized-engraved-requests?message=Invalid%20request%20status.",
    );
  }

  const supabase = await getRequiredAdminSupabase();
  const { error } = await supabase
    .from("customized_engraved_requests")
    .update({ status } as never)
    .eq("id", requestId);

  if (error) {
    redirect(
      "/admin/customized-engraved-requests?message=Request%20status%20could%20not%20be%20updated.",
    );
  }

  revalidatePath("/admin/customized-engraved-requests");
  redirect(
    "/admin/customized-engraved-requests?message=Request%20status%20updated.",
  );
}
