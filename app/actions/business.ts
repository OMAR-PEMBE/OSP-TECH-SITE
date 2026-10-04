"use server";

import { revalidatePath } from "next/cache";
import {
  clientSchema,
  expenseCategorySchema,
  expenseSchema,
  incomeSchema,
  projectSchema,
  projectStatusSchema,
  projectTaskSchema,
  reminderSchema,
} from "@/lib/validation/business";
import { dbError, err, fieldErrors, ok, withOwner } from "@/lib/admin/crud";
import { tzsForDb } from "@/lib/format";
import { nextOccurrence } from "@/lib/business/recurrence";
import type { ActionResult } from "@/lib/types/action";

/**
 * Clients, projects, reminders and finance mutations (API.md 4.3-4.6).
 *
 * None of this data is public, so none of it revalidates a public route — the
 * only paths refreshed are admin ones. Every action goes through `withOwner`,
 * and RLS refuses the write underneath if that check were ever wrong.
 */

function toObject(formData: FormData): Record<string, unknown> {
  return Object.fromEntries(formData.entries());
}

/* ------------------------------------------------------------------ clients */

export async function saveClient(
  id: string | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  return withOwner(async ({ supabase }) => {
    const parsed = clientSchema.safeParse(toObject(formData));
    if (!parsed.success) {
      return err(
        "VALIDATION",
        "Please check the highlighted fields.",
        fieldErrors(parsed.error),
      );
    }

    const query = id
      ? supabase.from("clients").update(parsed.data).eq("id", id).select("id")
      : supabase.from("clients").insert(parsed.data).select("id");

    const { data, error } = await query.maybeSingle();
    if (error) return dbError(error);
    if (!data) return err("NOT_FOUND", "That client no longer exists.");

    revalidatePath("/admin/clients");
    return ok({ id: data.id });
  });
}

export async function deleteClient(id: string): Promise<ActionResult<null>> {
  return withOwner(async ({ supabase }) => {
    /* Projects and income reference clients with `on delete set null`, so
       removing a client never destroys the financial record of what they
       paid — it only detaches the name. */
    const { error } = await supabase.from("clients").delete().eq("id", id);
    if (error) return dbError(error);
    revalidatePath("/admin/clients");
    revalidatePath("/admin/projects");
    return ok(null);
  });
}

/* ----------------------------------------------------------------- projects */

export async function saveProject(
  id: string | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  return withOwner(async ({ supabase }) => {
    const parsed = projectSchema.safeParse(toObject(formData));
    if (!parsed.success) {
      return err(
        "VALIDATION",
        "Please check the highlighted fields.",
        fieldErrors(parsed.error),
      );
    }

    const values = { ...parsed.data, price: tzsForDb(parsed.data.price) };

    const query = id
      ? supabase.from("projects").update(values).eq("id", id).select("id")
      : supabase.from("projects").insert(values).select("id");

    const { data, error } = await query.maybeSingle();
    if (error) return dbError(error);
    if (!data) return err("NOT_FOUND", "That project no longer exists.");

    revalidatePath("/admin/projects");
    revalidatePath("/admin");
    return ok({ id: data.id });
  });
}

/** Used by the kanban drag (API.md 4.4). */
export async function moveProjectStatus(
  id: string,
  status: string,
): Promise<ActionResult<null>> {
  return withOwner(async ({ supabase }) => {
    const parsed = projectStatusSchema.safeParse(status);
    if (!parsed.success) return err("VALIDATION", "Unknown status.");

    const { error } = await supabase
      .from("projects")
      .update({ status: parsed.data })
      .eq("id", id);

    if (error) return dbError(error);
    revalidatePath("/admin/projects");
    revalidatePath("/admin");
    return ok(null);
  });
}

export async function archiveProject(
  id: string,
  archived: boolean,
): Promise<ActionResult<null>> {
  return withOwner(async ({ supabase }) => {
    const { error } = await supabase
      .from("projects")
      .update({ archived })
      .eq("id", id);
    if (error) return dbError(error);
    revalidatePath("/admin/projects");
    return ok(null);
  });
}

export async function deleteProject(id: string): Promise<ActionResult<null>> {
  return withOwner(async ({ supabase }) => {
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) return dbError(error);
    revalidatePath("/admin/projects");
    revalidatePath("/admin");
    return ok(null);
  });
}

