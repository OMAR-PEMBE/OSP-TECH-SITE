"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loginSchema } from "@/lib/validation/auth";
import { LOGIN_RULES, checkRateLimit } from "@/lib/rate-limit";
import { getRequestIp } from "@/lib/request-ip";
import { type ActionResult, err } from "@/lib/types/action";
import { safeNextPath } from "@/lib/auth/safe-next";

/**
 * Sign in (FR-A1, API.md 4).
 *
 * Every failure returns the same generic message. Distinguishing "no such
 * account" from "wrong password" hands an attacker a free way to enumerate
 * which email addresses exist (security.md 5).
 *
 * On success this redirects rather than returning, so there is no window in
 * which the browser holds a session but still shows the login form.
 */

const GENERIC_ERROR = "That email or password is not right.";

export async function signIn(formData: FormData): Promise<ActionResult<never>> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email") ?? "",
    password: formData.get("password") ?? "",
    next: formData.get("next") ?? undefined,
  });

  if (!parsed.success) {
    return err("VALIDATION", "Enter your email and password.");
  }

  const ip = await getRequestIp();
  const { allowed } = await checkRateLimit(`login:${ip}`, LOGIN_RULES);
  if (!allowed) {
    return err(
      "RATE_LIMITED",
      "Too many attempts. Please wait a few minutes and try again.",
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    /* Logged server-side with the reason; the client only ever sees the
       generic message (security.md 13). */
    console.warn("signIn failed", { reason: error.message });
    return err("UNAUTHENTICATED", GENERIC_ERROR);
  }

  /* Only same-origin paths — see safeNextPath for why a prefix check is not
     enough. */
  redirect(safeNextPath(parsed.data.next));
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
