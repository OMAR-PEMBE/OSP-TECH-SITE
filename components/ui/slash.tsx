import { cn } from "@/lib/utils/cn";

/**
 * The 60° slash — OSP's signature graphic (UI-UX.md §5, prd.md §4).
 *
 * Two or three parallelogram bars cut at 60°, in blue and teal, bleeding off
 * a bottom or right edge. **One per layout**, never a repeating pattern.
 * Fills come from the `--color-*` tokens, so there is no hex here.
 *
 * The geometry is generated rather than hand-drawn: `SHEAR` is tan(30°),
 * which is the horizontal offset that produces a true 60° cut on a vertical
 * bar, so the angle is correct by construction and cannot drift.
 */

/** tan(30°) — horizontal run per unit of height for a 60° edge. */
const SHEAR = Math.tan(Math.PI / 6);

const VB_W = 200;
const VB_H = 200;

type Bar = {
  /** Left edge of the bar at the viewBox bottom. */
  x: number;
  /** Bar thickness, measured horizontally. */
  width: number;
  fill: string;
  opacity?: number;
};

/**
 * One sheared bar, drawn from the bottom edge upward and allowed to run past
 * the viewBox so it bleeds off the section edge when clipped.
 */
function bar({ x, width, fill, opacity }: Bar) {
  const run = VB_H * SHEAR;
  const points = [
    `${x},${VB_H}`,
    `${x + width},${VB_H}`,
    `${x + width + run},0`,
    `${x + run},0`,
  ].join(" ");
  return { points, fill, opacity };
}

export type SlashProps = {
  /**
   * `blue-teal` (default) leads with blue and accents with teal, holding the
   * 60/30/10 ratio. `teal` is a single thin teal bar for light sections where
   * teal must stay a 10% accent.
   */
  tone?: "blue-teal" | "blue" | "teal";
  /** Three bars instead of two. Still one slash. */
  bars?: 2 | 3;
  /**
   * Mirror horizontally. The slash leans forward (bottom-left to top-right)
   * by default, matching the italic wordmark's forward lean.
   */
  flip?: boolean;
  className?: string;
};

export function Slash({
  tone = "blue-teal",
  bars = 2,
  flip = false,
  className,
}: SlashProps) {
  const palette =
    tone === "blue"
      ? ["var(--color-blue)", "var(--color-blue)"]
      : tone === "teal"
        ? ["var(--color-teal)", "var(--color-teal)"]
        : ["var(--color-blue)", "var(--color-teal)"];

  const shapes = [
    bar({ x: -40, width: 46, fill: palette[0] }),
    bar({ x: 20, width: 16, fill: palette[1] }),
    ...(bars === 3
      ? [bar({ x: 48, width: 8, fill: palette[0], opacity: 0.6 })]
      : []),
  ];

  return (
    <svg
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
      role="presentation"
      className={cn("pointer-events-none select-none", className)}
      style={flip ? { transform: "scaleX(-1)" } : undefined}
    >
      {shapes.map((s, i) => (
        <polygon
          key={i}
          points={s.points}
          fill={s.fill}
          opacity={s.opacity ?? 1}
        />
      ))}
    </svg>
  );
}
