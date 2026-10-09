"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { contactSchema } from "@/lib/validation/contact";
import { CONTACT_RULES, checkRateLimit } from "@/lib/rate-limit";
import { getRequestIp } from "@/lib/request-ip";
import { recordEvent } from "@/lib/analytics/record-event";
import { type ActionResult, err, ok } from "@/lib/types/action";

/**
 * submitContactMessage (API.md 3.1, workflows.md B2).
 *
 * The client validates with the same Zod schema for fast inline errors, and
 * this re-validates because the client is not trustworthy — a form post can be
 * replayed with anything in it (agents.md 2.3).
 *
 * Three spam defences, per security.md 5:
 *   1. honeypot — a field no human can see, so anything in it is a bot;
 *   2. minimum submit time — a human cannot read and fill this in under three
 *      seconds, a script fills it instantly;
 *   3. per-IP rate limit.
 *
 * Both spam rejections return the ordinary success shape. Telling a bot which
 * check caught it is free information for whoever is tuning the script, and a
 * real visitor can never trip them.
 */

/** A human has not read and answered the form in under this long. */
const MIN_SUBMIT_MS = 3_000;

/** What the form posts, before the shared schema parses the visitor's fields. */
const formSchema = contactSchema.extend({
  /** Epoch ms stamped into the form when it rendered. */
  renderedAt: z.coerce.number().int().positive().optional(),
});

export type ContactResult = ActionResult<{ id: string | null }>;

export async function submitContactMessage(
  formData: FormData,
): Promise<ContactResult> {
  try {
    const parsed = formSchema.safeParse({
      name: formData.get("name") ?? "",
      phone: formData.get("phone") ?? "",
      need: formData.get("need") ?? "",
      message: formData.get("message") ?? "",
      sourcePage: formData.get("sourcePage") ?? "",
      website: formData.get("website") ?? "",
      renderedAt: formData.get("renderedAt") ?? undefined,
    });

    if (!parsed.success) {
      const fields: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        /* First message per field: showing one clear thing to fix beats a
           stack of messages on the same input. */
        if (typeof key === "string" && !fields[key]) {
          fields[key] = issue.message;
        }
      }

      /* The honeypot lives in the same schema, so a bot that fills it lands
         here. Answer as though it worked. */
      if (fields.website) return ok({ id: null });

      return err("VALIDATION", "Please check the highlighted fields.", fields);
    }

    const values = parsed.data;

    /* Filled impossibly fast — a script, not a person. */
    if (values.renderedAt && Date.now() - values.renderedAt < MIN_SUBMIT_MS) {
      return ok({ id: null });
    }

    const ip = await getRequestIp();
    const { allowed } = await checkRateLimit(`contact:${ip}`, CONTACT_RULES);
    if (!allowed) {
      return err(
        "RATE_LIMITED",
        "You have sent several messages already. Please try again a little later, or chat with us on WhatsApp.",
      );
    }

    const supabase = await createClient();

    /* No `.select()` on purpose. The anon role is granted INSERT on messages
       and nothing else, so asking for the row back would make PostgREST issue
       `INSERT ... RETURNING`, which Postgres refuses for lack of SELECT — and
       that refusal fails the whole statement, rolling the message back. The
       visitor would see an error for a message that was never written.
       Nothing needs the id, so nothing is selected, and the query matches
       exactly what the policy allows. */
    const { error } = await supabase.from("messages").insert({
      name: values.name,
      phone: values.phone ?? null,
      need: values.need ?? null,
      message: values.message,
      source_page: values.sourcePage ?? null,
    });

    if (error) {
      console.error("submitContactMessage insert failed", {
        code: error.code,
        message: error.message,
      });
      return err(
        "SERVER_ERROR",
        "Something went wrong sending your message. Please try again, or chat with us on WhatsApp.",
      );
    }

    await recordEvent({
      type: "contact_submit",
      page: values.sourcePage ?? "/",
    });

    /* No id to return: the insert deliberately selects nothing back. */
    return ok({ id: null });
  } catch (cause) {
    /* Never leak internals to the visitor (security.md 13). */
    console.error("submitContactMessage failed", cause);
    return err(
      "SERVER_ERROR",
      "Something went wrong sending your message. Please try again, or chat with us on WhatsApp.",
    );
  }
}
