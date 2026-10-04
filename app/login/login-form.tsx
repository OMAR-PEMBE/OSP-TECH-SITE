"use client";

import { useId, useState, useTransition } from "react";
import { Eye, EyeOff } from "lucide-react";
import { signIn } from "@/app/login/actions";
import { loginSchema } from "@/lib/validation/auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

/**
 * Login form (FR-A1).
 *
 * On success the action redirects, so this component never sees a success
 * state — the only thing it has to handle well is failure.
 *
 * The password field has a show/hide toggle. On a phone, typing a long
 * password blind into a mis-tapped keyboard is the main reason people pick
 * weaker ones, and the field is already private by virtue of being on the
 * owner's own device.
 */
export function LoginForm({ next }: { next?: string }) {
  const id = useId();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setError(null);

    const parsed = loginSchema.safeParse({
      email: formData.get("email") ?? "",
      password: formData.get("password") ?? "",
      next,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check your details.");
      return;
    }

    if (next) formData.set("next", next);

    startTransition(async () => {
      /* A successful sign-in redirects, which surfaces here as a thrown
         control-flow signal rather than a return. Only a genuine failure
         comes back as a value. */
      const result = await signIn(formData);
      if (result && !result.ok) setError(result.error.message);
    });
  }

  const inputClass =
    "rounded-input border-border text-body text-navy w-full border bg-white px-4 py-3";

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="rounded-card shadow-soft mt-8 bg-white p-6 sm:p-8"
    >
      <div>
        <label
          htmlFor={`${id}-email`}
          className="text-small text-navy font-semibold"
        >
          Email
        </label>
        <input
          id={`${id}-email`}
          name="email"
          type="email"
          autoComplete="username"
          required
          autoFocus
          className={cn(inputClass, "mt-1.5")}
        />
      </div>

      <div className="mt-5">
        <label
          htmlFor={`${id}-password`}
          className="text-small text-navy font-semibold"
        >
          Password
        </label>
        <div className="relative mt-1.5">
          <input
            id={`${id}-password`}
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            className={cn(inputClass, "pr-12")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            className="rounded-input text-slate absolute top-1/2 right-1.5 flex size-10 -translate-y-1/2 items-center justify-center"
          >
            {showPassword ? (
              <EyeOff aria-hidden className="size-5" />
            ) : (
              <Eye aria-hidden className="size-5" />
            )}
          </button>
        </div>
      </div>

      {/* Announced when it appears; empty the rest of the time. */}
      <p
        role="alert"
        aria-live="polite"
        className="text-small text-danger-text mt-4"
      >
        {error}
      </p>

      <Button type="submit" disabled={pending} className="mt-2 w-full">
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
