/**
 * Recurrence maths for repeating reminders and expenses.
 *
 * A plain module, not part of the actions file: everything exported from a
 * `"use server"` file must be an async Server Action, and this is a pure
 * function the server calls internally.
 */

/**
 * The next due date for a repeating item.
 *
 * Month arithmetic is clamped. `setMonth` on 31 January rolls forward into
 * March, so "every month" on the 31st would skip February entirely; pinning
 * to the last valid day of the target month keeps the series monthly.
 */
export function nextOccurrence(dueAt: string, rule: string): string {
  const date = new Date(dueAt);

  if (rule === "daily") {
    date.setDate(date.getDate() + 1);
    return date.toISOString();
  }

  if (rule === "weekly") {
    date.setDate(date.getDate() + 7);
    return date.toISOString();
  }

  if (rule === "monthly") {
    const day = date.getDate();
    /* Move to the 1st first, so adding a month cannot overflow. */
    date.setDate(1);
    date.setMonth(date.getMonth() + 1);
    const lastDay = new Date(
      date.getFullYear(),
      date.getMonth() + 1,
      0,
    ).getDate();
    date.setDate(Math.min(day, lastDay));
    return date.toISOString();
  }

  return date.toISOString();
}
