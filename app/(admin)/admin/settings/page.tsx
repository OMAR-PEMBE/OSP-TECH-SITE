import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { SettingsForm } from "@/components/admin/settings-form";
import { ChangePasswordForm } from "@/components/admin/change-password-form";
import { getSettings } from "@/lib/db/admin";

/** Admin -> Settings (FR-A8). */
export const metadata = { title: "Settings" };

export default async function AdminSettingsPage() {
  const settings = await getSettings();
  if (!settings) notFound();

  return (
    <>
      <PageHeader
        title="Settings"
        description="Your business details, as they appear on the website."
      />
      <SettingsForm settings={settings} />
      <div className="mt-6">
        <ChangePasswordForm />
      </div>
    </>
  );
}
