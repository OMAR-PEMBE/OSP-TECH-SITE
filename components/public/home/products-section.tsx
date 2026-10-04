import Link from "next/link";
import { Check } from "lucide-react";
import { Section } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/public/section-heading";
import { WhatsAppLink } from "@/components/public/whatsapp-link";
import { buildWhatsAppLink } from "@/lib/whatsapp/build-link";
import { cn } from "@/lib/utils/cn";
import type { Product, PublicSettings } from "@/lib/db/queries";

/**
 * "Ready-Made Systems" (prd.md 5.2 row 4).
 *
 * Products OSP already has, as opposed to the bespoke work in Services. The
 * badge carries the state — "Coming soon" on the rental system — so a visitor
 * is never misled into asking for something that is not ready, and the
 * WhatsApp message for that product says so too.
 */

const BADGE_LABEL: Record<string, string> = {
  coming_soon: "Coming soon",
  new: "New",
  popular: "Popular",
};

function Badge({ badge }: { badge: Product["badge"] }) {
  if (badge === "none") return null;

  return (
    <span
      className={cn(
        "rounded-pill text-label inline-flex items-center px-3 py-1 uppercase",
        /* "Popular" earns the brand accent; "coming soon" stays neutral so it
           reads as a status, not a promotion. */
        badge === "popular"
          ? "bg-teal/15 text-blue-strong"
          : "bg-cloud text-slate",
      )}
    >
      {BADGE_LABEL[badge] ?? badge}
    </span>
  );
}

export function ProductsSection({
  products,
  settings,
}: {
  products: Product[];
  settings: PublicSettings | null;
}) {
  if (products.length === 0) return null;

  return (
    <Section ground="cloud" className="py-20 sm:py-28">
      <SectionHeading
        label="Ready-made systems"
        title="Systems you can run from next week."
        lead="Already built, already working. Set up for your business and supported by us."
      />

      <ul className="mt-12 grid gap-6 lg:grid-cols-2">
        {products.map((product, i) => {
          const waHref = settings?.whatsappNumber
            ? buildWhatsAppLink({
                number: settings.whatsappNumber,
                message:
                  product.whatsappMessage ?? settings.defaultWhatsappGreeting,
              })
            : null;

          return (
            <li key={product.id}>
              <Reveal delay={i * 0.1} className="h-full">
                <article className="border-border rounded-card flex h-full flex-col border bg-white p-6 sm:p-8">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-h2 text-navy font-bold">
                      {product.name}
                    </h3>
                    <Badge badge={product.badge} />
                  </div>

                  {product.description && (
                    <p className="text-body text-slate mt-3">
                      {product.description}
                    </p>
                  )}

                  {product.features.length > 0 && (
                    <ul className="mt-5 flex flex-col gap-2">
                      {product.features.map((feature) => (
                        <li
                          key={feature}
                          className="text-small text-navy flex items-start gap-2"
                        >
                          <Check
                            aria-hidden
                            className="text-teal mt-0.5 size-4 shrink-0"
                          />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  )}

                  {product.pricingText && (
                    <p className="text-small text-blue-strong mt-5 font-semibold">
                      {product.pricingText}
                    </p>
                  )}

                  <div className="mt-auto flex flex-wrap items-center gap-3 pt-6">
                    <Link
                      href={`/products/${product.slug}`}
                      className="rounded-card border-navy text-blue-strong text-small inline-flex min-h-[44px] items-center border-2 px-5 font-semibold"
                    >
                      View details
                      <span className="sr-only"> of {product.name}</span>
                    </Link>

                    {waHref && (
                      <WhatsAppLink
                        href={waHref}
                        item={product.slug}
                        className="bg-whatsapp text-navy rounded-card text-small shadow-soft min-h-[44px] px-5 font-semibold transition-transform hover:-translate-y-0.5 motion-reduce:hover:translate-y-0"
                      >
                        Ask on WhatsApp
                        <span className="sr-only"> about {product.name}</span>
                      </WhatsAppLink>
                    )}
                  </div>
                </article>
              </Reveal>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
