import type { Metadata } from "next";
import { Section } from "@/components/ui/section";
import { Slash } from "@/components/ui/slash";
import { ServiceIcon } from "@/components/public/service-icon";
import { WhatsAppLink } from "@/components/public/whatsapp-link";
import { CtaBand } from "@/components/public/home/cta-band";
import { getPublicSettings, getVisibleServices } from "@/lib/db/queries";
import { buildWhatsAppLink } from "@/lib/whatsapp/build-link";
import { absoluteUrl } from "@/lib/site";

/**
 * /services — every service in full (FR-W8).
 *
 * One page rather than a route per service: there are four of them and each
 * is a few paragraphs, so splitting them would cost a navigation for no
 * content. Each carries an `id` so the home cards' "Learn more" links land on
 * the right one.
 */
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Services",
  description:
    "Business systems, websites and e-commerce, automation and AI — built for Tanzanian businesses by OSP Tech.",
  alternates: { canonical: absoluteUrl("/services") },
};

export default async function ServicesPage() {
  const [services, settings] = await Promise.all([
    getVisibleServices(),
    getPublicSettings(),
  ]);

  const whatsappHref = settings?.whatsappNumber
    ? buildWhatsAppLink({
        number: settings.whatsappNumber,
        message: settings.defaultWhatsappGreeting,
      })
    : null;

  return (
    <>
      <Section ground="navy" className="pt-32 pb-20 sm:pt-40 sm:pb-24">
        <Slash
          className="absolute -right-[8%] -bottom-[20%] h-[60%] w-[30%] opacity-40"
          flip
        />
        <div className="relative max-w-[44rem]">
          <p className="text-label text-teal uppercase">What we do</p>
          <h1 className="text-display-l font-display mt-3 text-balance text-white italic">
            Services built around how you work.
          </h1>
          <p className="text-body-lg text-cloud mt-4">
            Four things we do well. Each one starts with a conversation about
            what your business actually needs.
          </p>
        </div>
      </Section>

      <Section ground="white" className="py-20 sm:py-24">
        <div className="flex flex-col gap-16">
          {services.map((service) => {
            const waHref = settings?.whatsappNumber
              ? buildWhatsAppLink({
                  number: settings.whatsappNumber,
                  message:
                    service.whatsappMessage ?? settings.defaultWhatsappGreeting,
                })
              : null;

            return (
              <article
                key={service.id}
                id={service.slug}
                className="border-border grid scroll-mt-28 gap-6 border-t pt-10 md:grid-cols-[auto_1fr] md:gap-10"
              >
                <span className="from-blue to-teal rounded-card flex size-14 shrink-0 items-center justify-center bg-linear-to-br text-white">
                  <ServiceIcon name={service.icon} className="size-7" />
                </span>

                <div className="max-w-[42rem]">
                  <h2 className="text-h1 text-navy font-bold">
                    {service.name}
                  </h2>
                  {service.shortDesc && (
                    <p className="text-body-lg text-blue-strong mt-2 font-semibold">
                      {service.shortDesc}
                    </p>
                  )}
                  {service.fullDesc && (
                    <p className="text-body text-slate mt-4 leading-relaxed">
                      {service.fullDesc}
                    </p>
                  )}

                  {waHref && (
                    <WhatsAppLink
                      href={waHref}
                      item={service.slug}
                      className="bg-whatsapp text-navy rounded-card shadow-soft mt-6 min-h-[48px] px-6 font-semibold transition-transform hover:-translate-y-0.5 motion-reduce:hover:translate-y-0"
                    >
                      Ask about {service.name}
                    </WhatsAppLink>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </Section>

      <CtaBand whatsappHref={whatsappHref} />
    </>
  );
}
