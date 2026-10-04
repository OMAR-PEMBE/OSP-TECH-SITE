import { Section } from "@/components/ui/section";
import { ButtonLink } from "@/components/ui/button";
import { WhatsAppLink } from "@/components/public/whatsapp-link";

/**
 * The navy CTA band (prd.md 5.2, UI-UX.md 6).
 *
 * One of the three navy surfaces on the site — hero, this, footer — and the
 * last push toward a conversation before the contact form.
 *
 * No slash here: the hero already has one and the footer has the other, and
 * the brand rule is one per layout. Depth comes from the gradient alone.
 */
export function CtaBand({ whatsappHref }: { whatsappHref: string | null }) {
  return (
    <Section ground="navy" className="py-20 sm:py-24">
      <div className="hero-glow absolute inset-0 -z-10" aria-hidden="true" />

      <div className="relative mx-auto max-w-[44rem] text-center">
        <h2 className="text-display-l font-display text-balance text-white italic">
          Let&rsquo;s talk about your business.
        </h2>
        <p className="text-body-lg text-cloud mt-4">
          Tell us what you are trying to fix. We will tell you honestly whether
          we can help, what it takes, and what it costs.
        </p>

        <div className="mt-9 flex flex-wrap justify-center gap-4">
          {whatsappHref && (
            <WhatsAppLink
              href={whatsappHref}
              item="cta-band"
              className="bg-whatsapp text-navy rounded-card text-body shadow-soft min-h-[48px] px-6 font-semibold transition-transform hover:-translate-y-0.5 motion-reduce:hover:translate-y-0"
            >
              Chat With Us
            </WhatsAppLink>
          )}
          <ButtonLink href="#contact" variant="on-navy">
            Send a message
          </ButtonLink>
        </div>
      </div>
    </Section>
  );
}
