import "server-only";

import { createClient } from "@/lib/supabase/server";
import { addDays, darStartOfDay, toDarDateInput } from "@/lib/format";

/**
 * Clients, projects, reminders and finance reads (API.md 4.3-4.6).
 *
 * All of this is owner-only data. Every query runs as the signed-in user, so
 * RLS decides what comes back; a non-owner gets nothing from the database
 * regardless of what this code asks for.
 *
 * Money crosses this boundary as a string of whole shillings, never a number.
 * `bigint` is not JSON-serialisable so it cannot pass through a Server
 * Component boundary, and `Number` would start losing shillings above 2^53.
 * `lib/format` turns the string into something readable at the very end.
 */

/* ------------------------------------------------------------------ clients */

export type Client = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  businessName: string | null;
  notes: string | null;
};

export async function listClients(search?: string): Promise<Client[]> {
  const supabase = await createClient();

  let query = supabase.from("clients").select("*").order("name");

  /* The term is interpolated into a PostgREST filter string, where `,` `(`
     `)` `"` `\` are syntax and `%` `_` `*` are wildcards. Escaping only the
     wildcards would still let a comma or parenthesis start a new filter
     clause. None of those characters matters for finding a client by name,
     business or phone, so they are replaced with spaces rather than escaped
     through two layers (PostgREST quoting, then LIKE). */
  const term = search
    ?.replace(/[,()"\\%_*:]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (term) {
    query = query.or(
      `name.ilike.%${term}%,business_name.ilike.%${term}%,phone.ilike.%${term}%`,
    );
  }

  const { data, error } = await query;
  if (error) throw new Error(`listClients: ${error.message}`);

  return (data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    phone: r.phone,
    email: r.email,
    businessName: r.business_name,
    notes: r.notes,
  }));
}

export async function getClient(id: string): Promise<Client | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!data) return null;
  return {
    id: data.id,
    name: data.name,
    phone: data.phone,
    email: data.email,
    businessName: data.business_name,
    notes: data.notes,
  };
}

/* ----------------------------------------------------------------- projects */

export type ProjectTask = {
  id: string;
  title: string;
  done: boolean;
  sortOrder: number;
};

export type Project = {
  id: string;
  name: string;
  clientId: string | null;
  clientName: string | null;
  type: string;
  description: string | null;
  /** Whole TZS, as a string. */
  price: string;
  startDate: string | null;
  deadline: string | null;
  status: string;
  notes: string | null;
  archived: boolean;
  /** Sum of linked income, whole TZS as a string (database.md 4.8). */
  amountPaid: string;
  tasksTotal: number;
  tasksDone: number;
  /** 0-100, from the task checklist. 0 when there are no tasks. */
  progress: number;
  /** Past its deadline and not finished. */
  overdue: boolean;
};

type ProjectRow = {
  id: string;
  name: string;
  client_id: string | null;
  type: string;
  description: string | null;
  price: number | string;
  start_date: string | null;
  deadline: string | null;
  status: string;
  notes: string | null;
  archived: boolean;
  clients?: { name: string } | null;
  project_tasks?: { id: string; done: boolean }[];
};

function isOverdue(deadline: string | null, status: string): boolean {
  if (!deadline) return false;
  if (status === "completed" || status === "cancelled") return false;
  /* Date-only comparison: a project due today is not overdue until tomorrow.
     "Today" in Dar es Salaam — the UTC date is yesterday until 03:00 EAT. */
  const today = toDarDateInput();
  return deadline < today;
}

function mapProject(row: ProjectRow, paidByProject: Map<string, bigint>) {
  const tasks = row.project_tasks ?? [];
  const tasksDone = tasks.filter((t) => t.done).length;

  return {
    id: row.id,
    name: row.name,
    clientId: row.client_id,
    clientName: row.clients?.name ?? null,
    type: row.type,
    description: row.description,
    price: String(row.price ?? 0),
    startDate: row.start_date,
    deadline: row.deadline,
    status: row.status,
    notes: row.notes,
    archived: row.archived,
    amountPaid: (paidByProject.get(row.id) ?? 0n).toString(),
    tasksTotal: tasks.length,
    tasksDone,
    progress:
      tasks.length === 0 ? 0 : Math.round((tasksDone / tasks.length) * 100),
    overdue: isOverdue(row.deadline, row.status),
  };
}

/**
 * Sums income per project.
 *
 * Done in one query and folded in memory rather than a correlated subquery
 * per project: the board shows every active project at once, and N+1 round
 * trips to Supabase is the slowest thing an admin page can do.
 */
