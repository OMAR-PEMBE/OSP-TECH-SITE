"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { Container } from "@/components/ui/container";
import { WhatsAppLink } from "@/components/public/whatsapp-link";
import { cn } from "@/lib/utils/cn";

/**
 * Site navigation (prd.md 5.1).
 *
 * Transparent over the hero, frosted white once scrolled. Logo left, links
 * centre, WhatsApp right; below the lg breakpoint a hamburger opens a
 * full-screen menu.
 *
 * The logo colourway follows the bar: white while it is transparent over the
 * navy hero, colour once the bar is white — the colour logo must never sit on
 * navy (UI-UX.md 4).
 *
 * Accessibility: the menu traps nothing and hides nothing from the keyboard —
 * it is a real `<nav>` with a labelled toggle, closes on Escape, restores
 * focus to the button, and locks body scroll only while open.
 */

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/products", label: "Products" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/blog", label: "Blog" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader({
  whatsappHref,
}: {
  /** Null when no number is configured — the button is then omitted. */
  whatsappHref: string | null;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const menuId = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);

  /* The bar only goes frosted over a page that starts with a dark hero. */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Close on route change, so navigating does not leave the menu up.
     Adjusted during render rather than in an effect: setState in an effect
     causes a second render pass, and this way the menu is already closed in
     the very first render of the new route instead of flashing open. Covers
     back/forward too, which an onClick on each link would miss. */
  const [renderedPath, setRenderedPath] = useState(pathname);
  if (renderedPath !== pathname) {
    setRenderedPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  /* While the menu is open the panel is white, so the bar must be too. */
  const onLightBar = scrolled || open;

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow] duration-200",
        onLightBar
          ? "shadow-soft bg-white/90 backdrop-blur-md"
          : "bg-transparent",
      )}
    >
      <Container className="flex items-center justify-between gap-4 py-3">
        <Link
          href="/"
          aria-label="OSP Tech — home"
          className="rounded-input inline-flex shrink-0"
        >
          <Logo
            placement={onLightBar ? "header" : "header-on-dark"}
            height={36}
            decorative
            priority
          />
        </Link>

        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-7">
            {LINKS.map((link) => {
              const active =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "text-small rounded-input font-semibold transition-colors",
                      /* Blue-Strong, never brand blue: these are 14px links
                         on white (UI-UX.md 2.3, FR-B3). */
                      onLightBar
                        ? active
                          ? "text-blue-strong"
                          : "text-navy hover:text-blue-strong"
                        : active
                          ? "text-teal"
                          : "hover:text-teal text-white/90",
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          {whatsappHref && (
            <WhatsAppLink
              href={whatsappHref}
              item="header"
              className="bg-whatsapp text-navy rounded-card text-small shadow-soft hidden min-h-[44px] px-4 font-semibold transition-transform hover:-translate-y-0.5 sm:inline-flex"
            >
              Chat on WhatsApp
            </WhatsAppLink>
          )}

          <button
            ref={toggleRef}
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls={menuId}
            aria-label={open ? "Close menu" : "Open menu"}
            className={cn(
              "rounded-input inline-flex size-11 items-center justify-center lg:hidden",
              onLightBar ? "text-navy" : "text-white",
            )}
          >
            {open ? <X aria-hidden /> : <Menu aria-hidden />}
          </button>
        </div>
      </Container>

      {/* Full-screen mobile menu. Kept mounted and toggled with `hidden` so
          the links stay in the document for assistive tech to find. */}
      <div
        id={menuId}
        hidden={!open}
        className="bg-white lg:hidden"
        /* Below the fixed bar, filling the rest of the screen. */
        style={{ height: "calc(100dvh - 60px)" }}
      >
        <Container className="flex h-full flex-col py-6">
          <nav aria-label="Mobile" className="flex-1">
            <ul className="flex flex-col gap-1">
              {LINKS.map((link) => {
                const active =
                  link.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(link.href);
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "rounded-input text-h3 flex min-h-[52px] items-center font-semibold",
                        active ? "text-blue-strong" : "text-navy",
                      )}
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {whatsappHref && (
            <WhatsAppLink
              href={whatsappHref}
              item="mobile-menu"
              className="bg-whatsapp text-navy rounded-card text-body shadow-soft mt-6 min-h-[52px] w-full justify-center font-semibold"
            >
              Chat on WhatsApp
            </WhatsAppLink>
          )}
        </Container>
      </div>
    </header>
  );
}
