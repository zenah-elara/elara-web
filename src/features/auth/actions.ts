"use server";

import { redirect } from "next/navigation";
import {
  getSupabaseServerClient,
  isSupabaseConfigured,
} from "@/lib/supabase/server";
import type { AuthActionResult } from "./types";

const loginUnavailableMessage =
  "Admin login is not connected yet. Configure Supabase env vars to enable admin access.";

function loginErrorRedirect(message: string): never {
  redirect(`/admin/login?error=${encodeURIComponent(message)}`);
}

export async function signInWithEmailPassword(
  email: string,
  password: string,
): Promise<AuthActionResult> {
  if (!isSupabaseConfigured) {
    return {
      success: false,
      message: loginUnavailableMessage,
    };
  }

  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return {
      success: false,
      message: loginUnavailableMessage,
    };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {
      success: false,
      message: "Invalid email or password.",
    };
  }

  return { success: true };
}

export async function signInWithEmailPasswordAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    loginErrorRedirect("Enter your email and password.");
  }

  const result = await signInWithEmailPassword(email, password);

  if (!result.success) {
    loginErrorRedirect(result.message ?? "Unable to sign in.");
  }

  redirect("/admin");
}

export async function signOut() {
  const supabase = await getSupabaseServerClient();

  if (supabase) {
    await supabase.auth.signOut();
  }

  redirect("/admin/login");
}
