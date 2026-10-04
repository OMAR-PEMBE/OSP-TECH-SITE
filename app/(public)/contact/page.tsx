import type { Metadata } from "next";
import { Section } from "@/components/ui/section";
import { Slash } from "@/components/ui/slash";
import { ContactSection } from "@/components/public/home/contact-section";
import { getPublicSettings } from "@/lib/db/queries";
import { absoluteUrl } from "@/lib/site";

/** /contact (FR-W9). Reuses the home contact section so the form behaves identically. */
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Talk to OSP Tech about a website, a business system or automation. We reply on WhatsApp, usually the same day.",
  alternates: { canonical: absoluteUrl("/contact") },
};

export default async function ContactPage() {
  const settings = await getPublicSettings();

  return (
    <>
      <Section ground="navy" className="pt-32 pb-16 sm:pt-40 sm:pb-20">
        <Slash
          className="absolute -right-[8%] -bottom-[20%] h-[60%] w-[30%] opacity-40"
          flip
        />
        <div className="relative max-w-[44rem]">
          <p className="text-label text-teal uppercase">Contact</p>
          <h1 className="text-display-l font-display mt-3 text-balance text-white italic">
            Start a conversation.
          </h1>
          <p className="text-body-lg text-cloud mt-4">
            Tell us what you need. There is no obligation and no sales script.
          </p>
        </div>
      </Section>

      <ContactSection
        settings={settings}
        sourcePage="/contact"
        heading={false}
      />
    </>
  );
}
