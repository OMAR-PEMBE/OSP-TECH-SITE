import type { Metadata } from "next";
import { Section } from "@/components/ui/section";
import { Slash } from "@/components/ui/slash";
import { ProductsSection } from "@/components/public/home/products-section";
import { CtaBand } from "@/components/public/home/cta-band";
import { getPublicSettings, getVisibleProducts } from "@/lib/db/queries";
import { buildWhatsAppLink } from "@/lib/whatsapp/build-link";
import { absoluteUrl } from "@/lib/site";

/**
 * /products — every ready-made system (prd.md 5.1 nav).
 *
 * The header nav links here, so this route has to exist even though the home
 * page already lists the products. It reuses the home section rather than a
 * second card design, so a product looks the same wherever it appears.
 */
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Products",
  description:
    "Ready-made systems from OSP Tech — already built, set up for your business and supported by us.",
  alternates: { canonical: absoluteUrl("/products") },
};

export default async function ProductsPage() {
  const [products, settings] = await Promise.all([
    getVisibleProducts(),
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
          <p className="text-label text-teal uppercase">Products</p>
          <h1 className="text-display-l font-display mt-3 text-balance text-white italic">
            Ready-made systems for Tanzanian businesses.
          </h1>
          <p className="text-body-lg text-cloud mt-4">
            Systems we have already built and run. We set them up for your
            business and support them after launch.
          </p>
        </div>
      </Section>

      {products.length > 0 ? (
        <ProductsSection products={products} settings={settings} />
      ) : (
        <Section ground="white" className="py-20 sm:py-24">
          <p className="text-body-lg text-slate max-w-[38rem]">
            New products are on the way. In the meantime, tell us what you need
            on WhatsApp and we will build it.
          </p>
        </Section>
      )}

      <CtaBand whatsappHref={whatsappHref} />
    </>
  );
}
