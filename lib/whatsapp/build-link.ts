/**
 * wa.me deep links (architecture.md 11, workflows.md B1).
 *
 * The single place Phase 1 builds a WhatsApp URL. Phase 2 adds the Business
 * Cloud API client alongside it, so pages that import from here do not change
 * when the backend upgrades.
 */

/**
 * `wa.me` wants digits only: no `+`, no spaces, no dashes.
 *
 * Settings stores the number in E.164 (`+255747809299`) because that is the
 * portable form; this is the one place that difference is handled, so a stray
 * space typed into Admin cannot produce a dead link.
 */
export function toWaNumber(e164: string): string {
  return e164.replace(/\D/g, "");
}

export type WhatsAppLinkInput = {
  /** The business number, as stored in settings (E.164). */
  number: string;
  /** Pre-filled message. Falls back to the default greeting when absent. */
  message?: string | null;
};

/**
 * Builds `https://wa.me/<number>?text=<encoded message>`.
 *
 * Returns null when there is no number configured, so a caller renders
 * nothing rather than a link to `wa.me/` that opens an error page. Every
 * caller must handle that — which is the point of the null.
 */
export function buildWhatsAppLink({
  number,
  message,
}: WhatsAppLinkInput): string | null {
  const digits = toWaNumber(number ?? "");
  if (!digits) return null;

  const url = new URL(`https://wa.me/${digits}`);
  const text = message?.trim();
  if (text) {
    /* URL's searchParams encodes spaces as "+". WhatsApp reads the query
       literally, so a "+" would appear in the message the customer sees.
       encodeURIComponent gives %20 and is what wa.me expects. */
    url.search = `text=${encodeURIComponent(text)}`;
  }
  return url.toString();
}
