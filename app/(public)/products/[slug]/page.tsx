import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { Section } from "@/components/ui/section";
import { Slash } from "@/components/ui/slash";
import { WhatsAppLink } from "@/components/public/whatsapp-link";
import { CtaBand } from "@/components/public/home/cta-band";
import {
  getAllPublicSlugs,
  getProductBySlug,
  getPublicSettings,
} from "@/lib/db/queries";
import { buildWhatsAppLink } from "@/lib/whatsapp/build-link";
import { absoluteUrl } from "@/lib/site";

/**
 * /products/[slug] — one ready-made system in full (FR-W8).
 *
 * Statically generated for every visible product and revalidated hourly, so
 * the page is CDN HTML. A product made visible later is not in
 * `generateStaticParams`, so it renders on first request and is cached from
 * then on — which is why `dynamicParams` stays at its default of true.
 */
export const revalidate = 3600;

export async function generateStaticParams() {
  const { products } = await getAllPublicSlugs();
  return products.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Not found" };

  return {
    title: product.name,
    description: product.description ?? undefined,
    alternates: { canonical: absoluteUrl(`/products/${product.slug}`) },
    openGraph: {
      title: `${product.name} · OSP Tech`,
      description: product.description ?? undefined,
      url: absoluteUrl(`/products/${product.slug}`),
    },
  };
}

const BADGE_LABEL: Record<string, string> = {
  coming_soon: "Coming soon",
  new: "New",
  popular: "Popular",
};

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [product, settings] = await Promise.all([
    getProductBySlug(slug),
    getPublicSettings(),
  ]);

  /* A hidden product and a nonexistent one both land here, because RLS
     filtered the row out before the query returned. That is intended: a
     guessed slug must not confirm that something unreleased exists. */
  if (!product) notFound();

  const waHref = settings?.whatsappNumber
    ? buildWhatsAppLink({
        number: settings.whatsappNumber,
        message: product.whatsappMessage ?? settings.defaultWhatsappGreeting,
      })
    : null;

  const defaultWaHref = settings?.whatsappNumber
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
          <Link
            href="/#products"
            className="text-small rounded-input text-teal inline-flex items-center gap-1.5 font-semibold"
          >
            <ArrowLeft aria-hidden className="size-4" />
            All systems
          </Link>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <h1 className="text-display-l font-display text-balance text-white italic">
              {product.name}
            </h1>
            {product.badge !== "none" && (
              <span className="rounded-pill text-label bg-teal/20 text-teal px-3 py-1 uppercase">
                {BADGE_LABEL[product.badge] ?? product.badge}
              </span>
            )}
          </div>

          {product.description && (
            <p className="text-body-lg text-cloud mt-4">
              {product.description}
            </p>
          )}

          {waHref && (
            <WhatsAppLink
              href={waHref}
              item={product.slug}
              className="bg-whatsapp text-navy rounded-card shadow-soft mt-8 min-h-[48px] px-6 font-semibold transition-transform hover:-translate-y-0.5 motion-reduce:hover:translate-y-0"
            >
              Ask about {product.name}
            </WhatsAppLink>
          )}
        </div>
      </Section>

      <Section ground="white" className="py-20 sm:py-24">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <h2 className="text-h2 text-navy font-bold">What you get</h2>
            {product.features.length > 0 ? (
              <ul className="mt-6 flex flex-col gap-3">
                {product.features.map((feature) => (
                  <li
                    key={feature}
                    className="text-body text-navy flex items-start gap-3"
                  >
                    <Check
                      aria-hidden
                      className="text-teal mt-1 size-5 shrink-0"
                    />
                    {feature}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-body text-slate mt-4">
                Full feature list on request — ask us on WhatsApp.
              </p>
            )}
          </div>

          <aside className="border-border rounded-card bg-cloud h-fit border p-6">
            <h2 className="text-label text-slate uppercase">Pricing</h2>
            <p className="text-h3 text-blue-strong mt-2 font-bold">
              {product.pricingText ?? "On request"}
            </p>
            <p className="text-small text-slate mt-4">
              Setup, training and support are included. We agree everything
              before any work starts.
            </p>
          </aside>
        </div>
      </Section>

      <CtaBand whatsappHref={defaultWaHref} />
    </>
  );
}