async function paidByProjectMap(): Promise<Map<string, bigint>> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("income")
    .select("project_id, amount")
    .not("project_id", "is", null);

  const map = new Map<string, bigint>();
  for (const row of data ?? []) {
    if (!row.project_id) continue;
    map.set(
      row.project_id,
      (map.get(row.project_id) ?? 0n) + BigInt(row.amount ?? 0),
    );
  }
  return map;
}

export async function listProjects({
  includeArchived = false,
}: { includeArchived?: boolean } = {}): Promise<Project[]> {
  const supabase = await createClient();

  let query = supabase
    .from("projects")
    .select("*, clients(name), project_tasks(id, done)")
    .order("deadline", { ascending: true, nullsFirst: false });

  if (!includeArchived) query = query.eq("archived", false);

  const [{ data, error }, paid] = await Promise.all([
    query,
    paidByProjectMap(),
  ]);

  if (error) throw new Error(`listProjects: ${error.message}`);
  return (data ?? []).map((row) => mapProject(row as ProjectRow, paid));
}

export async function getProject(id: string): Promise<Project | null> {
  const supabase = await createClient();

  const [{ data }, paid] = await Promise.all([
    supabase
      .from("projects")
      .select("*, clients(name), project_tasks(id, done)")
      .eq("id", id)
      .maybeSingle(),
    paidByProjectMap(),
  ]);

  return data ? mapProject(data as ProjectRow, paid) : null;
}

export async function listProjectTasks(
  projectId: string,
): Promise<ProjectTask[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("project_tasks")
    .select("*")
    .eq("project_id", projectId)
    .order("sort_order");

  return (data ?? []).map((r) => ({
    id: r.id,
    title: r.title,
    done: r.done,
    sortOrder: r.sort_order,
  }));
}

/* ---------------------------------------------------------------- reminders */

export type Reminder = {
  id: string;
  title: string;
  description: string | null;
  dueAt: string;
  repeatRule: string;
  projectId: string | null;
  projectName: string | null;
  clientId: string | null;
  clientName: string | null;
  done: boolean;
  notifyEmail: boolean;
};

export type ReminderBucket = "overdue" | "today" | "week" | "later" | "done";

/**
 * Which bucket a reminder belongs in (FR-A10).
 *
 * Computed here rather than in SQL so the boundaries follow the viewer's day,
 * not UTC — "today" has to mean today in Dar es Salaam.
 */
export function bucketFor(dueAt: string, done: boolean): ReminderBucket {
  if (done) return "done";

  const due = new Date(dueAt);
  const now = new Date();

  /* Day boundaries on the Dar es Salaam calendar. `setHours` would use the
     server's zone — UTC on Vercel — and call 01:00 tomorrow "today". */
  const today = toDarDateInput(now);
  const startOfTomorrow = darStartOfDay(addDays(today, 1));
  const startOfWeekAfter = darStartOfDay(addDays(today, 8));

  if (due < now) return "overdue";
  if (due < startOfTomorrow) return "today";
  if (due < startOfWeekAfter) return "week";
  return "later";
}

export async function listReminders(): Promise<Reminder[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reminders")
    .select("*, projects(name), clients(name)")
    .order("due_at", { ascending: true });

  if (error) throw new Error(`listReminders: ${error.message}`);

  return (data ?? []).map((r) => {
    const row = r as typeof r & {
      projects?: { name: string } | null;
      clients?: { name: string } | null;
    };
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      dueAt: row.due_at,
      repeatRule: row.repeat_rule,
      projectId: row.project_id,
      projectName: row.projects?.name ?? null,
      clientId: row.client_id,
      clientName: row.clients?.name ?? null,
      done: row.done,
      notifyEmail: row.notify_email,
    };
  });
}

export async function getReminder(id: string): Promise<Reminder | null> {
  const all = await listReminders();
  return all.find((r) => r.id === id) ?? null;
}

/* ------------------------------------------------------------------ finance */

export type IncomeEntry = {
  id: string;
  date: string;
  amount: string;
  clientId: string | null;
  clientName: string | null;
  projectId: string | null;
  projectName: string | null;
  method: string;
  reference: string | null;
  category: string | null;
  notes: string | null;
};

export type ExpenseEntry = {
  id: string;
  date: string;
  amount: string;
  categoryId: string | null;
  categoryName: string | null;
  method: string;
  description: string | null;
  receiptUrl: string | null;
  recurring: string;
};

