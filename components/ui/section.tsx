import { cn } from "@/lib/utils/cn";
import { Container } from "@/components/ui/container";

/**
 * A page section on one of the three brand grounds (UI-UX.md §6: alternate
 * white and Cloud for rhythm; navy for the hero, CTA band and footer).
 *
 * `navy` applies `.surface-navy`, which also flips the focus-ring colour to
 * teal so interactive children stay AA-visible on the dark ground.
 */
export type SectionGround = "white" | "cloud" | "navy";

const GROUND: Record<SectionGround, string> = {
  white: "bg-white text-navy",
  cloud: "bg-cloud text-navy",
  navy: "surface-navy",
};

export function Section({
  ground = "white",
  as: Tag = "section",
  bleed = false,
  className,
  containerClassName,
  children,
  ...props
}: {
  ground?: SectionGround;
  as?: "section" | "header" | "footer" | "div";
  /** Skip the Container — for sections that lay out their own full-bleed grid. */
  bleed?: boolean;
  className?: string;
  containerClassName?: string;
  children: React.ReactNode;
} & Omit<React.ComponentPropsWithoutRef<"section">, "className" | "children">) {
  return (
    <Tag
      className={cn(
        /* `isolate` + `overflow-clip` is what lets a <Slash> bleed off the
           edge and be cut by the section rather than the viewport. */
        "relative isolate overflow-clip",
        GROUND[ground],
        className,
      )}
      {...props}
    >
      {bleed ? (
        children
      ) : (
        <Container className={containerClassName}>{children}</Container>
      )}
    </Tag>
  );
}
