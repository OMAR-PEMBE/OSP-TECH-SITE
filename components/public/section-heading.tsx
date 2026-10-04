import { cn } from "@/lib/utils/cn";

/**
 * The heading block every home section uses: an uppercase label, one display
 * headline, and an optional lead paragraph.
 *
 * One strong headline per section is a brand rule, not a preference
 * (UI-UX.md 3.2), so this component only ever renders one — there is no slot
 * for a second display line.
 */
export function SectionHeading({
  label,
  title,
  lead,
  ground = "light",
  className,
  as: Tag = "h2",
}: {
  label: string;
  title: string;
  lead?: string;
  ground?: "light" | "dark";
  className?: string;
  as?: "h1" | "h2";
}) {
  const dark = ground === "dark";

  return (
    <div className={cn("max-w-[44rem]", className)}>
      <p
        className={cn(
          "text-label uppercase",
          /* Teal is 7.4:1 on navy, but only decorative on white — so on a
             light ground this label takes Blue-Strong (UI-UX.md 2.3). */
          dark ? "text-teal" : "text-blue-strong",
        )}
      >
        {label}
      </p>
      <Tag
        className={cn(
          "text-display-l font-display mt-3 text-balance italic",
          dark ? "text-white" : "text-navy",
        )}
      >
        {title}
      </Tag>
      {lead && (
        <p
          className={cn(
            "text-body-lg mt-4",
            dark ? "text-cloud" : "text-slate",
          )}
        >
          {lead}
        </p>
      )}
    </div>
  );
}
