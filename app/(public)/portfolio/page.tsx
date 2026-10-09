import type { Metadata } from "next";
import { Section } from "@/components/ui/section";
import { Slash } from "@/components/ui/slash";
import { PortfolioSection } from "@/components/public/home/portfolio-section";
import { CtaBand } from "@/components/public/home/cta-band";
import { getPublicSettings, getVisiblePortfolio } from "@/lib/db/queries";
import { buildWhatsAppLink } from "@/lib/whatsapp/build-link";
import { absoluteUrl } from "@/lib/site";

/**
 * /portfolio — all shipped work (prd.md 5.1 nav).
 *
 * The header nav links here. Reuses the home section's cards; each links on
 * to its `/portfolio/[slug]` case study.
 */
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Portfolio",
  description:
    "Systems and websites OSP Tech has built and shipped for real Tanzanian businesses.",
  alternates: { canonical: absoluteUrl("/portfolio") },
};

export default async function PortfolioPage() {
  const [items, settings] = await Promise.all([
    getVisiblePortfolio(),
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
          <p className="text-label text-teal uppercase">Portfolio</p>
          <h1 className="text-display-l font-display mt-3 text-balance text-white italic">
            Work we have shipped.
          </h1>
          <p className="text-body-lg text-cloud mt-4">
            Real systems, running for real businesses across Tanzania.
          </p>
        </div>
      </Section>

      {items.length > 0 ? (
        <PortfolioSection items={items} />
      ) : (
        <Section ground="white" className="py-20 sm:py-24">
          <p className="text-body-lg text-slate max-w-[38rem]">
            Case studies are being written up. Ask us on WhatsApp and we will
            walk you through what we have built.
          </p>
        </Section>
      )}

      <CtaBand whatsappHref={whatsappHref} />
    </>
  );
}
