"use client";

import { useRef, useState, useTransition } from "react";
import { FileUp, Loader2, Paperclip, X } from "lucide-react";
import { getSignedMediaUrl, uploadMedia } from "@/app/actions/admin";

/**
 * Receipt upload (FR-A13, security.md 8).
 *
 * The file goes to the PRIVATE bucket and only its path is stored on the
 * expense row. The binary never touches the database and is never publicly
 * readable — viewing one mints a 60-second signed URL on demand.
 *
 * The hidden input carries the path, so the surrounding expense form posts it
 * like any other field.
 */
export function ReceiptUpload({
  name = "receipt_url",
  defaultPath,
}: {
  name?: string;
  defaultPath?: string | null;
}) {
  const [path, setPath] = useState<string>(defaultPath ?? "");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function onPick(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.set("file", file);
    formData.set("bucket", "private-media");

    setError(null);
    startTransition(async () => {
      const result = await uploadMedia(formData);
      if (!result.ok) {
        setError(result.error.message);
        /* Clear the picker so the same file can be retried after fixing it. */
        if (inputRef.current) inputRef.current.value = "";
        return;
      }
      setPath(result.data.path);
    });
  }

  function view() {
    startTransition(async () => {
      const result = await getSignedMediaUrl(path);
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      window.open(result.data.url, "_blank", "noopener,noreferrer");
    });
  }

  return (
    <div>
      <input type="hidden" name={name} value={path} readOnly />

      <p className="text-small text-navy font-semibold">Receipt</p>

      {path ? (
        <div className="rounded-input border-border mt-1.5 flex flex-wrap items-center gap-2 border bg-white p-2.5">
          <Paperclip aria-hidden className="text-slate size-4 shrink-0" />
          <span className="text-small text-navy min-w-0 flex-1 truncate">
            {path.split("/").pop()}
          </span>
          <button
            type="button"
            onClick={view}
            disabled={pending}
            className="rounded-input text-small text-blue-strong min-h-[36px] px-2 font-semibold"
          >
            View
          </button>
          <button
            type="button"
            onClick={() => {
              setPath("");
              if (inputRef.current) inputRef.current.value = "";
            }}
            aria-label="Remove receipt"
            className="rounded-input text-navy hover:bg-cloud inline-flex size-9 items-center justify-center"
          >
            <X aria-hidden className="size-4" />
          </button>
        </div>
      ) : (
        <label className="rounded-input border-border text-small text-navy hover:bg-cloud mt-1.5 flex min-h-[44px] cursor-pointer items-center gap-2 border border-dashed bg-white px-3 font-semibold transition-colors">
          {pending ? (
            <Loader2 aria-hidden className="size-4 animate-spin" />
          ) : (
            <FileUp aria-hidden className="size-4" />
          )}
          {pending ? "Uploading…" : "Attach a photo or PDF"}
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/avif,application/pdf"
            onChange={onPick}
            disabled={pending}
            className="sr-only"
          />
        </label>
      )}

      <p className="text-small text-slate mt-1.5">
        Stored privately. Only you can open it, through a short-lived link.
      </p>

      {error && (
        <p role="alert" className="text-small text-danger-text mt-1.5">
          {error}
        </p>
      )}
    </div>
  );
}
