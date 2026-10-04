"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Eye, EyeOff, Pencil, Trash2 } from "lucide-react";
import type { ActionResult } from "@/lib/types/action";

/**
 * Edit / show-hide / delete for a list row (FR-A4, FR-A5).
 *
 * Delete asks first, and says what it is about to remove. The confirmation is
 * two-step inline rather than a modal: on a phone a modal over a list is more
 * disruptive than the row briefly changing, and the destructive click is
 * never the one already under the finger.
 */
export function RowActions({
  editHref,
  visible,
  onToggle,
  onDelete,
  deleteLabel,
}: {
  editHref: string;
  visible?: boolean;
  onToggle?: (visible: boolean) => Promise<ActionResult<null>>;
  onDelete: () => Promise<ActionResult<null>>;
  deleteLabel: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function run(fn: () => Promise<ActionResult<null>>) {
    startTransition(async () => {
      const result = await fn();
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      setError(null);
      setConfirming(false);
      router.refresh();
    });
  }

  const iconButton =
    "rounded-input text-navy hover:bg-cloud inline-flex size-10 items-center justify-center transition-colors disabled:opacity-50";

  if (confirming) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-small text-navy">Delete this?</span>
        <button
          type="button"
          onClick={() => run(onDelete)}
          disabled={pending}
          className="rounded-input bg-danger text-small min-h-[40px] px-3 font-semibold text-white disabled:opacity-50"
        >
          {pending ? "Deleting…" : "Yes, delete"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={pending}
          className="rounded-input text-small text-navy hover:bg-cloud min-h-[40px] px-3 font-semibold"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      {error && (
        <span role="alert" className="text-small text-danger-text mr-2">
          {error}
        </span>
      )}

      <Link href={editHref} aria-label="Edit" className={iconButton}>
        <Pencil aria-hidden className="size-4" />
      </Link>

      {onToggle && (
        <button
          type="button"
          onClick={() => run(() => onToggle(!visible))}
          disabled={pending}
          aria-label={visible ? "Hide from the site" : "Show on the site"}
          className={iconButton}
        >
          {visible ? (
            <Eye aria-hidden className="size-4" />
          ) : (
            <EyeOff aria-hidden className="text-slate size-4" />
          )}
        </button>
      )}

      <button
        type="button"
        onClick={() => setConfirming(true)}
        disabled={pending}
        aria-label={deleteLabel}
        className={iconButton}
      >
        <Trash2 aria-hidden className="text-danger size-4" />
      </button>
    </div>
  );
}
