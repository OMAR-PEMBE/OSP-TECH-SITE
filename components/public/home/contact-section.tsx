import { Mail, MapPin, Phone } from "lucide-react";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/public/section-heading";
import { ContactForm } from "@/components/public/contact-form";
import { WhatsAppLink } from "@/components/public/whatsapp-link";
import { buildWhatsAppLink } from "@/lib/whatsapp/build-link";
import type { PublicSettings } from "@/lib/db/queries";

/**
 * Home contact section (prd.md 5.2, FR-W5).
 *
 * Two routes to the same conversation, side by side: WhatsApp for people who
 * want an answer now, the form for people who would rather write it down. The
 * WhatsApp option comes first because that is how this audience prefers to
 * talk (prd.md 3).
 */
export function ContactSection({
  settings,
  sourcePage = "/",
  heading = true,
}: {
  settings: PublicSettings | null;
  /** Stored on the message so Admin knows which page it came from. */
  sourcePage?: string;
  /** The /contact page has its own hero heading, so it suppresses this one. */
  heading?: boolean;
}) {
  /* Through the shared builder, not a hand-rolled template: the default
     greeting belongs on this link too, and `buildWhatsAppLink` is the one
     place that knows how to encode it (API.md 7). */
  const waHref = settings?.whatsappNumber
    ? buildWhatsAppLink({
        number: settings.whatsappNumber,
        message: settings.defaultWhatsappGreeting,
      })
    : null;

  return (
    <Section
      ground="white"
      id="contact"
      className="scroll-mt-24 py-20 sm:py-28"
    >
      {heading && (
        <SectionHeading
          label="Contact"
          title="Start a conversation."
          lead="Tell us what you need. We reply on WhatsApp, usually the same day."
        />
      )}

      <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_1.3fr]">
        <div>
          <ul className="flex flex-col gap-4">
            {settings?.phone && (
              <ContactDetail
                icon={<Phone aria-hidden className="size-5" />}
                label="Phone"
              >
                <a
                  href={`tel:${settings.phone.replace(/\s/g, "")}`}
                  className="rounded-input text-blue-strong font-semibold underline-offset-4 hover:underline"
                >
                  {settings.phone}
                </a>
              </ContactDetail>
            )}

            {settings?.email && (
              <ContactDetail
                icon={<Mail aria-hidden className="size-5" />}
                label="Email"
              >
                <a
                  href={`mailto:${settings.email}`}
                  className="rounded-input text-blue-strong font-semibold underline-offset-4 hover:underline"
                >
                  {settings.email}
                </a>
              </ContactDetail>
            )}

            {settings?.location && (
              <ContactDetail
                icon={<MapPin aria-hidden className="size-5" />}
                label="Where we are"
              >
                <span className="text-navy">{settings.location}</span>
              </ContactDetail>
            )}
          </ul>

          {waHref && (
            <WhatsAppLink
              href={waHref}
              item={`contact${sourcePage === "/" ? "" : sourcePage}`}
              className="bg-whatsapp text-navy rounded-card shadow-soft mt-8 min-h-[48px] w-full justify-center px-6 font-semibold transition-transform hover:-translate-y-0.5 motion-reduce:hover:translate-y-0 sm:w-auto"
            >
              Chat on WhatsApp instead
            </WhatsAppLink>
          )}
        </div>

        <ContactForm sourcePage={sourcePage} />
      </div>
    </Section>
  );
}

function ContactDetail({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-start gap-3">
      <span className="bg-cloud text-blue-strong rounded-input flex size-10 shrink-0 items-center justify-center">
        {icon}
      </span>
      <span className="flex flex-col">
        <span className="text-label text-slate uppercase">{label}</span>
        <span className="text-body mt-0.5">{children}</span>
      </span>
    </li>
  );
}
