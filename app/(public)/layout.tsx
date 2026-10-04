import { SiteHeader } from "@/components/public/site-header";
import { SiteFooter } from "@/components/public/site-footer";
import { WhatsAppFab } from "@/components/public/whatsapp-fab";
import { OrganizationJsonLd } from "@/components/public/organization-jsonld";
import { getPublicSettings } from "@/lib/db/queries";
import { buildWhatsAppLink } from "@/lib/whatsapp/build-link";

/**
 * Public site shell (architecture.md 5.1).
 *
 * Nav, footer and the floating WhatsApp button wrap every public page. All
 * three need the same settings row, so it is fetched once here rather than in
 * each component — within a render pass Next dedupes the request anyway, but
 * fetching it in one place makes the data flow obvious.
 *
 * Revalidated hourly: settings change rarely, and this layout is on every
 * page, so a shorter window would cost cache hits for nothing. A change made
 * in Admin shows up sooner than that because Phase 2 revalidates explicitly on
 * save (architecture.md 6.4).
 */
export const revalidate = 3600;

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getPublicSettings();

  const whatsappHref = settings?.whatsappNumber
    ? buildWhatsAppLink({
        number: settings.whatsappNumber,
        message: settings.defaultWhatsappGreeting,
      })
    : null;

  return (
    <>
      <OrganizationJsonLd settings={settings} />

      {/* First focusable thing on the page: a keyboard user can jump the nav
          instead of tabbing through it on every page (NFR-4). */}
      <a
        href="#main"
        className="text-blue-strong rounded-card focus:shadow-soft sr-only bg-white font-semibold focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:px-4 focus:py-2"
      >
        Skip to content
      </a>

      <SiteHeader whatsappHref={whatsappHref} />

      <main id="main" className="flex-1">
        {children}
      </main>

      <SiteFooter settings={settings} whatsappHref={whatsappHref} />

      {whatsappHref && <WhatsAppFab href={whatsappHref} />}
    </>
  );
}
