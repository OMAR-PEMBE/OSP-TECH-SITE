"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ExternalLink, Pencil, Trash2 } from "lucide-react";
import { deletePost, publishPost, unpublishPost } from "@/app/actions/content";

/**
 * Row controls for a post (FR-A6).
 *
 * Publish and unpublish are explicit buttons rather than a status dropdown,
 * because they are the two actions with a visible consequence on the public
 * site and should read as decisions, not as editing a field.
 */
export function PostRowActions({
  id,
  slug,
  title,
  status,
}: {
  id: string;
  /** The public URL uses the slug, not the id. */
  slug: string;
  title: string;
  status: "draft" | "published";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function run(
    fn: () => Promise<{ ok: boolean; error?: { message: string } }>,
  ) {
    startTransition(async () => {
      const result = await fn();
      if (!result.ok) {
        setError(result.error?.message ?? "Something went wrong.");
        return;
      }
      setError(null);
      setConfirming(false);
      router.refresh();
    });
  }

  const iconButton =
    "rounded-input text-navy hover:bg-cloud inline-flex size-10 items-center justify-center transition-colors disabled:opacity-50";
  const textButton =
    "rounded-input text-small min-h-[40px] px-3 font-semibold transition-colors disabled:opacity-50";

  if (confirming) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-small text-navy">Delete this post?</span>
        <button
          type="button"
          onClick={() => run(() => deletePost(id))}
          disabled={pending}
          className={`${textButton} bg-danger text-white`}
        >
          {pending ? "Deleting…" : "Yes, delete"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={pending}
          className={`${textButton} text-navy hover:bg-cloud`}
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-1">
      {error && (
        <span role="alert" className="text-small text-danger-text mr-2">
          {error}
        </span>
      )}

      {status === "published" ? (
        <button
          type="button"
          onClick={() => run(() => unpublishPost(id))}
          disabled={pending}
          className={`${textButton} text-navy hover:bg-cloud`}
        >
          Unpublish
        </button>
      ) : (
        <button
          type="button"
          onClick={() => run(() => publishPost(id))}
          disabled={pending}
          className={`${textButton} bg-blue-strong text-white`}
        >
          Publish
        </button>
      )}

      {status === "published" && (
        <Link
          href={`/blog/${slug}`}
          aria-label={`View ${title} on the site`}
          className={iconButton}
          /* The public page is a different surface; opening it in a new tab
             keeps the admin session and any unsaved work in place. */
          target="_blank"
          rel="noopener noreferrer"
        >
          <ExternalLink aria-hidden className="size-4" />
        </Link>
      )}

      <Link
        href={`/admin/posts/${id}`}
        aria-label={`Edit ${title}`}
        className={iconButton}
      >
        <Pencil aria-hidden className="size-4" />
      </Link>

      <button
        type="button"
        onClick={() => setConfirming(true)}
        disabled={pending}
        aria-label={`Delete ${title}`}
        className={iconButton}
      >
        <Trash2 aria-hidden className="text-danger size-4" />
      </button>
    </div>
  );
}
