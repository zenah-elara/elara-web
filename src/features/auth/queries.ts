import { redirect } from "next/navigation";
import {
  getSupabaseServerClient,
  isSupabaseConfigured,
} from "@/lib/supabase/server";
import type {
  AdminProfile,
  CurrentSession,
  CurrentUser,
  RequireAdminUserResult,
} from "./types";

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase.auth.getUser();

  if (error) {
    return null;
  }

  return data.user;
}

export async function getCurrentSession(): Promise<CurrentSession | null> {
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase.auth.getSession();

  if (error) {
    return null;
  }

  return data.session;
}

export async function getActiveAdminProfile(
  userId: string,
): Promise<AdminProfile | null> {
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("admin_profiles")
    .select(
      "id, user_id, email, role, display_name, is_active, created_at, updated_at",
    )
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    return null;
  }

  return data;
}

export async function requireAdminUser(): Promise<RequireAdminUserResult> {
  if (!isSupabaseConfigured) {
    redirect("/admin/login");
  }

  const user = await getCurrentUser();

  if (!user) {
    redirect("/admin/login");
  }

  const adminProfile = await getActiveAdminProfile(user.id);

  if (!adminProfile) {
    redirect("/admin/login?error=unauthorized");
  }

  // TODO: In the CRUD phase, use this admin profile role to scope admin write
  // authorization before enabling product or collection mutations.
  return { user, adminProfile };
}
