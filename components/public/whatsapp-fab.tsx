"use client";

import { useEffect, useState } from "react";
import { WhatsAppLink } from "@/components/public/whatsapp-link";

/**
 * Floating WhatsApp button (prd.md 5.1, FR-W4).
 *
 * Bottom-right on every page, pulsing once a few seconds after load to catch
 * the eye without becoming the blinking thing in the corner of a page someone
 * is trying to read. One pulse, then it stays put.
 *
 * The pulse is a sibling ring rather than a transform on the button, so the
 * tap target never moves or scales while someone is reaching for it. Under
 * `prefers-reduced-motion` the ring is suppressed by the global rule in
 * globals.css and the button simply appears.
 */
export function WhatsAppFab({ href }: { href: string }) {
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const show = window.setTimeout(() => setPulse(true), 3_000);
    /* Clear once the animation has run, so it cannot repeat. */
    const stop = window.setTimeout(() => setPulse(false), 5_400);
    return () => {
      window.clearTimeout(show);
      window.clearTimeout(stop);
    };
  }, []);

  return (
    <div
      className="fixed right-4 bottom-4 z-40"
      style={{
        /* Clear of the iOS home indicator and Android gesture bar. */
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <div className="relative">
        {pulse && (
          <span
            aria-hidden="true"
            className="bg-whatsapp absolute inset-0 -z-10 rounded-full motion-safe:animate-[osp-fab-pulse_1.2s_ease-out_2]"
          />
        )}
        <WhatsAppLink
          href={href}
          item="fab"
          showGlyph={false}
          aria-label="Chat with OSP Tech on WhatsApp"
          className="bg-whatsapp text-navy shadow-soft flex size-14 items-center justify-center rounded-full transition-transform hover:-translate-y-0.5"
        >
          {/* Sized larger than the inline glyph: this is the only thing in the
              button, so it carries the whole affordance. */}
          <svg
            viewBox="0 0 24 24"
            width={28}
            height={28}
            fill="currentColor"
            aria-hidden="true"
            focusable="false"
          >
            <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.87 9.87 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm-2.6 6.07c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1s.9 2.43 1.03 2.6c.13.17 1.74 2.78 4.27 3.79 2.1.83 2.4.66 2.83.62.43-.04 1.4-.57 1.6-1.13.2-.56.2-1.03.14-1.13-.06-.1-.23-.17-.48-.29-.25-.12-1.4-.69-1.62-.77-.22-.08-.38-.12-.54.12-.16.25-.62.8-.76.96-.14.17-.28.19-.52.07-.25-.13-1.05-.39-2-1.23-.74-.66-1.23-1.46-1.37-1.71-.14-.25-.02-.38.1-.5.11-.12.43-.44.52-.6.1-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.19-.46-.39-.47-.54-.48h-.35Z" />
          </svg>
        </WhatsAppLink>
      </div>
    </div>
  );
}
