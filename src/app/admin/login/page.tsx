import Image from "next/image";
import { redirect } from "next/navigation";
import {
  signInWithEmailPasswordAction,
  signOut,
} from "@/features/auth/actions";
import { getCurrentUser } from "@/features/auth/queries";
import { isSupabaseConfigured } from "@/lib/supabase/server";

type AdminLoginPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function AdminLoginPage({
  searchParams,
}: AdminLoginPageProps) {
  const [params, currentUser] = await Promise.all([
    searchParams,
    getCurrentUser(),
  ]);

  const isUnauthorized = params?.error === "unauthorized";

  if (currentUser && !isUnauthorized) {
    redirect("/admin");
  }

  const errorMessage = isUnauthorized
    ? "This account is signed in but does not have admin access."
    : params?.error;

  return (
    <section className="mx-auto flex min-h-[calc(100vh-18rem)] max-w-7xl items-center justify-center px-4 py-14 sm:px-6 lg:px-8">
      <div className="w-full max-w-md rounded-[2rem] border border-[#efccd4] bg-white/84 p-7 shadow-[0_24px_60px_rgba(201,130,149,0.14)]">
        <div className="flex justify-center">
          <Image
            src="/elara-logo.png"
            alt="elara. logo"
            width={1254}
            height={1254}
            priority
            className="h-auto w-36 object-contain"
          />
        </div>
        <div className="mt-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">
            Admin login
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-cocoa">
            Sign in to manage elara.
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#76504a]">
            Admin access is limited to authenticated Supabase users for this
            phase.
          </p>
        </div>

        {!isSupabaseConfigured ? (
          <div className="mt-6 rounded-2xl border border-[#efd2bc] bg-[#fff7ef] p-4 text-sm leading-6 text-[#76504a]">
            Admin login is not connected yet. Configure Supabase env vars to
            enable admin access.
          </div>
        ) : null}

        {errorMessage ? (
          <div className="mt-6 rounded-2xl border border-[#efd2bc] bg-[#fff7ef] p-4 text-sm font-medium text-[#76504a]">
            {errorMessage}
          </div>
        ) : null}

        {currentUser && isUnauthorized ? (
          <form action={signOut} className="mt-5">
            <button
              type="submit"
              className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-[#d8b36a] bg-[#fffdf8]/85 px-5 py-2 text-sm font-semibold text-[#76504a] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#fff5e8]"
            >
              Sign out
            </button>
          </form>
        ) : null}

        {currentUser && isUnauthorized ? null : (
          <form action={signInWithEmailPasswordAction} className="mt-7 space-y-4">
            <label className="block">
              <span className="text-sm font-semibold text-cocoa">Email</span>
              <input
                type="email"
                name="email"
                autoComplete="email"
                required
                disabled={!isSupabaseConfigured}
                className="mt-2 w-full rounded-2xl border border-[#efccd4] bg-[#fffaf8] px-4 py-3 text-sm text-cocoa outline-none transition focus:border-[#d8b36a] focus:ring-4 focus:ring-[#f6dfac]/35 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-cocoa">Password</span>
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                required
                disabled={!isSupabaseConfigured}
                className="mt-2 w-full rounded-2xl border border-[#efccd4] bg-[#fffaf8] px-4 py-3 text-sm text-cocoa outline-none transition focus:border-[#d8b36a] focus:ring-4 focus:ring-[#f6dfac]/35 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </label>
            <button
              type="submit"
              disabled={!isSupabaseConfigured}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[#d38aa0] px-5 py-2 text-sm font-semibold text-white shadow-[0_12px_25px_rgba(201,130,149,0.22)] transition hover:-translate-y-0.5 hover:bg-[#c77992] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >
              Sign in
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
