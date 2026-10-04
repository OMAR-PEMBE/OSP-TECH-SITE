import Link from "next/link";
import { PageHeader } from "@/components/admin/page-header";
import { Card } from "@/components/admin/card";
import { EmptyState } from "@/components/admin/empty-state";
import { MessageRow } from "@/components/admin/message-row";
import { listMessages } from "@/lib/db/admin";
import { getPublicSettings } from "@/lib/db/queries";
import { cn } from "@/lib/utils/cn";

/** Admin → Messages (FR-A7). */
export const metadata = { title: "Messages" };

const FILTERS = [
  { value: undefined, label: "All" },
  { value: "new" as const, label: "New" },
  { value: "replied" as const, label: "Replied" },
  { value: "closed" as const, label: "Closed" },
];

export default async function AdminMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;

  /* Anything not a known status is treated as "all", so a hand-typed query
     string cannot produce an empty page that looks like a bug. */
  const active =
    status === "new" || status === "replied" || status === "closed"
      ? status
      : undefined;

  const [messages, settings] = await Promise.all([
    listMessages({ status: active }),
    getPublicSettings(),
  ]);

  return (
    <>
      <PageHeader
        title="Messages"
        description="Everything sent through the contact form."
      />

      <nav aria-label="Filter messages" className="mt-6 flex flex-wrap gap-2">
        {FILTERS.map((filter) => {
          const isActive = active === filter.value;
          return (
            <Link
              key={filter.label}
              href={
                filter.value
                  ? `/admin/messages?status=${filter.value}`
                  : "/admin/messages"
              }
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "rounded-pill text-small inline-flex min-h-[40px] items-center px-4 font-semibold transition-colors",
                isActive
                  ? "bg-blue-strong text-white"
                  : "border-border text-navy hover:bg-cloud border bg-white",
              )}
            >
              {filter.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-6">
        {messages.length === 0 ? (
          <EmptyState
            title="No messages here"
            description={
              active
                ? "Nothing with this status yet."
                : "When someone uses the contact form, their message appears here."
            }
          />
        ) : (
          <Card className="p-0 sm:p-0">
            <ul className="divide-border divide-y">
              {messages.map((message) => (
                <MessageRow
                  key={message.id}
                  message={message}
                  whatsappNumber={settings?.whatsappNumber ?? null}
                />
              ))}
            </ul>
          </Card>
        )}
      </div>
    </>
  );
}
