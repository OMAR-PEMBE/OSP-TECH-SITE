import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { Section } from "@/components/ui/section";
import { Slash } from "@/components/ui/slash";
import { CtaBand } from "@/components/public/home/cta-band";
import {
  getAllPublicSlugs,
  getPortfolioBySlug,
  getPublicSettings,
} from "@/lib/db/queries";
import { buildWhatsAppLink } from "@/lib/whatsapp/build-link";
import { absoluteUrl } from "@/lib/site";

/** /portfolio/[slug] — one case study (FR-W8). */
export const revalidate = 3600;

export async function generateStaticParams() {
  const { portfolio } = await getAllPublicSlugs();
  return portfolio.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const item = await getPortfolioBySlug(slug);
  if (!item) return { title: "Not found" };

  return {
    title: item.title,
    description: item.description ?? undefined,
    alternates: { canonical: absoluteUrl(`/portfolio/${item.slug}`) },
    openGraph: {
      title: `${item.title} · OSP Tech`,
      description: item.description ?? undefined,
      url: absoluteUrl(`/portfolio/${item.slug}`),
    },
  };
}

export default async function PortfolioItemPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [item, settings] = await Promise.all([
    getPortfolioBySlug(slug),
    getPublicSettings(),
  ]);

  if (!item) notFound();

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
          <Link
            href="/#portfolio"
            className="text-small rounded-input text-teal inline-flex items-center gap-1.5 font-semibold"
          >
            <ArrowLeft aria-hidden className="size-4" />
            All work
          </Link>

          {item.type && (
            <p className="text-label text-teal mt-5 uppercase">{item.type}</p>
          )}
          <h1 className="text-display-l font-display mt-2 text-balance text-white italic">
            {item.title}
          </h1>
          {item.description && (
            <p className="text-body-lg text-cloud mt-4">{item.description}</p>
          )}

          {item.liveUrl && (
            <a
              href={item.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-card text-body mt-8 inline-flex min-h-[48px] items-center gap-2 border-2 border-white px-6 font-semibold text-white"
            >
              Visit the site
              <ArrowUpRight aria-hidden className="size-4" />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          )}
        </div>
      </Section>

      <Section ground="white" className="py-20 sm:py-24">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr]">
          <div className="max-w-[42rem]">
            <h2 className="text-h2 text-navy font-bold">About this project</h2>
            <p className="text-body text-slate mt-4 leading-relaxed">
              {item.description ??
                "A full write-up of this project is on the way."}
            </p>
          </div>

          {item.technologies.length > 0 && (
            <aside className="h-fit">
              <h2 className="text-label text-slate uppercase">Built with</h2>
              <ul className="mt-4 flex flex-wrap gap-2">
                {item.technologies.map((tech) => (
                  <li
                    key={tech}
                    className="rounded-pill bg-cloud text-navy text-small px-3 py-1.5"
                  >
                    {tech}
                  </li>
                ))}
              </ul>
            </aside>
          )}
        </div>
      </Section>

      <CtaBand whatsappHref={whatsappHref} />
    </>
  );
}
