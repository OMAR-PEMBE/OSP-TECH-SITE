import "server-only";

import { revalidatePath } from "next/cache";
import type { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getOwnerOrNull } from "@/lib/auth/session";
import { type ActionResult, err, ok } from "@/lib/types/action";

/**
 * The shared body of every content CRUD action (API.md 4.1, agents.md 5).
 *
 * Each admin mutation has to do the same five things, in the same order:
 * check the session and role, parse with Zod, write, revalidate the public
 * routes the change affects, and return a typed result. Repeating that by
 * hand across six entities is how one of them ends up missing the role check
 * or the revalidate — so it lives here once.
 *
 * Note this is layer 1 only. The write still runs as the signed-in user, so
 * RLS evaluates `is_owner()` underneath every statement. If this helper were
 * wrong, the database would still refuse (security.md 3).
 */

export type ContentTable =
  | "services"
  | "products"
  | "portfolio_items"
  | "posts"
  | "settings"
  | "messages";

/** Public routes to rebuild after a change to each table. */
const REVALIDATE: Record<ContentTable, string[]> = {
  services: ["/", "/services"],
  products: ["/", "/products"],
  portfolio_items: ["/", "/portfolio"],
  posts: ["/", "/blog"],
  settings: ["/", "/services", "/about", "/contact", "/blog"],
  /* Messages are never public, so nothing to rebuild. */
  messages: [],
};

/** Rebuilds the public pages a table feeds, plus any extra path given. */
export function revalidateFor(table: ContentTable, extraPaths: string[] = []) {
  for (const path of [...REVALIDATE[table], ...extraPaths]) {
    revalidatePath(path);
  }
}

/**
 * Runs `fn` only for a signed-in owner.
 *
 * Returns the typed `UNAUTHENTICATED` result rather than redirecting: a
 * Server Action must answer its caller with something the form can render.
 */
export async function withOwner<T>(
  fn: (ctx: {
    supabase: Awaited<ReturnType<typeof createClient>>;
    userId: string;
  }) => Promise<ActionResult<T>>,
): Promise<ActionResult<T>> {
  const session = await getOwnerOrNull();
  if (!session) {
    return err("UNAUTHENTICATED", "Please sign in again.");
  }

  try {
    const supabase = await createClient();
    return await fn({ supabase, userId: session.userId });
  } catch (cause) {
    console.error("admin action failed", cause);
    return err("SERVER_ERROR", "Something went wrong. Please try again.");
  }
}

/** Collects Zod issues into the per-field map the forms render. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !fields[key]) fields[key] = issue.message;
  }
  return fields;
}

/**
 * Maps a Postgres error to a result the visitor can act on.
 *
 * 23505 is unique_violation — in this schema that is always a duplicate slug,
 * and "that web address is already taken" is something the owner can fix,
 * unlike a generic failure message.
 */
export function dbError(error: {
  code?: string;
  message: string;
}): ReturnType<typeof err> {
  if (error.code === "23505") {
    return err(
      "CONFLICT",
      "That slug is already used by another item. Pick a different one.",
      { slug: "Already in use." },
    );
  }

  /* 42501 is insufficient_privilege: RLS refused. That means layer 1 let
     something through that layer 2 caught, which is a bug worth seeing in the
     logs even though the visitor gets a neutral message. */
  if (error.code === "42501") {
    console.error("RLS refused an admin write — check the policy", error);
    return err("FORBIDDEN", "You do not have permission to do that.");
  }

  console.error("database error", error);
  return err("SERVER_ERROR", "Something went wrong. Please try again.");
}

export { ok, err };