/* ------------------------------------------------------------ project tasks */

export async function addTask(
  projectId: string,
  formData: FormData,
): Promise<ActionResult<null>> {
  return withOwner(async ({ supabase }) => {
    const parsed = projectTaskSchema.safeParse({
      title: formData.get("title") ?? "",
    });
    if (!parsed.success) {
      return err(
        "VALIDATION",
        "Give the task a title.",
        fieldErrors(parsed.error),
      );
    }

    /* Append at the end: read the current maximum rather than counting rows,
       so a deleted task does not cause two tasks to share a sort order. */
    const { data: last } = await supabase
      .from("project_tasks")
      .select("sort_order")
      .eq("project_id", projectId)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { error } = await supabase.from("project_tasks").insert({
      project_id: projectId,
      title: parsed.data.title,
      sort_order: (last?.sort_order ?? -1) + 1,
    });

    if (error) return dbError(error);
    revalidatePath(`/admin/projects/${projectId}`);
    revalidatePath("/admin/projects");
    return ok(null);
  });
}

export async function toggleTask(
  taskId: string,
  done: boolean,
): Promise<ActionResult<null>> {
  return withOwner(async ({ supabase }) => {
    const { data, error } = await supabase
      .from("project_tasks")
      .update({ done })
      .eq("id", taskId)
      .select("project_id")
      .maybeSingle();

    if (error) return dbError(error);
    if (data?.project_id) {
      revalidatePath(`/admin/projects/${data.project_id}`);
      revalidatePath("/admin/projects");
    }
    return ok(null);
  });
}

export async function deleteTask(taskId: string): Promise<ActionResult<null>> {
  return withOwner(async ({ supabase }) => {
    const { data } = await supabase
      .from("project_tasks")
      .select("project_id")
      .eq("id", taskId)
      .maybeSingle();

    const { error } = await supabase
      .from("project_tasks")
      .delete()
      .eq("id", taskId);

    if (error) return dbError(error);
    if (data?.project_id) {
      revalidatePath(`/admin/projects/${data.project_id}`);
      revalidatePath("/admin/projects");
    }
    return ok(null);
  });
}

/* ---------------------------------------------------------------- reminders */

export async function saveReminder(
  id: string | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  return withOwner(async ({ supabase }) => {
    const raw = toObject(formData);
    const parsed = reminderSchema.safeParse({
      ...raw,
      notify_email: formData.get("notify_email") === "on",
    });

    if (!parsed.success) {
      return err(
        "VALIDATION",
        "Please check the highlighted fields.",
        fieldErrors(parsed.error),
      );
    }

    const query = id
      ? supabase.from("reminders").update(parsed.data).eq("id", id).select("id")
      : supabase.from("reminders").insert(parsed.data).select("id");

    const { data, error } = await query.maybeSingle();
    if (error) return dbError(error);
    if (!data) return err("NOT_FOUND", "That reminder no longer exists.");

    revalidatePath("/admin/reminders");
    revalidatePath("/admin");
    return ok({ id: data.id });
  });
}

/**
 * Marks a reminder done (FR-A10).
 *
 * A repeating reminder does not simply close: the next occurrence is created
 * so the series continues. Without this, "every month" would fire once and
 * then be gone, which is the opposite of what the owner asked for.
 */
export async function completeReminder(
  id: string,
): Promise<ActionResult<null>> {
  return withOwner(async ({ supabase }) => {
    const { data: reminder } = await supabase
      .from("reminders")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (!reminder) return err("NOT_FOUND", "That reminder no longer exists.");

    const { error } = await supabase
      .from("reminders")
      .update({ done: true })
      .eq("id", id);

    if (error) return dbError(error);

    if (reminder.repeat_rule !== "none") {
      const next = nextOccurrence(reminder.due_at, reminder.repeat_rule);
      const { error: repeatError } = await supabase.from("reminders").insert({
        title: reminder.title,
        description: reminder.description,
        due_at: next,
        repeat_rule: reminder.repeat_rule,
        project_id: reminder.project_id,
        client_id: reminder.client_id,
        notify_email: reminder.notify_email,
      });

      /* The completion already succeeded. If creating the next occurrence
         fails, say so rather than silently ending the series. */
      if (repeatError) {
        console.error("failed to create next occurrence", repeatError);
        return err(
          "SERVER_ERROR",
          "Marked done, but the next repeat could not be created. Please add it manually.",
        );
      }
    }

    revalidatePath("/admin/reminders");
    revalidatePath("/admin");
    return ok(null);
  });
}

