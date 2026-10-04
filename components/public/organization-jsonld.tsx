import { SITE_DESCRIPTION, SITE_NAME, absoluteUrl, siteUrl } from "@/lib/site";
import type { PublicSettings } from "@/lib/db/queries";

/**
 * Organisation structured data (FR-W10, architecture.md 12).
 *
 * Built from the settings row, so editing the WhatsApp number or socials in
 * Admin updates what search engines are told, with no code change.
 *
 * `<` is escaped in the serialised JSON. Without that, a value containing
 * `</script>` would close the tag early and the rest would be parsed as
 * markup — the one injection route a JSON-LD block actually has.
 */
export function OrganizationJsonLd({
  settings,
}: {
  settings: PublicSettings | null;
}) {
  const sameAs = Object.values(settings?.socials ?? {}).filter(
    (url): url is string => typeof url === "string" && url.length > 0,
  );

  const data = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: settings?.companyName ?? SITE_NAME,
    alternateName: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: siteUrl(),
    logo: absoluteUrl("/brand/osp-logo.svg"),
    image: absoluteUrl("/brand/og-default.png"),
    ...(settings?.email && { email: settings.email }),
    ...(settings?.phone && { telephone: settings.phone }),
    ...(sameAs.length > 0 && { sameAs }),
    address: {
      "@type": "PostalAddress",
      addressLocality: settings?.location ?? "Morogoro",
      addressCountry: "TZ",
    },
  };

  return (
    <script
      type="application/ld+json"
      /* JSON-LD has to be a raw script body; there is no React API for it.
         The payload is our own data and every "<" is escaped above. */
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
