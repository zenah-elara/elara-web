import { requireAdminUser } from "@/features/auth/queries";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { CustomizedEngravedRequest } from "./types";

async function getRequiredAdminSupabase() {
  await requireAdminUser();
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  return supabase;
}

function safeRequestWarning(queryName: string) {
  console.warn(`[admin customized engraved requests] ${queryName} failed.`);
}

export async function getCustomizedEngravedRequests(): Promise<
  CustomizedEngravedRequest[]
> {
  const supabase = await getRequiredAdminSupabase();
  const { data, error } = await supabase
    .from("customized_engraved_requests")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    safeRequestWarning("getCustomizedEngravedRequests");
    return [];
  }

  return (data ?? []) as CustomizedEngravedRequest[];
}

export async function getCustomizedEngravedRequestCounts() {
  const requests = await getCustomizedEngravedRequests();

  return {
    all: requests.length,
    new: requests.filter((request) => request.status === "new").length,
  };
}
