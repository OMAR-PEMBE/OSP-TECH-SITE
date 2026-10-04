import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { Card } from "@/components/admin/card";
import { EmptyState } from "@/components/admin/empty-state";
import { StatusPill } from "@/components/admin/status-pill";
import { ButtonLink } from "@/components/ui/button";
import { PostRowActions } from "@/components/admin/post-row-actions";
import { listPosts } from "@/lib/db/admin";
import { formatDateShort } from "@/lib/format";

/** Admin → Posts (FR-A6). */
export const metadata = { title: "Posts" };

export default async function AdminPostsPage() {
  const posts = await listPosts();

  return (
    <>
      <PageHeader
        title="Posts"
        description="Drafts stay private until you publish them."
        actions={
          <ButtonLink href="/admin/posts/new" size="sm">
            <Plus aria-hidden className="size-4" />
            New post
          </ButtonLink>
        }
      />

      <div className="mt-6">
        {posts.length === 0 ? (
          <EmptyState
            title="No posts yet"
            description="Write your first post. It stays a draft until you publish it."
            action={
              <ButtonLink href="/admin/posts/new" size="sm">
                Write a post
              </ButtonLink>
            }
          />
        ) : (
          <Card className="p-0 sm:p-0">
            <ul className="divide-border divide-y">
              {posts.map((post) => (
                <li
                  key={post.id}
                  className="flex flex-wrap items-center gap-3 p-4 sm:p-5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/admin/posts/${post.id}`}
                        className="text-body text-navy rounded-input font-semibold underline-offset-4 hover:underline"
                      >
                        {post.title}
                      </Link>
                      {post.status === "published" ? (
                        <StatusPill tone="positive">Published</StatusPill>
                      ) : (
                        <StatusPill tone="warning">Draft</StatusPill>
                      )}
                    </div>
                    <p className="text-small text-slate mt-0.5 truncate">
                      /blog/{post.slug}
                      {post.publishedAt
                        ? ` — published ${formatDateShort(post.publishedAt)}`
                        : ` — edited ${formatDateShort(post.updatedAt)}`}
                    </p>
                  </div>

                  <PostRowActions
                    id={post.id}
                    slug={post.slug}
                    title={post.title}
                    status={post.status}
                  />
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </>
  );
}
