"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Card } from "@/components/admin/card";
import { FormError, TextAreaField, TextField } from "@/components/admin/form";
import { Button } from "@/components/ui/button";
import { updateSettings } from "@/app/actions/admin";
import type { AdminSettings } from "@/lib/db/admin";

/**
 * Site settings (FR-A8).
 *
 * Everything the public site reads about the business: the details in the
 * header, footer and contact section, the WhatsApp number every button on the
 * site is built from, and the trust-strip numbers.
 *
 * Socials and trust stats are repeatable, so they are held in React state and
 * posted as JSON in a hidden field rather than as indexed form names. That
 * keeps the server action parsing one value instead of reassembling
 * `trust_stats[0][label]` style keys.
 */

const SOCIAL_KEYS = [
  "instagram",
  "facebook",
  "linkedin",
  "x",
  "tiktok",
] as const;

type Stat = { label: string; value: number | null; suffix: string };

export function SettingsForm({ settings }: { settings: AdminSettings }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [socials, setSocials] = useState<Record<string, string>>(
    () => settings.socials ?? {},
  );
  const [stats, setStats] = useState<Stat[]>(() =>
    (settings.trustStats ?? []).map((s) => ({
      label: s.label,
      value: s.value,
      suffix: s.suffix ?? "",
    })),
  );

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.set("socials", JSON.stringify(socials));
    formData.set("trust_stats", JSON.stringify(stats));

    setFormError(null);
    setSaved(false);

    startTransition(async () => {
      const result = await updateSettings(formData);

      if (result.ok) {
        setErrors({});
        setSaved(true);
        router.refresh();
        return;
      }

      setErrors(result.error.fields ?? {});
      setFormError(result.error.message);
    });
  }

  return (
    <form onSubmit={onSubmit} noValidate className="mt-6 flex flex-col gap-6">
      <Card className="flex flex-col gap-5">
        <p className="text-label text-slate uppercase">Company</p>
        <TextField
          label="Company name"
          name="company_name"
          required
          defaultValue={settings.companyName}
          error={errors.company_name}
        />
        <TextField
          label="Tagline"
          name="tagline"
          defaultValue={settings.tagline}
          error={errors.tagline}
          hint="This is the hero headline on the home page."
        />
        <TextField
          label="Location"
          name="location"
          defaultValue={settings.location ?? ""}
          error={errors.location}
        />
      </Card>

      <Card className="flex flex-col gap-5">
        <p className="text-label text-slate uppercase">Contact</p>
        <TextField
          label="WhatsApp number"
          name="whatsapp_number"
          defaultValue={settings.whatsappNumber ?? ""}
          error={errors.whatsapp_number}
          hint="International format, like +255747809299. Every WhatsApp button on the site uses this."
        />
        <TextField
          label="Phone"
          name="phone"
          defaultValue={settings.phone ?? ""}
          error={errors.phone}
        />
        <TextField
          label="Email"
          name="email"
          type="email"
          defaultValue={settings.email ?? ""}
          error={errors.email}
        />
        <TextAreaField
          label="Default WhatsApp greeting"
          name="default_whatsapp_greeting"
          rows={2}
          defaultValue={settings.defaultWhatsappGreeting ?? ""}
          error={errors.default_whatsapp_greeting}
          hint="Used when a button has no message of its own."
        />
      </Card>

      <Card className="flex flex-col gap-4">
        <p className="text-label text-slate uppercase">Social links</p>
        {SOCIAL_KEYS.map((key) => (
          <TextField
            key={key}
            label={key.charAt(0).toUpperCase() + key.slice(1)}
            name={`social_${key}`}
            type="url"
            value={socials[key] ?? ""}
            onChange={(e) =>
              setSocials((prev) => ({ ...prev, [key]: e.target.value }))
            }
            placeholder="https://"
          />
        ))}
        <p className="text-small text-slate">
          Leave a field blank to hide that link in the footer.
        </p>
      </Card>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-label text-slate uppercase">Trust strip</p>
          <button
            type="button"
            onClick={() =>
              setStats((prev) => [...prev, { label: "", value: 0, suffix: "" }])
            }
            className="rounded-input text-small text-blue-strong hover:bg-cloud inline-flex min-h-[40px] items-center gap-1.5 px-3 font-semibold"
          >
            <Plus aria-hidden className="size-4" />
            Add a number
          </button>
        </div>

        <p className="text-small text-slate mt-2">
          The four numbers under the hero. Leave the number blank for text like
          24/7 and put it in the suffix.
        </p>

        <ul className="mt-4 flex flex-col gap-3">
          {stats.map((stat, index) => (
            <li
              key={index}
              className="border-border rounded-input grid gap-3 border p-3 sm:grid-cols-[1fr_7rem_7rem_auto]"
            >
              <label className="text-small text-navy">
                <span className="sr-only">Label for stat {index + 1}</span>
                <input
                  value={stat.label}
                  onChange={(e) =>
                    setStats((prev) =>
                      prev.map((s, i) =>
                        i === index ? { ...s, label: e.target.value } : s,
                      ),
                    )
                  }
                  placeholder="Projects delivered"
                  className="rounded-input border-border text-body w-full border bg-white px-3 py-2"
                />
              </label>

              <label className="text-small text-navy">
                <span className="sr-only">Value for stat {index + 1}</span>
                <input
                  type="number"
                  value={stat.value ?? ""}
                  onChange={(e) =>
                    setStats((prev) =>
                      prev.map((s, i) =>
                        i === index
                          ? {
                              ...s,
                              value:
                                e.target.value === ""
                                  ? null
                                  : Number(e.target.value),
                            }
                          : s,
                      ),
                    )
                  }
                  placeholder="15"
                  className="rounded-input border-border text-body w-full border bg-white px-3 py-2"
                />
              </label>

              <label className="text-small text-navy">
                <span className="sr-only">Suffix for stat {index + 1}</span>
                <input
                  value={stat.suffix}
                  onChange={(e) =>
                    setStats((prev) =>
                      prev.map((s, i) =>
                        i === index ? { ...s, suffix: e.target.value } : s,
                      ),
                    )
                  }
                  placeholder="+"
                  className="rounded-input border-border text-body w-full border bg-white px-3 py-2"
                />
              </label>

              <button
                type="button"
                onClick={() =>
                  setStats((prev) => prev.filter((_, i) => i !== index))
                }
                aria-label={`Remove stat ${index + 1}`}
                className="rounded-input text-navy hover:bg-cloud inline-flex size-10 items-center justify-center self-center"
              >
                <Trash2 aria-hidden className="text-danger size-4" />
              </button>
            </li>
          ))}
        </ul>
      </Card>

      <FormError message={formError} />

      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save settings"}
        </Button>
        {saved && (
          <p
            role="status"
            className="text-small text-success-text font-semibold"
          >
            Saved. The website is updating.
          </p>
        )}
      </div>
    </form>
  );
}
