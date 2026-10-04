import { Hero } from "@/components/public/hero/hero";
import { TrustStrip } from "@/components/public/home/trust-strip";
import { ServicesSection } from "@/components/public/home/services-section";
import { ProductsSection } from "@/components/public/home/products-section";
import { HowWeWork } from "@/components/public/home/how-we-work";
import { PortfolioSection } from "@/components/public/home/portfolio-section";
import { LatestPosts } from "@/components/public/home/latest-posts";
import { CtaBand } from "@/components/public/home/cta-band";
import { ContactSection } from "@/components/public/home/contact-section";
import {
  getPublicSettings,
  getPublishedPosts,
  getVisiblePortfolio,
  getVisibleProducts,
  getVisibleServices,
} from "@/lib/db/queries";
import { buildWhatsAppLink } from "@/lib/whatsapp/build-link";

/**
 * Home (prd.md 5.2).
 *
 * Sections in the order the document specifies: hero, trust strip, services,
 * products, how we work, portfolio, latest posts, CTA band, contact.
 *
 * Statically rendered and revalidated hourly (architecture.md 5.2), so the CDN
 * serves this page as HTML with no database round trip on a visitor's request
 * — which is most of why it is fast on a Morogoro mobile connection.
 */
export const revalidate = 3600;

export default async function HomePage() {
  /* One round of parallel reads. Sequential awaits here would stack five
     round trips onto every regeneration for no reason — nothing below
     depends on anything above it. */
  const [settings, services, products, portfolio, posts] = await Promise.all([
    getPublicSettings(),
    getVisibleServices(),
    getVisibleProducts(),
    getVisiblePortfolio(),
    getPublishedPosts({ limit: 3 }),
  ]);

  const whatsappHref = settings?.whatsappNumber
    ? buildWhatsAppLink({
        number: settings.whatsappNumber,
        message: settings.defaultWhatsappGreeting,
      })
    : null;

  return (
    <>
      <Hero tagline={settings?.tagline} whatsappHref={whatsappHref} />
      <TrustStrip stats={settings?.trustStats ?? []} />
      <ServicesSection services={services} settings={settings} />
      <ProductsSection products={products} settings={settings} />
      <HowWeWork />
      <PortfolioSection items={portfolio} />
      <LatestPosts posts={posts} />
      <CtaBand whatsappHref={whatsappHref} />
      <ContactSection settings={settings} />
    </>
  );
}
