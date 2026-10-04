"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/admin/form";
import type { ActionResult } from "@/lib/types/action";

/**
 * The shell every admin entity form uses.
 *
 * Owns the parts that are identical across Services, Products, Portfolio and
 * Posts: submit handling, pending state, per-field errors routed back to the
 * fields, a form-level error, and navigating away on success. The individual
 * forms supply only their fields.
 *
 * Field errors come back from the server action, which is also where they are
 * generated — so the messages a user sees are the ones the authoritative
 * validation produced, not a client-side approximation of them.
 */
export function EntityForm<T>({
  action,
  redirectTo,
  submitLabel,
  children,
  secondaryAction,
}: {
  action: (formData: FormData) => Promise<ActionResult<T>>;
  /** Where to go after a successful save. */
  redirectTo: string;
  submitLabel: string;
  /** Receives the current field errors so inputs can render their own. */
  children: (errors: Record<string, string>) => React.ReactNode;
  secondaryAction?: React.ReactNode;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setFormError(null);

    startTransition(async () => {
      const result = await action(formData);

      if (result.ok) {
        setErrors({});
        router.push(redirectTo);
        /* The list is a dynamic admin page, but refresh() makes the new row
           appear without waiting for a soft-navigation cache to expire. */
        router.refresh();
        return;
      }

      setErrors(result.error.fields ?? {});
      setFormError(result.error.message);

      /* Move focus to the first bad field, so a keyboard user is taken to the
         problem instead of being left at the bottom of the form. */
      const first = Object.keys(result.error.fields ?? {})[0];
      if (first) {
        document.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      }
    });
  }

  return (
    <form onSubmit={onSubmit} noValidate className="mt-6 flex flex-col gap-6">
      {children(errors)}

      <FormError message={formError} />

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : submitLabel}
        </Button>
        {secondaryAction}
      </div>
    </form>
  );
}
