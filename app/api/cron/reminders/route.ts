import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { formatDate } from "@/lib/format";
import { BRAND_HEX } from "@/lib/brand/tokens";

/**
 * POST /api/cron/reminders (API.md 5, FR-A11, implementation.md Phase 3.8).
 *
 * Finds reminders that are due, emails the owner, and marks them notified.
 *
 * This is the one place the service-role key is used. There is no user
 * session on a cron invocation, so RLS has no `auth.uid()` to evaluate and
 * the owner-only policies would return nothing — the job genuinely cannot do
 * its work as a user. Everything it touches is narrow and server-side.
 *
 * Because it bypasses RLS, authorisation here is the only wall, so the secret
 * is compared in constant time and the handler refuses before touching the
 * database.
 */

export const dynamic = "force-dynamic";

/** How far ahead to look. A reminder due within this window gets an email. */
const LOOKAHEAD_MINUTES = 60;

/**
 * Constant-time comparison.
 *
 * `===` on secrets leaks their length and prefix through timing. The
 * difference is small over a network, but this is free to do correctly.
 */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

function authorise(request: NextRequest): boolean {
  const expected = process.env.CRON_SECRET;

  /* No secret configured: refuse rather than run unauthenticated. A cron
     endpoint that is open because someone forgot an env var is worse than one
     that is broken, because nobody notices. */
  if (!expected) {
    console.error("CRON_SECRET is not set — refusing to run the reminder job.");
    return false;
  }

  const header = request.headers.get("x-cron-secret");
  if (header && safeEqual(header, expected)) return true;

  /* Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`. */
  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    return safeEqual(auth.slice(7), expected);
  }

  return false;
}

export async function POST(request: NextRequest) {
  if (!authorise(request)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const supabase = createServiceClient();
  const now = new Date();
  const until = new Date(now.getTime() + LOOKAHEAD_MINUTES * 60 * 1000);

  const { data: due, error } = await supabase
    .from("reminders")
    .select("id, title, description, due_at")
    .eq("done", false)
    .eq("notify_email", true)
    /* Not already emailed. This, plus stamping notified_at below, is what
       stops a reminder being sent every time the job runs. */
    .is("notified_at", null)
    .lte("due_at", until.toISOString());

  if (error) {
    console.error("cron/reminders query failed", error);
    return NextResponse.json(
      { ok: false, error: "query_failed" },
      { status: 500 },
    );
  }

  const reminders = due ?? [];
  if (reminders.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, skipped: 0 });
  }

  const { data: owner } = await supabase
    .from("profiles")
    .select("email, full_name")
    .eq("role", "owner")
    .limit(1)
    .maybeSingle();

  let sent = 0;
  let skipped = 0;

  if (owner?.email) {
    const delivered = await sendReminderEmail(owner.email, reminders);
    if (delivered) {
      sent = reminders.length;
      /* Only stamp when the email actually went. If delivery failed, leaving
         notified_at null means the next run retries, which is the behaviour
         you want from a reminder. */
      await supabase
        .from("reminders")
        .update({ notified_at: now.toISOString() })
        .in(
          "id",
          reminders.map((r) => r.id),
        );
    } else {
      skipped = reminders.length;
    }
  } else {
    skipped = reminders.length;
    console.warn("cron/reminders: no owner email on file, nothing sent.");
  }

  return NextResponse.json({ ok: true, sent, skipped });
}

/**
 * Sends the digest through Resend.
 *
 * Returns false rather than throwing when the key is missing, so a project
 * without email configured still runs the job (and retries later) instead of
 * failing the whole invocation.
 */
async function sendReminderEmail(
  to: string,
  reminders: { title: string; description: string | null; due_at: string }[],
): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM ?? "OSP Tech <onboarding@resend.dev>";

  if (!apiKey) {
    console.warn(
      `RESEND_API_KEY not set — would have emailed ${reminders.length} reminder(s) to ${to}.`,
    );
    return false;
  }

  const esc = (v: string) =>
    v.replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c] ?? c,
    );

  const items = reminders
    .map(
      (r) =>
        `<li style="margin-bottom:12px"><strong>${esc(r.title)}</strong><br>
         <span style="color:${BRAND_HEX.slate}">Due ${esc(formatDate(r.due_at))}</span>
         ${r.description ? `<br>${esc(r.description)}` : ""}</li>`,
    )
    .join("");

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        subject:
          reminders.length === 1
            ? `Reminder: ${reminders[0].title}`
            : `${reminders.length} reminders due`,
        html: `<div style="font-family:Arial,sans-serif;color:${BRAND_HEX.navy}">
            <h2 style="color:${BRAND_HEX.blueStrong}">OSP Tech reminders</h2>
            <ul style="padding-left:18px">${items}</ul>
          </div>`,
      }),
    });

    if (!response.ok) {
      console.error("Resend rejected the reminder email", {
        status: response.status,
      });
      return false;
    }

    return true;
  } catch (cause) {
    console.error("Failed to send reminder email", cause);
    return false;
  }
}
