import { NextResponse, type NextRequest } from "next/server";
import { getOwnerSession } from "@/lib/auth/session";
import {
  getFinanceSummary,
  listExpenses,
  listIncome,
  toPaymentMethod,
} from "@/lib/db/business";
import { EXPORT_RULES, checkRateLimit } from "@/lib/rate-limit";
import { formatDate, formatTzs } from "@/lib/format";
import { PAYMENT_METHOD_LABELS } from "@/lib/validation/business";
import { BRAND_HEX } from "@/lib/brand/tokens";

/**
 * GET /api/finance/export?from&to&format=csv|pdf (API.md 5, FR-A15).
 *
 * Owner-only. This is a URL rather than a Server Action because a download
 * needs one: the browser has to navigate to it to get a file.
 *
 * Being a URL means it has to carry its own authorisation — middleware does
 * not protect `/api`, and a finance export is the single most sensitive thing
 * the product produces. The session and role are checked here explicitly, and
 * RLS refuses the rows underneath besides.
 */

export async function GET(request: NextRequest) {
  const session = await getOwnerSession();
  if (!session) {
    /* 404, not 401: there is no reason to confirm this endpoint exists to
       someone who cannot use it. */
    return new NextResponse("Not found", { status: 404 });
  }

  const { allowed, retryAfterSeconds } = await checkRateLimit(
    `export:${session.userId}`,
    EXPORT_RULES,
  );
  if (!allowed) {
    return new NextResponse("Too many exports. Please try again later.", {
      status: 429,
      headers: { "Retry-After": String(retryAfterSeconds) },
    });
  }

  const params = request.nextUrl.searchParams;
  const isDate = (v: string | null) =>
    v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined;

  const filters = {
    from: isDate(params.get("from")),
    to: isDate(params.get("to")),
    projectId: params.get("projectId") || undefined,
    categoryId: params.get("categoryId") || undefined,
    method: toPaymentMethod(params.get("method") ?? undefined),
  };

  const [income, expenses, summary] = await Promise.all([
    listIncome(filters),
    listExpenses(filters),
    getFinanceSummary(filters),
  ]);

  const format = params.get("format") === "pdf" ? "pdf" : "csv";
  const stamp = new Date().toISOString().slice(0, 10);
  const range =
    filters.from || filters.to
      ? `${filters.from ?? "start"}_to_${filters.to ?? stamp}`
      : "all-time";

  if (format === "csv") {
    const csv = buildCsv(income, expenses, summary);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        /* BOM so Excel opens UTF-8 correctly — without it, a shilling sign or
           an accented client name arrives mangled on Windows. */
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="osp-finance-${range}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  }

  const html = buildPrintableHtml(income, expenses, summary, filters);
  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

/** Escapes one CSV cell, per RFC 4180. */
function cell(value: string | null | undefined): string {
  const text = value ?? "";
  /* A leading =, +, - or @ is interpreted as a formula by Excel. Prefixing a
     single quote stops a client's note becoming an executable cell. */
  const guarded = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${guarded.replace(/"/g, '""')}"`;
}

function buildCsv(
  income: Awaited<ReturnType<typeof listIncome>>,
  expenses: Awaited<ReturnType<typeof listExpenses>>,
  summary: Awaited<ReturnType<typeof getFinanceSummary>>,
): string {
  const lines: string[] = [];

  lines.push("OSP Technologies — finance export");
  lines.push(`Generated,${cell(new Date().toISOString())}`);
  lines.push("");

  lines.push("Summary");
  lines.push(`Total income (TZS),${summary.incomeTotal}`);
  lines.push(`Total expenses (TZS),${summary.expenseTotal}`);
  lines.push(`Profit (TZS),${summary.profit}`);
  lines.push("");

  lines.push("Income");
  lines.push(
    "Date,Amount (TZS),Client,Project,Method,Reference,Category,Notes",
  );
  for (const e of income) {
    lines.push(
      [
        cell(e.date),
        e.amount,
        cell(e.clientName),
        cell(e.projectName),
        cell(
          PAYMENT_METHOD_LABELS[e.method as keyof typeof PAYMENT_METHOD_LABELS],
        ),
        cell(e.reference),
        cell(e.category),
        cell(e.notes),
      ].join(","),
    );
  }
  lines.push("");

  lines.push("Expenses");
  lines.push("Date,Amount (TZS),Category,Method,Description,Recurring");
  for (const e of expenses) {
    lines.push(
      [
        cell(e.date),
        e.amount,
        cell(e.categoryName),
        cell(
          PAYMENT_METHOD_LABELS[e.method as keyof typeof PAYMENT_METHOD_LABELS],
        ),
        cell(e.description),
        cell(e.recurring),
      ].join(","),
    );
  }

  /* UTF-8 BOM for Excel. */
  return `﻿${lines.join("\r\n")}`;
}

/**
 * A printable report.
 *
 * Served as HTML with a print stylesheet rather than a generated PDF binary.
 * A real PDF library (pdfkit, puppeteer) is tens of megabytes in a serverless
 * bundle and slow to cold-start, for a document the owner prints perhaps
 * monthly. The browser's own "Save as PDF" produces the same artifact from
 * this page, and it is already branded, paginated and selectable.
 *
 * Flagged in the handover as the one place a dedicated library would be a
 * genuine upgrade if exact PDF layout ever matters.
 */
function buildPrintableHtml(
  income: Awaited<ReturnType<typeof listIncome>>,
  expenses: Awaited<ReturnType<typeof listExpenses>>,
  summary: Awaited<ReturnType<typeof getFinanceSummary>>,
  filters: { from?: string; to?: string },
): string {
  /* Every value below comes from our own database, but it is still escaped:
     a client name is user-entered text and this is raw HTML. */
  const esc = (v: string | null | undefined) =>
    (v ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c] ?? c,
    );

  const period =
    filters.from || filters.to
      ? `${filters.from ? formatDate(filters.from) : "the beginning"} to ${
          filters.to ? formatDate(filters.to) : "today"
        }`
      : "All time";

  const incomeRows = income
    .map(
      (e) => `<tr>
        <td>${esc(formatDate(e.date))}</td>
        <td class="num">${esc(formatTzs(BigInt(e.amount)))}</td>
        <td>${esc(e.projectName ?? e.clientName ?? "—")}</td>
        <td>${esc(PAYMENT_METHOD_LABELS[e.method as keyof typeof PAYMENT_METHOD_LABELS])}</td>
        <td>${esc(e.reference ?? "—")}</td>
      </tr>`,
    )
    .join("");

  const expenseRows = expenses
    .map(
      (e) => `<tr>
        <td>${esc(formatDate(e.date))}</td>
        <td class="num">${esc(formatTzs(BigInt(e.amount)))}</td>
        <td>${esc(e.categoryName ?? "Uncategorised")}</td>
        <td>${esc(PAYMENT_METHOD_LABELS[e.method as keyof typeof PAYMENT_METHOD_LABELS])}</td>
        <td>${esc(e.description ?? "—")}</td>
      </tr>`,
    )
    .join("");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>OSP Tech — finance report</title>
<style>
  /* A standalone document, outside the app stylesheet, so the palette is
     restated here from the one sanctioned non-CSS mirror. */
  :root { --navy:${BRAND_HEX.navy}; --blue:${BRAND_HEX.blueStrong}; --slate:${BRAND_HEX.slate}; --cloud:${BRAND_HEX.cloud}; --border:${BRAND_HEX.border}; }
  * { box-sizing: border-box; }
  body { margin:0; padding:32px; font-family:Poppins,Arial,sans-serif; color:var(--navy); }
  h1 { font-size:28px; font-style:italic; font-weight:800; margin:0; }
  h2 { font-size:18px; margin:32px 0 8px; }
  .meta { color:var(--slate); font-size:13px; margin-top:4px; }
  .totals { display:flex; gap:16px; margin-top:24px; flex-wrap:wrap; }
  .total { border:1px solid var(--border); border-radius:14px; padding:12px 16px; min-width:180px; }
  .total span { display:block; font-size:11px; letter-spacing:.06em; text-transform:uppercase; color:var(--slate); }
  .total strong { font-size:20px; }
  table { width:100%; border-collapse:collapse; margin-top:8px; font-size:13px; }
  th { text-align:left; background:var(--cloud); color:var(--slate); font-size:11px;
       letter-spacing:.06em; text-transform:uppercase; padding:8px; }
  td { padding:8px; border-top:1px solid var(--border); }
  .num { text-align:right; font-variant-numeric:tabular-nums; white-space:nowrap; }
  .hint { margin-top:28px; padding:12px; background:var(--cloud); border-radius:14px;
          font-size:13px; color:var(--slate); }
  @media print { .hint { display:none; } body { padding:0; } }
</style>
</head>
<body>
  <h1>OSP Technologies</h1>
  <p class="meta">Finance report · ${esc(period)} · generated ${esc(formatDate(new Date()))}</p>

  <div class="totals">
    <div class="total"><span>Total income</span><strong>${esc(formatTzs(BigInt(summary.incomeTotal)))}</strong></div>
    <div class="total"><span>Total expenses</span><strong>${esc(formatTzs(BigInt(summary.expenseTotal)))}</strong></div>
    <div class="total"><span>Profit</span><strong>${esc(formatTzs(BigInt(summary.profit)))}</strong></div>
  </div>

  <h2>Income (${income.length})</h2>
  <table>
    <thead><tr><th>Date</th><th class="num">Amount</th><th>From</th><th>Method</th><th>Reference</th></tr></thead>
    <tbody>${incomeRows || '<tr><td colspan="5">No income in this period.</td></tr>'}</tbody>
  </table>

  <h2>Expenses (${expenses.length})</h2>
  <table>
    <thead><tr><th>Date</th><th class="num">Amount</th><th>Category</th><th>Method</th><th>Description</th></tr></thead>
    <tbody>${expenseRows || '<tr><td colspan="5">No expenses in this period.</td></tr>'}</tbody>
  </table>

  <p class="hint">Use your browser's Print command and choose “Save as PDF”.</p>
  <script>window.addEventListener("load", () => window.print());</script>
</body>
</html>`;
}
