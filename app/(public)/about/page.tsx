import type { Metadata } from "next";
import { Section } from "@/components/ui/section";
import { Slash } from "@/components/ui/slash";
import { CtaBand } from "@/components/public/home/cta-band";
import { getPublicSettings } from "@/lib/db/queries";
import { buildWhatsAppLink } from "@/lib/whatsapp/build-link";
import { absoluteUrl } from "@/lib/site";

/** /about (FR-W9). */
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "About",
  description:
    "OSP Technologies is an IT, web and design company in Morogoro, Tanzania, building the systems local businesses run on.",
  alternates: { canonical: absoluteUrl("/about") },
};

const VALUES = [
  {
    title: "Plain language",
    body: "No jargon, no mystery invoices. We explain what we are building and what it costs before we start.",
  },
  {
    title: "Built for real conditions",
    body: "Mid-range Android phones on mobile data. If it is not fast there, it is not finished.",
  },
  {
    title: "Still here afterwards",
    body: "The same WhatsApp number that sold it to you is the one that supports it.",
  },
];

export default async function AboutPage() {
  const settings = await getPublicSettings();

  const whatsappHref = settings?.whatsappNumber
    ? buildWhatsAppLink({
        number: settings.whatsappNumber,
        message: settings.defaultWhatsappGreeting,
      })
    : null;

  return (
    <>
      <Section ground="navy" className="pt-32 pb-20 sm:pt-40 sm:pb-24">
        <Slash
          className="absolute -right-[8%] -bottom-[20%] h-[60%] w-[30%] opacity-40"
          flip
        />
        <div className="relative max-w-[44rem]">
          <p className="text-label text-teal uppercase">About us</p>
          <h1 className="text-display-l font-display mt-3 text-balance text-white italic">
            A technology partner in Morogoro.
          </h1>
          <p className="text-body-lg text-cloud mt-4">
            {settings?.companyName ?? "OSP Technologies"} builds the business
            systems, websites and automation that Tanzanian businesses depend on
            every day.
          </p>
        </div>
      </Section>

      <Section ground="white" className="py-20 sm:py-24">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_1fr]">
          <div className="max-w-[42rem]">
            <h2 className="text-h1 text-navy font-bold">Why we exist</h2>
            <p className="text-body text-slate mt-5 leading-relaxed">
              Plenty of businesses here run on paper, memory and a WhatsApp
              thread. That works until it does not — until stock goes missing, a
              tenant&rsquo;s rent is forgotten, or a month&rsquo;s takings
              cannot be reconstructed.
            </p>
            <p className="text-body text-slate mt-4 leading-relaxed">
              We build the software that replaces those gaps. Not enterprise
              systems bolted onto a small business, but tools shaped around how
              the business already works, priced so it is worth doing.
            </p>

            <h2 className="text-h2 text-navy mt-12 font-bold">How we work</h2>
            <ul className="mt-6 flex flex-col gap-6">
              {VALUES.map((value) => (
                <li key={value.title}>
                  <h3 className="text-h3 text-navy font-semibold">
                    {value.title}
                  </h3>
                  <p className="text-body text-slate mt-1.5">{value.body}</p>
                </li>
              ))}
            </ul>
          </div>

          <aside className="border-border rounded-card bg-cloud h-fit border p-6">
            <h2 className="text-label text-slate uppercase">Founder</h2>
            <p className="text-h3 text-navy mt-2 font-bold">
              Omar Suleiman Pembe
            </p>
            <p className="text-small text-slate mt-3">
              Founder, {settings?.companyName ?? "OSP Technologies"}
            </p>
            {settings?.location && (
              <>
                <h2 className="text-label text-slate mt-6 uppercase">
                  Based in
                </h2>
                <p className="text-body text-navy mt-1">{settings.location}</p>
              </>
            )}
          </aside>
        </div>
      </Section>

      <CtaBand whatsappHref={whatsappHref} />
    </>
  );
}
