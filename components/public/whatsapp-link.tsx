"use client";

import { recordEvent } from "@/lib/analytics/record-event";
import { WhatsAppGlyph } from "@/components/ui/whatsapp-glyph";
import { cn } from "@/lib/utils/cn";

/**
 * A link that opens WhatsApp with a pre-filled message, recording the click
 * (API.md 7, workflows.md B1).
 *
 * Every WhatsApp affordance on the site goes through this, so "record the
 * event, then open the chat" is implemented once.
 *
 * It is a real `<a href>`, not a scripted navigation: middle-click, long-press
 * and "copy link address" all work, and the link still opens if the event
 * request fails or JavaScript is slow to hydrate. `recordEvent` is fired
 * without awaiting — analytics must never sit between a customer and a
 * conversation — and `target="_blank"` keeps this page alive so the pending
 * request is not cancelled by a navigation.
 */
export function WhatsAppLink({
  href,
  item,
  children,
  className,
  showGlyph = true,
  ...props
}: {
  href: string;
  /** Which service/product this click came from, for the event row. */
  item?: string;
  /** Optional: an icon-only link (a card affordance) passes none. */
  children?: React.ReactNode;
  className?: string;
  showGlyph?: boolean;
} & Omit<
  React.ComponentPropsWithoutRef<"a">,
  "href" | "className" | "children"
>) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => {
        void recordEvent({
          type: "whatsapp_click",
          page: window.location.pathname,
          item,
        });
      }}
      className={cn("inline-flex items-center gap-2", className)}
      {...props}
    >
      {showGlyph && <WhatsAppGlyph />}
      {children}
    </a>
  );
}
