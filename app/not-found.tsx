import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { Slash } from "@/components/ui/slash";
import { ButtonLink } from "@/components/ui/button";

/**
 * 404 (FR-W9).
 *
 * Lives at the app root rather than inside (public) so it also catches URLs
 * that match no route group at all. It therefore renders its own header and
 * footer-free shell instead of inheriting the public layout.
 */
export default function NotFound() {
  return (
    <main className="surface-navy relative flex min-h-dvh flex-col items-center justify-center overflow-clip px-4 text-center">
      <div className="hero-glow absolute inset-0 -z-10" aria-hidden="true" />
      <Slash
        bars={3}
        className="absolute -bottom-[10%] -left-[10%] -z-10 h-[45%] w-[45%] opacity-50"
      />

      <Link href="/" aria-label="OSP Tech — home" className="rounded-input">
        <Logo placement="header-on-dark" height={40} decorative />
      </Link>

      <p className="text-label text-teal mt-12 uppercase">Error 404</p>
      <h1 className="text-display-l font-display mt-3 text-balance text-white italic">
        That page has moved on.
      </h1>
      <p className="text-body-lg text-cloud mt-4 max-w-[34rem]">
        The link may be old, or the page may never have existed. Everything
        still works from the home page.
      </p>

      <div className="mt-10 flex flex-wrap justify-center gap-4">
        <ButtonLink href="/" variant="primary">
          Back to home
        </ButtonLink>
        <ButtonLink href="/contact" variant="on-navy">
          Contact us
        </ButtonLink>
      </div>
    </main>
  );
}
