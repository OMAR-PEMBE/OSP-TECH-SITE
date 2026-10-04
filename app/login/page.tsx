import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { Slash } from "@/components/ui/slash";
import { LoginForm } from "@/app/login/login-form";

/**
 * Admin login (FR-A1).
 *
 * Its own page outside both route groups: it has no public nav and no admin
 * sidebar, because the visitor is neither yet.
 *
 * `noindex` — there is no public sign-up and nothing here for a search engine
 * (security.md 2).
 */
export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <main className="surface-navy relative flex min-h-dvh flex-col items-center justify-center overflow-clip px-4 py-12">
      <div className="hero-glow absolute inset-0 -z-10" aria-hidden="true" />
      <Slash
        bars={3}
        className="absolute -bottom-[12%] -left-[12%] -z-10 h-[45%] w-[45%] opacity-40"
      />

      <Link
        href="/"
        aria-label="OSP Tech — home"
        className="rounded-input mb-10 inline-flex"
      >
        <Logo placement="header-on-dark" height={40} decorative />
      </Link>

      <div className="w-full max-w-[26rem]">
        <h1 className="text-h1 text-center font-bold text-white">OSP Admin</h1>
        <p className="text-small text-cloud mt-2 text-center">
          Sign in to manage your site and your business.
        </p>

        <LoginForm next={next} />
      </div>

      <Link
        href="/"
        className="text-small rounded-input hover:text-teal mt-10 text-white/70 underline-offset-4 hover:underline"
      >
        ← Back to the website
      </Link>
    </main>
  );
}
