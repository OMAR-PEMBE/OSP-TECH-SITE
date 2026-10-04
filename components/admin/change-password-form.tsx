"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/admin/card";
import { FormError, TextField } from "@/components/admin/form";
import { Button } from "@/components/ui/button";
import { changePassword } from "@/app/actions/admin";

/**
 * Change password (FR-A8, security.md 2).
 *
 * Supabase applies the change to the currently authenticated user, so there
 * is no account selector here and no way to aim this at anyone else.
 */
export function ChangePasswordForm() {
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setFormError(null);
    setDone(false);

    startTransition(async () => {
      const result = await changePassword(formData);

      if (result.ok) {
        setErrors({});
        setDone(true);
        /* Clear the fields: leaving a password sitting in the DOM after a
           successful change is needless exposure on a shared screen. */
        form.reset();
        return;
      }

      setErrors(result.error.fields ?? {});
      setFormError(result.error.message);
    });
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <Card className="flex flex-col gap-5">
        <p className="text-label text-slate uppercase">Change password</p>

        <TextField
          label="New password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          error={errors.password}
          hint="At least 12 characters. Length matters more than symbols."
        />
        <TextField
          label="Confirm new password"
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          error={errors.confirm}
        />

        <FormError message={formError} />

        <div className="flex flex-wrap items-center gap-4">
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Change password"}
          </Button>
          {done && (
            <p
              role="status"
              className="text-small text-success-text font-semibold"
            >
              Password changed.
            </p>
          )}
        </div>
      </Card>
    </form>
  );
}