export async function reopenReminder(id: string): Promise<ActionResult<null>> {
  return withOwner(async ({ supabase }) => {
    const { error } = await supabase
      .from("reminders")
      .update({ done: false })
      .eq("id", id);
    if (error) return dbError(error);
    revalidatePath("/admin/reminders");
    return ok(null);
  });
}

export async function deleteReminder(id: string): Promise<ActionResult<null>> {
  return withOwner(async ({ supabase }) => {
    const { error } = await supabase.from("reminders").delete().eq("id", id);
    if (error) return dbError(error);
    revalidatePath("/admin/reminders");
    revalidatePath("/admin");
    return ok(null);
  });
}

/* ------------------------------------------------------------------ finance */

export async function saveIncome(
  id: string | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  return withOwner(async ({ supabase }) => {
    const parsed = incomeSchema.safeParse(toObject(formData));
    if (!parsed.success) {
      return err(
        "VALIDATION",
        "Please check the highlighted fields.",
        fieldErrors(parsed.error),
      );
    }

    const values = { ...parsed.data, amount: tzsForDb(parsed.data.amount) };

    const query = id
      ? supabase.from("income").update(values).eq("id", id).select("id")
      : supabase.from("income").insert(values).select("id");

    const { data, error } = await query.maybeSingle();
    if (error) return dbError(error);
    if (!data) return err("NOT_FOUND", "That entry no longer exists.");

    revalidatePath("/admin/finance");
    revalidatePath("/admin/projects");
    revalidatePath("/admin");
    return ok({ id: data.id });
  });
}

export async function deleteIncome(id: string): Promise<ActionResult<null>> {
  return withOwner(async ({ supabase }) => {
    const { error } = await supabase.from("income").delete().eq("id", id);
    if (error) return dbError(error);
    revalidatePath("/admin/finance");
    revalidatePath("/admin/projects");
    revalidatePath("/admin");
    return ok(null);
  });
}

export async function saveExpense(
  id: string | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  return withOwner(async ({ supabase }) => {
    const parsed = expenseSchema.safeParse(toObject(formData));
    if (!parsed.success) {
      return err(
        "VALIDATION",
        "Please check the highlighted fields.",
        fieldErrors(parsed.error),
      );
    }

    const values = { ...parsed.data, amount: tzsForDb(parsed.data.amount) };

    const query = id
      ? supabase.from("expenses").update(values).eq("id", id).select("id")
      : supabase.from("expenses").insert(values).select("id");

    const { data, error } = await query.maybeSingle();
    if (error) return dbError(error);
    if (!data) return err("NOT_FOUND", "That entry no longer exists.");

    revalidatePath("/admin/finance");
    revalidatePath("/admin");
    return ok({ id: data.id });
  });
}

export async function deleteExpense(id: string): Promise<ActionResult<null>> {
  return withOwner(async ({ supabase }) => {
    const { error } = await supabase.from("expenses").delete().eq("id", id);
    if (error) return dbError(error);
    revalidatePath("/admin/finance");
    revalidatePath("/admin");
    return ok(null);
  });
}

export async function saveExpenseCategory(
  id: string | null,
  formData: FormData,
): Promise<ActionResult<null>> {
  return withOwner(async ({ supabase }) => {
    const parsed = expenseCategorySchema.safeParse(toObject(formData));
    if (!parsed.success) {
      return err(
        "VALIDATION",
        "Please check the highlighted fields.",
        fieldErrors(parsed.error),
      );
    }

    const query = id
      ? supabase.from("expense_categories").update(parsed.data).eq("id", id)
      : supabase.from("expense_categories").insert(parsed.data);

    const { error } = await query;
    if (error) return dbError(error);

    revalidatePath("/admin/finance");
    return ok(null);
  });
}

export async function deleteExpenseCategory(
  id: string,
): Promise<ActionResult<null>> {
  return withOwner(async ({ supabase }) => {
    /* Expenses reference categories with `on delete set null`, so the
       spending history survives; only the label is removed. */
    const { error } = await supabase
      .from("expense_categories")
      .delete()
      .eq("id", id);
    if (error) return dbError(error);
    revalidatePath("/admin/finance");
    return ok(null);
  });
}
