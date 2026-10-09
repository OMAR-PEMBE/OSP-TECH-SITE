"use server";

import { createClient } from "@/lib/supabase/server";
import { EVENT_RULES, checkRateLimit } from "@/lib/rate-limit";
import { getRequestIp } from "@/lib/request-ip";
import { type ActionResult, ok } from "@/lib/types/action";

/**
 * Records an analytics event (API.md 3.2).
 *
 * Fire-and-forget by contract: it must never block or fail a visitor's action.
 * A WhatsApp button calls it and navigates regardless, so every failure path
 * here — rate limited, bad input, database down — returns `ok` rather than an
 * error the UI would have to handle. The failure is swallowed deliberately,
 * not accidentally; losing an analytics row is worth strictly less than losing
 * the lead.
 *
 * The anon role may INSERT and may never SELECT, so a visitor cannot read the
 * event stream back (security.md 3).
 */

const EVENT_TYPES = ["page_view", "whatsapp_click", "contact_submit"] as const;
type EventType = (typeof EVENT_TYPES)[number];

export type RecordEventInput = {
  type: EventType;
  page: string;
  item?: string;
};

export async function recordEvent(
  input: RecordEventInput,
): Promise<ActionResult<null>> {
  try {
    if (!EVENT_TYPES.includes(input.type)) return ok(null);

    const ip = await getRequestIp();
    const { allowed } = await checkRateLimit(`event:${ip}`, EVENT_RULES);
    /* Over the limit: drop silently, exactly as API.md 3.2 specifies. */
    if (!allowed) return ok(null);

    const supabase = await createClient();
    await supabase.from("events").insert({
      type: input.type,
      page: input.page.slice(0, 200),
      item: input.item?.slice(0, 200) ?? null,
    });

    return ok(null);
  } catch {
    /* Analytics must never surface to the visitor. */
    return ok(null);
  }
}
