"use client";

import Link from "next/link";
import { Card } from "@/components/admin/card";
import { EntityForm } from "@/components/admin/entity-form";
import { TextAreaField, TextField } from "@/components/admin/form";
import { PostEditor } from "@/components/admin/post-editor";
import { savePost } from "@/app/actions/content";
import type { AdminPost } from "@/lib/db/admin";

/**
 * Create/edit a post (FR-A6).
 *
 * Saving and publishing are separate on purpose. This form only ever writes
 * the draft content; `publishPost` is its own action on the list page. That
 * way "save my work" can never accidentally put an unfinished post on the
 * public site.
 */
export function PostForm({ post }: { post?: AdminPost }) {
  return (
    <EntityForm
      action={savePost.bind(null, post?.id ?? null)}
      redirectTo="/admin/posts"
      submitLabel={post ? "Save changes" : "Create post"}
      secondaryAction={
        <Link
          href="/admin/posts"
          className="text-small rounded-input text-slate px-2 font-semibold underline-offset-4 hover:underline"
        >
          Cancel
        </Link>
      }
    >
      {(errors) => (
        <>
          <Card className="flex flex-col gap-5">
            <TextField
              label="Title"
              name="title"
              required
              defaultValue={post?.title}
              error={errors.title}
            />
            <TextField
              label="Slug"
              name="slug"
              required
              defaultValue={post?.slug}
              error={errors.slug}
              hint="The page link: /blog/your-slug"
            />
            <TextAreaField
              label="Summary"
              name="summary"
              rows={2}
              defaultValue={post?.summary ?? ""}
              error={errors.summary}
              hint="Shown on the blog list and the home page."
            />
          </Card>

          <Card>
            <p className="text-small text-navy font-semibold">Content</p>
            <div className="mt-1.5">
              <PostEditor initialContent={post?.body} />
            </div>
            {errors.body && (
              <p role="alert" className="text-small text-danger-text mt-1.5">
                {errors.body}
              </p>
            )}
          </Card>

          <Card className="flex flex-col gap-5">
            <p className="text-label text-slate uppercase">Search listing</p>
            <TextField
              label="Meta title"
              name="meta_title"
              defaultValue={post?.metaTitle ?? ""}
              error={errors.meta_title}
              hint="Leave blank to use the post title."
            />
            <TextAreaField
              label="Meta description"
              name="meta_description"
              rows={2}
              defaultValue={post?.metaDescription ?? ""}
              error={errors.meta_description}
              hint="Leave blank to use the summary."
            />
            <TextField
              label="Cover image path"
              name="cover_image"
              defaultValue={post?.coverImage ?? ""}
              error={errors.cover_image}
            />
          </Card>
        </>
      )}
    </EntityForm>
  );
}
