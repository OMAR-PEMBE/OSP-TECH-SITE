"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import { CheckCircle2 } from "lucide-react";
import { submitContactMessage } from "@/app/actions/contact";
import { contactSchema } from "@/lib/validation/contact";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

/**
 * Contact form (FR-W5, FR-W6, workflows.md B2).
 *
 * Validates with the same Zod schema the Server Action uses, so the inline
 * errors a visitor sees match what the server will actually accept. The client
 * pass is a courtesy; the server's is the one that decides (agents.md 2.3).
 *
 * States handled: idle, submitting, per-field errors, a form-level error, and
 * success. Errors are announced through a live region and focus moves to the
 * first invalid field, so a keyboard or screen reader user is told what
 * happened rather than left on a form that silently did nothing.
 *
 * The honeypot and the render timestamp are inert for a real visitor: the
 * honeypot is hidden from sight *and* from assistive tech, and is excluded
 * from tab order, so nobody can fill it in by accident.
 */

type FieldErrors = Record<string, string>;

export function ContactForm({ sourcePage }: { sourcePage: string }) {
  const formId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  /* Stamped on mount, not during render: `Date.now()` is impure, and calling
     it in the render body would make this component's output depend on when
     React happened to render it. The action's minimum-submit-time check reads
     it only at submit, by which point the effect has long since run. */
  const renderedAt = useRef(0);
  useEffect(() => {
    renderedAt.current = Date.now();
  }, []);

  function focusFirstError(fieldErrors: FieldErrors) {
    const first = Object.keys(fieldErrors)[0];
    if (!first) return;
    formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    setFormError(null);

    /* Client-side pass with the shared schema, for immediate feedback. */
    const parsed = contactSchema.safeParse({
      name: formData.get("name") ?? "",
      phone: formData.get("phone") ?? "",
      need: formData.get("need") ?? "",
      message: formData.get("message") ?? "",
      sourcePage,
      website: formData.get("website") ?? "",
    });

    if (!parsed.success) {
      const next: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string" && !next[key]) next[key] = issue.message;
      }
      setErrors(next);
      focusFirstError(next);
      return;
    }

    setErrors({});
    formData.set("sourcePage", sourcePage);
    formData.set("renderedAt", String(renderedAt.current));

    startTransition(async () => {
      const result = await submitContactMessage(formData);

      if (result.ok) {
        setDone(true);
        return;
      }

      if (result.error.fields) {
        setErrors(result.error.fields);
        focusFirstError(result.error.fields);
      }
      setFormError(result.error.message);
    });
  }

  if (done) {
    return (
      <div
        className="border-border rounded-card border bg-white p-8 text-center"
        /* Replaces the form in the DOM, so it must announce itself. */
        role="status"
      >
        <CheckCircle2
          aria-hidden
          className="text-success mx-auto size-10"
          strokeWidth={1.5}
        />
        <h3 className="text-h3 text-navy mt-4 font-semibold">
          Message sent — thank you.
        </h3>
        <p className="text-small text-slate mt-2">
          We will get back to you shortly. If it is urgent, WhatsApp is the
          fastest way to reach us.
        </p>
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      noValidate
      className="border-border rounded-card border bg-white p-6 sm:p-8"
    >
      {/* Honeypot. `hidden` keeps it out of the accessibility tree entirely,
          tabIndex -1 keeps it out of tab order, and autoComplete off stops a
          browser helpfully filling it for a real person. */}
      <div hidden aria-hidden="true">
        <label htmlFor={`${formId}-website`}>Website</label>
        <input
          id={`${formId}-website`}
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          defaultValue=""
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          id={`${formId}-name`}
          name="name"
          label="Your name"
          required
          autoComplete="name"
          error={errors.name}
        />
        <Field
          id={`${formId}-phone`}
          name="phone"
          label="Phone or WhatsApp"
          type="tel"
          autoComplete="tel"
          placeholder="0747 809 299"
          hint="Optional, but it is the fastest way for us to reply."
          error={errors.phone}
        />
      </div>

      <div className="mt-5">
        <Field
          id={`${formId}-need`}
          name="need"
          label="What do you need?"
          placeholder="A website, a POS system, automation…"
          error={errors.need}
        />
      </div>

      <div className="mt-5">
        <Field
          id={`${formId}-message`}
          name="message"
          label="Message"
          required
          multiline
          error={errors.message}
        />
      </div>

      {/* Live region: empty until something goes wrong, so it announces the
          error when it appears rather than on every render. */}
      <p
        role="alert"
        aria-live="polite"
        className="text-small text-danger-text mt-4"
      >
        {formError}
      </p>

      <div className="mt-2 flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={pending}>
          {pending ? "Sending…" : "Send message"}
        </Button>
        <p className="text-small text-slate">
          We use your details only to reply to you.
        </p>
      </div>
    </form>
  );
}

/**
 * One labelled field with its error.
 *
 * The label is always a real `<label>`, never a placeholder: placeholder-as-
 * label disappears the moment someone starts typing, which is precisely when
 * they most need it.
 */
function Field({
  id,
  name,
  label,
  error,
  hint,
  multiline = false,
  required = false,
  ...props
}: {
  id: string;
  name: string;
  label: string;
  error?: string;
  hint?: string;
  multiline?: boolean;
  required?: boolean;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy =
    [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ") ||
    undefined;

  const className = cn(
    "rounded-input border-border text-body text-navy w-full border bg-white px-4 py-3 transition-colors",
    "placeholder:text-slate/70",
    error && "border-danger",
  );

  return (
    <div>
      <label htmlFor={id} className="text-small text-navy font-semibold">
        {label}
        {required && (
          <span className="text-danger" aria-hidden="true">
            {" "}
            *
          </span>
        )}
        {!required && (
          <span className="text-slate font-normal"> (optional)</span>
        )}
      </label>

      {multiline ? (
        <textarea
          id={id}
          name={name}
          rows={5}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(className, "mt-1.5 resize-y")}
        />
      ) : (
        <input
          id={id}
          name={name}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(className, "mt-1.5")}
          {...props}
        />
      )}

      {hint && !error && (
        <p id={hintId} className="text-small text-slate mt-1.5">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-small text-danger-text mt-1.5">
          {error}
        </p>
      )}
    </div>
  );
}
