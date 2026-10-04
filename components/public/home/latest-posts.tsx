import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Section } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/public/section-heading";
import { formatDate, toDateTimeAttr } from "@/lib/format";
import type { PostSummary } from "@/lib/db/queries";

/**
 * "Latest From OSP Tech" — the three most recent published posts
 * (prd.md 5.2 row 7).
 *
 * Content comes from the database, so publishing in Admin makes a post appear
 * here within the revalidation window with no deploy (FR-W1). Drafts cannot
 * reach this list: the query filters on status and RLS refuses them besides.
 *
 * Renders nothing at all when there are no published posts, rather than an
 * empty section with a heading — an empty "Latest" block reads as neglect.
 */
export function LatestPosts({ posts }: { posts: PostSummary[] }) {
  if (posts.length === 0) return null;

  return (
    <Section ground="cloud" className="py-20 sm:py-28">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <SectionHeading
          label="From the blog"
          title="Latest from OSP Tech."
          lead="Practical notes on running a business on better systems."
        />
        <Link
          href="/blog"
          className="text-small rounded-input text-blue-strong inline-flex items-center gap-1 font-semibold underline-offset-4 hover:underline"
        >
          View all posts
          <ArrowRight aria-hidden className="size-4" />
        </Link>
      </div>

      <ul className="mt-12 grid gap-6 md:grid-cols-3">
        {posts.map((post, i) => (
          <li key={post.id}>
            <Reveal delay={i * 0.08} className="h-full">
              <article className="border-border rounded-card hover:shadow-soft relative flex h-full flex-col border bg-white p-6 transition-[transform,box-shadow] duration-200 hover:-translate-y-1 motion-reduce:hover:translate-y-0">
                <time
                  dateTime={toDateTimeAttr(post.publishedAt)}
                  className="text-label text-slate uppercase"
                >
                  {formatDate(post.publishedAt)}
                </time>

                <h3 className="text-h3 text-navy mt-3 font-semibold">
                  {/* The whole card is the target via this stretched link, so
                      there is still exactly one link for a screen reader. */}
                  <Link
                    href={`/blog/${post.slug}`}
                    className="rounded-input after:absolute after:inset-0"
                  >
                    {post.title}
                  </Link>
                </h3>

                {post.summary && (
                  <p className="text-small text-slate mt-2 flex-1">
                    {post.summary}
                  </p>
                )}
              </article>
            </Reveal>
          </li>
        ))}
      </ul>
    </Section>
  );
}
