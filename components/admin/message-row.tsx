"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { StatusPill } from "@/components/admin/status-pill";
import { WhatsAppGlyph } from "@/components/ui/whatsapp-glyph";
import { deleteMessage, updateMessageStatus } from "@/app/actions/admin";
import { buildWhatsAppLink } from "@/lib/whatsapp/build-link";
import { formatDateShort } from "@/lib/format";
import type { AdminMessage } from "@/lib/db/admin";

/**
 * One contact message (FR-A7).
 *
 * The reply button opens WhatsApp to *the sender's* number — the point of the
 * flow in workflows.md B2 — pre-filled with a greeting naming them, so the
 * owner can answer in one tap from a phone.
 *
 * Replying also marks the message replied, because doing it by hand is the
 * step that gets skipped and then the list stops meaning anything.
 */
export function MessageRow({
  message,
  whatsappNumber,
}: {
  message: AdminMessage;
  /** The business number, for the case where the sender left none. */
  whatsappNumber: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* Reply to the sender if they gave a number; otherwise there is nobody to
     open a chat with and the button is not rendered at all. */
  const replyHref = message.phone
    ? buildWhatsAppLink({
        number: message.phone,
        message: `Hello ${message.name}, thank you for contacting OSP Tech.`,
      })
    : null;

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

  const statusTone =
    message.status === "new"
      ? "info"
      : message.status === "replied"
        ? "positive"
        : "neutral";

  const textButton =
    "rounded-input text-small min-h-[40px] px-3 font-semibold transition-colors disabled:opacity-50";

  return (
    <li className="p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-body text-navy font-semibold">{message.name}</p>
            <StatusPill tone={statusTone}>{message.status}</StatusPill>
          </div>
          <p className="text-small text-slate mt-0.5">
            {formatDateShort(message.createdAt)}
            {message.phone ? ` · ${message.phone}` : " · no phone given"}
            {message.sourcePage ? ` · from ${message.sourcePage}` : ""}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1">
          {replyHref && (
            <a
              href={replyHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                /* Mark replied as the chat opens. Not awaited — the chat
                   should open immediately, and a failed status update is
                   recoverable, a lost lead is not. */
                if (message.status === "new") {
                  void updateMessageStatus(message.id, "replied").then(() =>
                    router.refresh(),
                  );
                }
              }}
              className={`${textButton} bg-whatsapp text-navy inline-flex items-center gap-2`}
            >
              <WhatsAppGlyph size={16} />
              Reply
            </a>
          )}

          {message.status !== "closed" && (
            <button
              type="button"
              onClick={() =>
                run(() => updateMessageStatus(message.id, "closed"))
              }
              disabled={pending}
              className={`${textButton} text-navy hover:bg-cloud`}
            >
              Close
            </button>
          )}

          {message.status === "closed" && (
            <button
              type="button"
              onClick={() => run(() => updateMessageStatus(message.id, "new"))}
              disabled={pending}
              className={`${textButton} text-navy hover:bg-cloud`}
            >
              Reopen
            </button>
          )}

          {confirming ? (
            <>
              <button
                type="button"
                onClick={() => run(() => deleteMessage(message.id))}
                disabled={pending}
                className={`${textButton} bg-danger text-white`}
              >
                {pending ? "Deleting…" : "Confirm delete"}
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                disabled={pending}
                className={`${textButton} text-navy hover:bg-cloud`}
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              disabled={pending}
              aria-label={`Delete message from ${message.name}`}
              className="rounded-input text-navy hover:bg-cloud inline-flex size-10 items-center justify-center"
            >
              <Trash2 aria-hidden className="text-danger size-4" />
            </button>
          )}
        </div>
      </div>

      {message.need && (
        <p className="text-small text-blue-strong mt-3 font-semibold">
          Needs: {message.need}
        </p>
      )}

      {/* `whitespace-pre-wrap` keeps the sender's line breaks. React escapes
          the text, so there is no markup risk in rendering it as written. */}
      <p className="text-body text-navy mt-2 whitespace-pre-wrap">
        {message.message}
      </p>

      {error && (
        <p role="alert" className="text-small text-danger-text mt-2">
          {error}
        </p>
      )}

      {!message.phone && whatsappNumber && (
        <p className="text-small text-slate mt-2">
          No phone number given — reply by email or wait for them to follow up.
        </p>
      )}
    </li>
  );
}
