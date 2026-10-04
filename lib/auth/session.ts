import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Server-side session and role checks (security.md 3, layer 1).
 *
 * RLS is layer 2 and would refuse the data anyway; this layer exists so an
 * unauthenticated visitor gets a redirect to the login page rather than an
 * admin shell full of empty tables, and so a Server Action refuses before it
 * touches anything.
 */

export type OwnerSession = {
  userId: string;
  email: string | null;
  fullName: string | null;
};

/**
 * The signed-in user, or null.
 *
 * `getUser()`, never `getSession()`: getSession reads the cookie and trusts
 * it, while getUser revalidates the token with the auth server. For an
 * authorisation decision only the verified answer is worth having.
 */
export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Returns the session only if the user is a signed-in owner, else null.
 *
 * The role comes from `profiles`, read under RLS — so this cannot report
 * "owner" for someone the database would not treat as one.
 */
export async function getOwnerSession(): Promise<OwnerSession | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, email")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "owner") return null;

  return {
    userId: user.id,
    email: profile.email ?? user.email ?? null,
    fullName: profile.full_name,
  };
}

/**
 * Guard for admin pages. Redirects instead of returning, so a page body can
 * never accidentally continue rendering for someone who failed the check.
 */
export async function requireOwner(): Promise<OwnerSession> {
  const session = await getOwnerSession();
  if (!session) redirect("/login");
  return session;
}

/**
 * Guard for Server Actions.
 *
 * Returns null rather than redirecting: an action has to answer with the
 * typed error result its caller expects, and throwing a redirect out of a
 * mutation would lose the error the form needs to show.
 */
export async function getOwnerOrNull(): Promise<OwnerSession | null> {
  return getOwnerSession();
}
