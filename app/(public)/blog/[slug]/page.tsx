import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Section } from "@/components/ui/section";
import { Slash } from "@/components/ui/slash";
import { RichText } from "@/components/public/rich-text";
import { CtaBand } from "@/components/public/home/cta-band";
import {
  getAllPublicSlugs,
  getPostBySlug,
  getPublicSettings,
} from "@/lib/db/queries";
import { buildWhatsAppLink } from "@/lib/whatsapp/build-link";
import { formatDate, toDateTimeAttr } from "@/lib/format";
import { SITE_NAME, absoluteUrl } from "@/lib/site";

/** /blog/[slug] — one post, rendered from Tiptap JSON (FR-W7). */
export const revalidate = 3600;

export async function generateStaticParams() {
  const { posts } = await getAllPublicSlugs();
  return posts.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "Not found" };

  const description = post.metaDescription ?? post.summary ?? undefined;

  return {
    title: post.metaTitle ?? post.title,
    description,
    alternates: { canonical: absoluteUrl(`/blog/${post.slug}`) },
    openGraph: {
      type: "article",
      title: post.metaTitle ?? post.title,
      description,
      url: absoluteUrl(`/blog/${post.slug}`),
      publishedTime: post.publishedAt,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [post, settings] = await Promise.all([
    getPostBySlug(slug),
    getPublicSettings(),
  ]);

  /* A draft reaches here as null, because RLS refused it — so an unpublished
     post 404s rather than being readable by anyone who guesses the slug. */
  if (!post) notFound();

  const whatsappHref = settings?.whatsappNumber
    ? buildWhatsAppLink({
        number: settings.whatsappNumber,
        message: settings.defaultWhatsappGreeting,
      })
    : null;

  /* Article structured data (architecture.md 12). Serialised from values we
     control; React escapes `<` in a script tag's JSON by itself here because
     the payload has no user-supplied HTML. */
  const articleLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    datePublished: post.publishedAt,
    description: post.metaDescription ?? post.summary ?? undefined,
    url: absoluteUrl(`/blog/${post.slug}`),
    publisher: { "@type": "Organization", name: SITE_NAME },
  };

  return (
    <>
      <script
        type="application/ld+json"
        /* JSON-LD must be a raw script body; there is no React API for it.
           The payload is built from our own columns and every "<" is escaped,
           so a value containing "</script>" cannot break out of the tag. */
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(articleLd).replace(/</g, "\\u003c"),
        }}
      />

      <Section ground="navy" className="pt-32 pb-16 sm:pt-40 sm:pb-20">
        <Slash
          className="absolute -right-[8%] -bottom-[20%] h-[60%] w-[30%] opacity-40"
          flip
        />
        <div className="relative max-w-[44rem]">
          <Link
            href="/blog"
            className="text-small rounded-input text-teal inline-flex items-center gap-1.5 font-semibold"
          >
            <ArrowLeft aria-hidden className="size-4" />
            All posts
          </Link>

          <time
            dateTime={toDateTimeAttr(post.publishedAt)}
            className="text-label text-teal mt-6 block uppercase"
          >
            {formatDate(post.publishedAt)}
          </time>

          <h1 className="text-display-l font-display mt-2 text-balance text-white italic">
            {post.title}
          </h1>

          {post.summary && (
            <p className="text-body-lg text-cloud mt-4">{post.summary}</p>
          )}
        </div>
      </Section>

      <Section ground="white" className="py-16 sm:py-20">
        <RichText doc={post.body} />
      </Section>

      <CtaBand whatsappHref={whatsappHref} />
    </>
  );
}
