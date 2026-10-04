"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import type { ActionResult } from "@/lib/types/action";

/** Edit / delete for a finance row, with inline confirmation. */
export function FinanceRowActions({
  editHref,
  onDelete,
  label,
}: {
  editHref: string;
  onDelete: () => Promise<ActionResult<null>>;
  label: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (confirming) {
    return (
      <span className="flex items-center gap-1">
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const result = await onDelete();
              if (!result.ok) {
                setError(result.error.message);
                return;
              }
              setConfirming(false);
              router.refresh();
            })
          }
          className="rounded-input bg-danger text-label min-h-[36px] px-2.5 font-semibold text-white"
        >
          {pending ? "…" : "Delete"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="rounded-input text-label text-navy hover:bg-cloud min-h-[36px] px-2.5 font-semibold"
        >
          Cancel
        </button>
        {error && (
          <span role="alert" className="text-label text-danger-text">
            {error}
          </span>
        )}
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1">
      <Link
        href={editHref}
        aria-label={`Edit ${label}`}
        className="rounded-input text-navy hover:bg-cloud inline-flex size-9 items-center justify-center"
      >
        <Pencil aria-hidden className="size-4" />
      </Link>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        aria-label={`Delete ${label}`}
        className="rounded-input text-navy hover:bg-cloud inline-flex size-9 items-center justify-center"
      >
        <Trash2 aria-hidden className="text-danger size-4" />
      </button>
    </span>
  );
}
