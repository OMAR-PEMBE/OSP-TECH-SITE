import type { Metadata } from "next";
import { requireOwner } from "@/lib/auth/session";
import { AdminShell } from "@/components/admin/admin-shell";

/**
 * Admin shell (architecture.md 5.1, FR-A2).
 *
 * `requireOwner()` runs on the server before any admin page renders. The
 * middleware already turned away anyone with no session at all; this is the
 * check that also enforces the *role*, and it is the one that matters — a
 * signed-in non-owner gets nothing. RLS refuses the rows underneath besides
 * (security.md 3).
 *
 * `force-dynamic` because admin pages are per-session and must never be
 * cached or prerendered: a cached admin page is a data leak waiting for the
 * next visitor (architecture.md 5.2).
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "OSP Admin", template: "%s · OSP Admin" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireOwner();

  return <AdminShell session={session}>{children}</AdminShell>;
}
