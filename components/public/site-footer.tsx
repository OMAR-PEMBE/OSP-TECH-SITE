import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { Slash } from "@/components/ui/slash";
import { Section } from "@/components/ui/section";
import { WhatsAppLink } from "@/components/public/whatsapp-link";
import type { PublicSettings } from "@/lib/db/queries";

/**
 * Site footer (prd.md 5.1, UI-UX.md 7).
 *
 * Navy ground with the on-dark logo (the variant that carries the tagline),
 * link columns, contact details, socials, and a single 60 degree slash
 * bleeding off the right edge — the one slash this layout is allowed, since
 * the hero's belongs to the hero section.
 */

const COLUMNS = [
  {
    heading: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/portfolio", label: "Portfolio" },
      { href: "/blog", label: "Blog" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    heading: "What we do",
    links: [
      { href: "/services", label: "Services" },
      { href: "/products", label: "Ready-made systems" },
    ],
  },
];

const SOCIAL_LABELS: Record<string, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  x: "X",
  tiktok: "TikTok",
};

export function SiteFooter({
  settings,
  whatsappHref,
}: {
  settings: PublicSettings | null;
  whatsappHref: string | null;
}) {
  const socials = Object.entries(settings?.socials ?? {}).filter(
    ([, url]) => typeof url === "string" && url.length > 0,
  );

  return (
    <Section ground="navy" as="footer" className="pt-16 pb-10">
      <Slash
        tone="blue-teal"
        bars={2}
        flip
        className="absolute -right-[6%] -bottom-[10%] h-[55%] w-[34%] opacity-40"
      />

      <div className="relative grid gap-12 md:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div>
          <Logo placement="footer" height={52} />
          {settings?.location && (
            <p className="text-small text-cloud mt-5 flex items-start gap-2">
              <MapPin
                aria-hidden
                className="text-teal mt-0.5 size-4 shrink-0"
              />
              {settings.location}
            </p>
          )}
        </div>

        {COLUMNS.map((column) => (
          <nav key={column.heading} aria-label={column.heading}>
            <h2 className="text-label text-teal uppercase">{column.heading}</h2>
            <ul className="mt-4 flex flex-col gap-2.5">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-small rounded-input hover:text-teal text-white/85 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <div>
          <h2 className="text-label text-teal uppercase">Get in touch</h2>
          <ul className="mt-4 flex flex-col gap-2.5">
            {settings?.phone && (
              <li>
                <a
                  href={`tel:${settings.phone.replace(/\s/g, "")}`}
                  className="text-small rounded-input hover:text-teal flex items-center gap-2 text-white/85 transition-colors"
                >
                  <Phone aria-hidden className="text-teal size-4 shrink-0" />
                  {settings.phone}
                </a>
              </li>
            )}
            {settings?.email && (
              <li>
                <a
                  href={`mailto:${settings.email}`}
                  className="text-small rounded-input hover:text-teal flex items-center gap-2 text-white/85 transition-colors"
                >
                  <Mail aria-hidden className="text-teal size-4 shrink-0" />
                  {settings.email}
                </a>
              </li>
            )}
            {whatsappHref && (
              <li>
                <WhatsAppLink
                  href={whatsappHref}
                  item="footer"
                  className="text-small rounded-input hover:text-teal text-white/85 transition-colors"
                >
                  Chat on WhatsApp
                </WhatsAppLink>
              </li>
            )}
          </ul>

          {socials.length > 0 && (
            <ul className="mt-5 flex flex-wrap gap-x-4 gap-y-2">
              {socials.map(([key, url]) => (
                <li key={key}>
                  <a
                    href={url as string}
                    target="_blank"
                    rel="noopener noreferrer me"
                    className="text-small rounded-input hover:text-teal text-white/85 underline-offset-4 transition-colors hover:underline"
                  >
                    {SOCIAL_LABELS[key] ?? key}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <p className="text-small relative mt-12 border-t border-white/10 pt-6 text-white/65">
        © {new Date().getFullYear()}{" "}
        {settings?.companyName ?? "OSP Technologies"}. Morogoro, Tanzania.
      </p>
    </Section>
  );
}
