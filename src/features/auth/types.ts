import type { User, Session } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

export type AuthActionResult = {
  success: boolean;
  message?: string;
};

export type CurrentUser = User;

export type CurrentSession = Session;

export type AdminRole = "owner" | "admin" | "staff";

export type AdminProfile = Database["public"]["Tables"]["admin_profiles"]["Row"];

export type RequireAdminUserResult = {
  user: CurrentUser;
  adminProfile: AdminProfile;
};
