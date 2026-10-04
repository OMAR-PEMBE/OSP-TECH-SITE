"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/admin/card";
import { formatTzs } from "@/lib/format";
import { BRAND_HEX } from "@/lib/brand/tokens";
import type { FinanceSummary } from "@/lib/db/business";

/**
 * Finance charts (FR-A14, UI-UX.md 7).
 *
 * Series are blue, teal, slate and amber from the brand tokens, read from CSS
 * at runtime so the charts cannot drift from the palette.
 *
 * Every series is labelled and every value is also in the tables on the
 * Finance page, so nothing here depends on colour alone (WCAG 1.4.1) and a
 * screen-reader user is never asked to interpret a picture — the charts are
 * `aria-hidden` and the data is reachable as text.
 *
 * Amounts arrive as strings of whole shillings and are converted to Number
 * only here, for plotting. A chart pixel cannot represent more precision than
 * a double anyway; the authoritative totals stay exact everywhere else.
 */

/**
 * Formats a tooltip value.
 *
 * Recharts types the value loosely (it can be a number, a string, an array or
 * undefined depending on the chart), so this narrows before formatting rather
 * than asserting a type the library does not promise.
 */
function tooltipTzs(value: unknown): string {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? formatTzs(Math.round(n)) : "—";
}

/** Reads a brand token so chart colours follow globals.css. */
function token(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  return (
    getComputedStyle(document.documentElement)
      .getPropertyValue(`--color-${name}`)
      .trim() || fallback
  );
}

export function FinanceCharts({ summary }: { summary: FinanceSummary }) {
  const blue = token("blue", BRAND_HEX.blue);
  const teal = token("teal", BRAND_HEX.teal);
  const slate = token("slate", BRAND_HEX.slate);
  const warning = token("warning", BRAND_HEX.warning);
  const border = token("border", BRAND_HEX.border);

  const monthly = summary.monthly.map((m) => ({
    month: new Date(m.month).toLocaleDateString("en-GB", {
      month: "short",
      year: "2-digit",
    }),
    Income: Number(m.income),
    Expenses: Number(m.expenses),
  }));

  const byCategory = summary.byCategory.slice(0, 6).map((c) => ({
    name: c.name,
    value: Number(c.total),
  }));

  const pieColours = [
    blue,
    teal,
    slate,
    warning,
    BRAND_HEX.blueStrong,
    BRAND_HEX.success,
  ];

  const axisTick = { fill: slate, fontSize: 12 };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <h2 className="text-h3 text-navy font-semibold">
          Income vs expenses, last 12 months
        </h2>

        {/* `inert`, not `aria-hidden`: Recharts renders focusable SVG nodes,
            and aria-hidden would hide them from assistive tech while leaving
            them in the tab order. `inert` removes both. The same figures are
            in the table below. */}
        <div className="mt-4 h-72" inert>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthly}>
              <CartesianGrid stroke={border} vertical={false} />
              <XAxis dataKey="month" tick={axisTick} tickLine={false} />
              <YAxis
                tick={axisTick}
                tickLine={false}
                width={70}
                tickFormatter={(v: number) =>
                  v >= 1_000_000
                    ? `${(v / 1_000_000).toFixed(1)}M`
                    : `${Math.round(v / 1000)}k`
                }
              />
              <Tooltip
                formatter={(value) => tooltipTzs(value)}
                contentStyle={{ borderRadius: 14, borderColor: border }}
              />
              <Legend />
              <Bar dataKey="Income" fill={blue} radius={[4, 4, 0, 0]} />
              <Bar dataKey="Expenses" fill={teal} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* The same data as text, so the chart is never the only source. */}
        <details className="mt-3">
          <summary className="text-small text-blue-strong cursor-pointer font-semibold">
            View these figures as a table
          </summary>
          <table className="mt-3 w-full text-left">
            <thead>
              <tr>
                <th
                  scope="col"
                  className="text-label text-slate py-1 uppercase"
                >
                  Month
                </th>
                <th
                  scope="col"
                  className="text-label text-slate py-1 uppercase"
                >
                  Income
                </th>
                <th
                  scope="col"
                  className="text-label text-slate py-1 uppercase"
                >
                  Expenses
                </th>
              </tr>
            </thead>
            <tbody>
              {summary.monthly.map((m) => (
                <tr key={m.month}>
                  <td className="text-small text-navy py-1">
                    {new Date(m.month).toLocaleDateString("en-GB", {
                      month: "long",
                      year: "numeric",
                    })}
                  </td>
                  <td className="text-small text-navy py-1 tabular-nums">
                    {formatTzs(BigInt(m.income))}
                  </td>
                  <td className="text-small text-navy py-1 tabular-nums">
                    {formatTzs(BigInt(m.expenses))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </Card>

      <Card>
        <h2 className="text-h3 text-navy font-semibold">
          Spending by category
        </h2>

        {byCategory.length === 0 ? (
          <p className="text-small text-slate mt-4">
            No expenses in this period.
          </p>
        ) : (
          <>
            {/* `inert`, not `aria-hidden`: Recharts renders focusable SVG nodes,
            and aria-hidden would hide them from assistive tech while leaving
            them in the tab order. `inert` removes both. The same figures are
            in the table below. */}
            <div className="mt-4 h-72" inert>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={byCategory}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                  >
                    {byCategory.map((entry, i) => (
                      <Cell
                        key={entry.name}
                        fill={pieColours[i % pieColours.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => tooltipTzs(value)}
                    contentStyle={{ borderRadius: 14, borderColor: border }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <ul className="divide-border mt-3 divide-y">
              {summary.byCategory.map((c, i) => (
                <li
                  key={c.name}
                  className="flex items-center justify-between gap-3 py-2"
                >
                  <span className="text-small text-navy flex items-center gap-2">
                    <span
                      aria-hidden="true"
                      className="size-3 shrink-0 rounded-full"
                      style={{
                        backgroundColor: pieColours[i % pieColours.length],
                      }}
                    />
                    {c.name}
                  </span>
                  <span className="text-small text-navy font-semibold tabular-nums">
                    {formatTzs(BigInt(c.total))}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>
    </div>
  );
}
