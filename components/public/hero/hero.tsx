import { ButtonLink } from "@/components/ui/button";
import { Section } from "@/components/ui/section";
import { WhatsAppGlyph } from "@/components/ui/whatsapp-glyph";
import { WhatsAppLink } from "@/components/public/whatsapp-link";
import { HeroBackdrop } from "@/components/public/hero/hero-backdrop";
import { HeroVisual } from "@/components/public/hero/hero-visual";

/**
 * The home hero (prd.md 5.2 row 1, UI-UX.md 4 and 8).
 *
 * A Server Component. The eyebrow, headline, sub-line and both buttons are in
 * the HTML the CDN serves, so the thing that matters -- the offer -- is
 * readable before a single byte of JavaScript runs. Everything visual sits
 * behind it at `-z-10`.
 *
 * No logo here by design: it is already in the header, and the brand rule is
 * that the hero's headline *is* the tagline, set in display italic to match
 * the wordmark (UI-UX.md 4).
 */

export function Hero({
  tagline,
  whatsappHref,
}: {
  /** From `settings.tagline`. Falls back to the brand tagline if unset. */
  tagline?: string;
  /** Null when no WhatsApp number is configured — the button is omitted. */
  whatsappHref: string | null;
}) {
  return (
    <Section
      ground="navy"
      /* hero-visual.tsx writes the chosen tier here; the CSS in globals.css
         reads it. "static" is the server default, so no-JS gets tier 1. */
      data-hero-root=""
      data-hero-tier="static"
      className="flex min-h-[88svh] items-center py-24 sm:py-32"
    >
      <HeroBackdrop />
      <HeroVisual />

      <div className="relative max-w-[42rem]">
        <p className="text-label text-teal uppercase">
          IT &amp; Systems Company · Tanzania
        </p>

        {/* The tagline, in display italic 800 -- one strong headline for the
            section, nothing stacked behind it (UI-UX.md 3.2). */}
        <h1 className="text-display-xl font-display mt-4 text-balance text-white italic">
          {tagline || "Turning Ideas Into Digital Solutions."}
        </h1>

        <p className="text-body-lg text-cloud mt-6 max-w-[38rem]">
          We build the business systems, websites and automation that Tanzanian
          businesses actually run on — and we are a WhatsApp message away.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <ButtonLink href="/services" variant="primary">
            Explore Our Services
          </ButtonLink>

          {whatsappHref && (
            <WhatsAppLink
              href={whatsappHref}
              item="hero"
              showGlyph={false}
              className="rounded-card text-body min-h-[48px] border-2 border-white px-6 font-semibold text-white transition-transform hover:-translate-y-0.5 motion-reduce:hover:translate-y-0"
            >
              <WhatsAppGlyph />
              Chat With Us
            </WhatsAppLink>
          )}
        </div>
      </div>
    </Section>
  );
}