/** Payment methods, as the database enum defines them. */
export const PAYMENT_METHODS = [
  "mpesa",
  "mixx_tigo",
  "airtel_money",
  "halopesa",
  "bank",
  "cash",
  "other",
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

/** Narrows a query-string value to a real payment method, or undefined. */
export function toPaymentMethod(value?: string): PaymentMethod | undefined {
  return PAYMENT_METHODS.includes(value as PaymentMethod)
    ? (value as PaymentMethod)
    : undefined;
}

export type FinanceFilters = {
  from?: string;
  to?: string;
  projectId?: string;
  categoryId?: string;
  /** Already narrowed — a hand-typed query string cannot reach the query. */
  method?: PaymentMethod;
};

export async function listIncome(
  filters: FinanceFilters = {},
): Promise<IncomeEntry[]> {
  const supabase = await createClient();

  let query = supabase
    .from("income")
    .select("*, clients(name), projects(name)")
    .order("date", { ascending: false });

  if (filters.from) query = query.gte("date", filters.from);
  if (filters.to) query = query.lte("date", filters.to);
  if (filters.projectId) query = query.eq("project_id", filters.projectId);
  if (filters.method) query = query.eq("method", filters.method);

  const { data, error } = await query;
  if (error) throw new Error(`listIncome: ${error.message}`);

  return (data ?? []).map((r) => {
    const row = r as typeof r & {
      clients?: { name: string } | null;
      projects?: { name: string } | null;
    };
    return {
      id: row.id,
      date: row.date,
      amount: String(row.amount),
      clientId: row.client_id,
      clientName: row.clients?.name ?? null,
      projectId: row.project_id,
      projectName: row.projects?.name ?? null,
      method: row.method,
      reference: row.reference,
      category: row.category,
      notes: row.notes,
    };
  });
}

export async function listExpenses(
  filters: FinanceFilters = {},
): Promise<ExpenseEntry[]> {
  const supabase = await createClient();

  let query = supabase
    .from("expenses")
    .select("*, expense_categories(name)")
    .order("date", { ascending: false });

  if (filters.from) query = query.gte("date", filters.from);
  if (filters.to) query = query.lte("date", filters.to);
  if (filters.categoryId) query = query.eq("category_id", filters.categoryId);
  if (filters.method) query = query.eq("method", filters.method);

  const { data, error } = await query;
  if (error) throw new Error(`listExpenses: ${error.message}`);

  return (data ?? []).map((r) => {
    const row = r as typeof r & {
      expense_categories?: { name: string } | null;
    };
    return {
      id: row.id,
      date: row.date,
      amount: String(row.amount),
      categoryId: row.category_id,
      categoryName: row.expense_categories?.name ?? null,
      method: row.method,
      description: row.description,
      receiptUrl: row.receipt_url,
      recurring: row.recurring,
    };
  });
}

export type ExpenseCategory = { id: string; name: string; sortOrder: number };

export async function listExpenseCategories(): Promise<ExpenseCategory[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("expense_categories")
    .select("*")
    .order("sort_order");

  return (data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    sortOrder: r.sort_order,
  }));
}

export type FinanceSummary = {
  incomeTotal: string;
  expenseTotal: string;
  /** Can be negative, so this is a signed string. */
  profit: string;
  byCategory: { name: string; total: string }[];
  monthly: {
    month: string;
    income: string;
    expenses: string;
    profit: string;
  }[];
};

/**
 * Totals, by-category breakdown and a 12-month series (API.md 4.6).
 *
 * Sums are accumulated as BigInt so a large year of shillings stays exact,
 * then stringified at the boundary.
 */
export async function getFinanceSummary(
  filters: FinanceFilters = {},
): Promise<FinanceSummary> {
  const supabase = await createClient();

  const [income, expenses, monthlyResult] = await Promise.all([
    listIncome(filters),
    listExpenses(filters),
    supabase.from("v_monthly_finance").select("*"),
  ]);

  const incomeTotal = income.reduce((sum, r) => sum + BigInt(r.amount), 0n);
  const expenseTotal = expenses.reduce((sum, r) => sum + BigInt(r.amount), 0n);

  const categoryTotals = new Map<string, bigint>();
  for (const expense of expenses) {
    const key = expense.categoryName ?? "Uncategorised";
    categoryTotals.set(
      key,
      (categoryTotals.get(key) ?? 0n) + BigInt(expense.amount),
    );
  }

  const byCategory = [...categoryTotals.entries()]
    .map(([name, total]) => ({ name, total: total.toString() }))
    .sort((a, b) => (BigInt(b.total) > BigInt(a.total) ? 1 : -1));

  const monthly = (monthlyResult.data ?? []).map((row) => ({
    month: String(row.month),
    income: String(row.income_total ?? 0),
    expenses: String(row.expense_total ?? 0),
    profit: String(row.profit ?? 0),
  }));

  return {
    incomeTotal: incomeTotal.toString(),
    expenseTotal: expenseTotal.toString(),
    profit: (incomeTotal - expenseTotal).toString(),
    byCategory,
    monthly,
  };
}
