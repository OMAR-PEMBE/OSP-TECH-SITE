import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Section } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/public/section-heading";
import { ServiceIcon } from "@/components/public/service-icon";
import { WhatsAppLink } from "@/components/public/whatsapp-link";
import { buildWhatsAppLink } from "@/lib/whatsapp/build-link";
import type { PublicSettings, Service } from "@/lib/db/queries";

/**
 * "What We Do" — four service cards (prd.md 5.2 row 3).
 *
 * Each card carries its own WhatsApp message, so a tap opens a chat that
 * already says which service it is about (FR-W3). That is the whole point of
 * the section: one tap from interest to conversation.
 *
 * Cards rise in on scroll with a stagger, and gain a teal top line on hover
 * (UI-UX.md 7).
 */
export function ServicesSection({
  services,
  settings,
}: {
  services: Service[];
  settings: PublicSettings | null;
}) {
  if (services.length === 0) return null;

  return (
    <Section ground="white" className="py-20 sm:py-28">
      <SectionHeading
        label="What we do"
        title="Services built around how you work."
        lead="Not templates. Systems, sites and automation shaped to your business."
      />

      <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {services.map((service, i) => {
          const waHref = settings?.whatsappNumber
            ? buildWhatsAppLink({
                number: settings.whatsappNumber,
                message:
                  service.whatsappMessage ?? settings.defaultWhatsappGreeting,
              })
            : null;

          return (
            <li key={service.id}>
              <Reveal delay={i * 0.08} className="h-full">
                <article className="border-border rounded-card group hover:shadow-soft relative flex h-full flex-col border bg-white p-6 transition-[transform,box-shadow] duration-200 hover:-translate-y-1 motion-reduce:hover:translate-y-0">
                  {/* Teal top line on hover — the accent, kept to 10%. */}
                  <span
                    aria-hidden="true"
                    className="rounded-card bg-teal absolute inset-x-6 top-0 h-0.5 origin-left scale-x-0 transition-transform duration-200 group-focus-within:scale-x-100 group-hover:scale-x-100"
                  />

                  <span className="from-blue to-teal rounded-input flex size-12 items-center justify-center bg-linear-to-br text-white">
                    <ServiceIcon name={service.icon} className="size-6" />
                  </span>

                  <h3 className="text-h3 text-navy mt-5 font-semibold">
                    {service.name}
                  </h3>
                  {service.shortDesc && (
                    <p className="text-small text-slate mt-2 flex-1">
                      {service.shortDesc}
                    </p>
                  )}

                  <div className="mt-5 flex items-center justify-between gap-3">
                    <Link
                      href={`/services#${service.slug}`}
                      className="text-small rounded-input text-blue-strong inline-flex items-center gap-1 font-semibold underline-offset-4 hover:underline"
                    >
                      Learn more
                      <ArrowRight aria-hidden className="size-4" />
                      <span className="sr-only">about {service.name}</span>
                    </Link>

                    {waHref && (
                      <WhatsAppLink
                        href={waHref}
                        item={service.slug}
                        aria-label={`Ask about ${service.name} on WhatsApp`}
                        className="text-whatsapp rounded-input hover:text-navy transition-colors"
                      />
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
