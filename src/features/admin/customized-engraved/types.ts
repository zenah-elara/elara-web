import type { Database } from "@/lib/supabase/types";

export type CustomizedEngravedRequest =
  Database["public"]["Tables"]["customized_engraved_requests"]["Row"];

export type CustomizedEngravedRequestStatus =
  CustomizedEngravedRequest["status"];

export const customizedEngravedRequestStatuses = [
  "new",
  "contacted",
  "in_discussion",
  "confirmed",
  "declined",
  "completed",
] as const satisfies CustomizedEngravedRequestStatus[];

export function getCustomizedEngravedStatusLabel(
  status: CustomizedEngravedRequestStatus,
) {
  return status
    .split("_")
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(" ");
}
