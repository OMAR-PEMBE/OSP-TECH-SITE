import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Section } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/public/section-heading";
import type { PortfolioItem } from "@/lib/db/queries";

/**
 * "Our Work" (prd.md 5.2 row 6).
 *
 * Screenshots arrive with Phase 2's Storage uploads; until a portfolio item
 * has an image, the card shows a branded placeholder built from the tokens
 * rather than an empty frame or a broken `<img>`. That keeps the section
 * honest — the work is real, the screenshot just is not uploaded yet.
 */
export function PortfolioSection({ items }: { items: PortfolioItem[] }) {
  if (items.length === 0) return null;

  return (
    <Section ground="white" className="py-20 sm:py-28">
      <SectionHeading
        label="Our work"
        title="Things we have already shipped."
        lead="Real systems, running for real businesses."
      />

      <ul className="mt-12 grid gap-6 sm:grid-cols-2">
        {items.map((item, i) => (
          <li key={item.id}>
            <Reveal delay={i * 0.1} className="h-full">
              <article className="group border-border rounded-card hover:shadow-soft h-full overflow-hidden border bg-white transition-[transform,box-shadow] duration-200 hover:-translate-y-1 motion-reduce:hover:translate-y-0">
                <div className="from-navy to-blue-strong relative aspect-[16/10] overflow-hidden bg-linear-to-br">
                  {/* Placeholder until Phase 2 uploads real screenshots. */}
                  <span className="text-display-l font-display absolute inset-0 flex items-center justify-center text-white/15 italic">
                    {item.title}
                  </span>
                </div>

                <div className="p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      {item.type && (
                        <p className="text-label text-blue-strong uppercase">
                          {item.type}
                        </p>
                      )}
                      <h3 className="text-h3 text-navy mt-1.5 font-semibold">
                        {item.title}
                      </h3>
                    </div>
                    {item.liveUrl && (
                      <a
                        href={item.liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-input text-blue-strong shrink-0"
                        aria-label={`Visit ${item.title} (opens in a new tab)`}
                      >
                        <ArrowUpRight aria-hidden className="size-5" />
                      </a>
                    )}
                  </div>

                  {item.description && (
                    <p className="text-small text-slate mt-2">
                      {item.description}
                    </p>
                  )}

                  {item.technologies.length > 0 && (
                    <ul className="mt-4 flex flex-wrap gap-2">
                      {item.technologies.map((tech) => (
                        <li
                          key={tech}
                          className="rounded-pill bg-cloud text-slate text-label px-3 py-1"
                        >
                          {tech}
                        </li>
                      ))}
                    </ul>
                  )}

                  <Link
                    href={`/portfolio/${item.slug}`}
                    className="text-small rounded-input text-blue-strong mt-5 inline-flex font-semibold underline-offset-4 hover:underline"
                  >
                    View case
                    <span className="sr-only"> study for {item.title}</span>
                  </Link>
                </div>
              </article>
            </Reveal>
          </li>
        ))}
      </ul>
    </Section>
  );
}
