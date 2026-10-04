import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Section } from "@/components/ui/section";
import { Slash } from "@/components/ui/slash";
import { getPublishedPostsPage } from "@/lib/db/queries";
import { formatDate, toDateTimeAttr } from "@/lib/format";
import { absoluteUrl } from "@/lib/site";

/**
 * /blog — published posts, paginated (FR-W7).
 *
 * Only `published` rows appear: the query filters on status and RLS refuses
 * drafts to the anon role regardless, so a draft cannot leak even if this
 * filter were removed.
 */
export const revalidate = 3600;

const PAGE_SIZE = 9;

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Practical notes on running a Tanzanian business on better systems — from OSP Tech.",
  alternates: { canonical: absoluteUrl("/blog") },
};

export default async function BlogIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;

  /* Anything that is not a positive integer is page 1, rather than NaN
     flowing into the range query. */
  const parsed = Number(pageParam ?? "1");
  const page = Number.isInteger(parsed) && parsed > 0 ? parsed : 1;

  const { posts, total } = await getPublishedPostsPage({
    page,
    pageSize: PAGE_SIZE,
  });

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  /* Page 5 of a 2-page blog is a 404, not an empty list — an empty page that
     returns 200 is a soft 404 and search engines treat it as a quality
     problem. Page 1 is always valid, even with no posts yet. */
  if (page > totalPages && page !== 1) notFound();

  return (
    <>
      <Section ground="navy" className="pt-32 pb-20 sm:pt-40 sm:pb-24">
        <Slash
          className="absolute -right-[8%] -bottom-[20%] h-[60%] w-[30%] opacity-40"
          flip
        />
        <div className="relative max-w-[44rem]">
          <p className="text-label text-teal uppercase">From the blog</p>
          <h1 className="text-display-l font-display mt-3 text-balance text-white italic">
            Latest from OSP Tech.
          </h1>
          <p className="text-body-lg text-cloud mt-4">
            Practical notes on running a business on better systems.
          </p>
        </div>
      </Section>

      <Section ground="white" className="py-20 sm:py-24">
        {posts.length === 0 ? (
          <p className="text-body-lg text-slate">
            No posts yet — the first one is on its way.
          </p>
        ) : (
          <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <li key={post.id}>
                <article className="border-border rounded-card hover:shadow-soft relative flex h-full flex-col border bg-white p-6 transition-[transform,box-shadow] duration-200 hover:-translate-y-1 motion-reduce:hover:translate-y-0">
                  <time
                    dateTime={toDateTimeAttr(post.publishedAt)}
                    className="text-label text-slate uppercase"
                  >
                    {formatDate(post.publishedAt)}
                  </time>
                  <h2 className="text-h3 text-navy mt-3 font-semibold">
                    <Link
                      href={`/blog/${post.slug}`}
                      className="rounded-input after:absolute after:inset-0"
                    >
                      {post.title}
                    </Link>
                  </h2>
                  {post.summary && (
                    <p className="text-small text-slate mt-2 flex-1">
                      {post.summary}
                    </p>
                  )}
                </article>
              </li>
            ))}
          </ul>
        )}

        {totalPages > 1 && (
          <nav
            aria-label="Blog pagination"
            className="border-border mt-12 flex items-center justify-between border-t pt-6"
          >
            {page > 1 ? (
              <Link
                href={page === 2 ? "/blog" : `/blog?page=${page - 1}`}
                rel="prev"
                className="text-small rounded-input text-blue-strong font-semibold underline-offset-4 hover:underline"
              >
                ← Newer posts
              </Link>
            ) : (
              <span />
            )}

            <p className="text-small text-slate" aria-current="page">
              Page {page} of {totalPages}
            </p>

            {page < totalPages ? (
              <Link
                href={`/blog?page=${page + 1}`}
                rel="next"
                className="text-small rounded-input text-blue-strong font-semibold underline-offset-4 hover:underline"
              >
                Older posts →
              </Link>
            ) : (
              <span />
            )}
          </nav>
        )}
      </Section>
    </>
  );
}
