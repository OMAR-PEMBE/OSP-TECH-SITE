"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useId, useState } from "react";
import {
  Briefcase,
  CalendarClock,
  FileText,
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  Package,
  Settings,
  Users,
  Wallet,
  Wrench,
  X,
} from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { signOut } from "@/app/login/actions";
import { cn } from "@/lib/utils/cn";
import type { OwnerSession } from "@/lib/auth/session";

/**
 * Admin chrome (UI-UX.md 7, prd.md 4).
 *
 * Calm on purpose: Cloud and white surfaces, no 3D, no scroll animation. The
 * public site sells; this is a work tool, and the brief is explicit that it
 * must be fast and quiet.
 *
 * The sidebar is a plain `<nav>` that collapses behind a toggle below `lg`.
 * It is always in the DOM so assistive tech can reach the links at any width.
 */

const NAV: { href: string; label: string; icon: typeof LayoutDashboard }[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/messages", label: "Messages", icon: Mail },
  { href: "/admin/services", label: "Services", icon: Wrench },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/portfolio", label: "Portfolio", icon: ImageIcon },
  { href: "/admin/posts", label: "Posts", icon: FileText },
  { href: "/admin/clients", label: "Clients", icon: Users },
  { href: "/admin/projects", label: "Projects", icon: Briefcase },
  { href: "/admin/reminders", label: "Reminders", icon: CalendarClock },
  { href: "/admin/finance", label: "Finance", icon: Wallet },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminShell({
  session,
  children,
}: {
  session: OwnerSession;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const navId = useId();

  /* Close on navigation, adjusted during render rather than in an effect so
     the new route's first paint already has the menu closed. */
  const [renderedPath, setRenderedPath] = useState(pathname);
  if (renderedPath !== pathname) {
    setRenderedPath(pathname);
    setOpen(false);
  }

  return (
    <div className="bg-cloud flex min-h-dvh flex-col lg:flex-row">
      {/* Mobile bar */}
      <header className="border-border flex items-center justify-between border-b bg-white px-4 py-3 lg:hidden">
        <Link href="/admin" aria-label="OSP Admin" className="rounded-input">
          <Logo placement="header" height={32} decorative />
        </Link>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls={navId}
          aria-label={open ? "Close menu" : "Open menu"}
          className="rounded-input text-navy inline-flex size-11 items-center justify-center"
        >
          {open ? <X aria-hidden /> : <Menu aria-hidden />}
        </button>
      </header>

      <div
        id={navId}
        hidden={!open}
        className="border-border border-b bg-white lg:hidden"
      >
        <SidebarNav pathname={pathname} session={session} />
      </div>

      {/* Desktop sidebar */}
      <aside className="border-border hidden w-64 shrink-0 border-r bg-white lg:flex lg:flex-col">
        <Link
          href="/admin"
          aria-label="OSP Admin"
          className="rounded-input border-border block border-b px-5 py-5"
        >
          <Logo placement="header" height={32} decorative />
        </Link>
        <SidebarNav pathname={pathname} session={session} />
      </aside>

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
        {children}
      </main>
    </div>
  );
}

function SidebarNav({
  pathname,
  session,
}: {
  pathname: string;
  session: OwnerSession;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <nav aria-label="Admin" className="flex-1 p-3">
        <ul className="flex flex-col gap-0.5">
          {NAV.map((item) => {
            /* Exact match for the dashboard, prefix match elsewhere — else
               /admin would stay highlighted on every sub-page. */
            const active =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "rounded-input text-small flex min-h-[44px] items-center gap-3 px-3 font-semibold transition-colors",
                    active
                      ? "bg-blue-strong text-white"
                      : "text-navy hover:bg-cloud",
                  )}
                >
                  <Icon aria-hidden className="size-4 shrink-0" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-border border-t p-3">
        <p className="text-label text-slate px-3 uppercase">Signed in</p>
        <p className="text-small text-navy mt-1 truncate px-3 font-semibold">
          {session.fullName || session.email}
        </p>

        <form action={signOut} className="mt-3">
          <button
            type="submit"
            className="rounded-input text-small text-navy hover:bg-cloud flex min-h-[44px] w-full items-center gap-3 px-3 font-semibold transition-colors"
          >
            <LogOut aria-hidden className="size-4 shrink-0" />
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
