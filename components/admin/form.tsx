"use client";

import { useId } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Admin form fields (UI-UX.md 7: "shadcn inputs, Zod-driven inline
 * validation, clear error text in danger colour").
 *
 * Hand-built rather than pulled from shadcn: these are four input types
 * against an existing token system, and adding a component library plus its
 * Radix dependencies to render a labelled `<input>` is not a trade worth
 * making for a site whose whole point is being light on mobile data. The
 * accessibility behaviour shadcn would give — real labels, described-by
 * wiring, invalid state — is implemented here explicitly.
 *
 * Every field: a real `<label>`, `aria-invalid` when wrong, and its error and
 * hint wired through `aria-describedby` so screen readers get them.
 */

type BaseProps = {
  label: string;
  name: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
};

const inputClass =
  "rounded-input border-border text-body text-navy w-full border bg-white px-3.5 py-2.5 transition-colors placeholder:text-slate/60";

function FieldShell({
  label,
  required,
  error,
  hint,
  fieldId,
  errorId,
  hintId,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  fieldId: string;
  errorId: string;
  hintId: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label htmlFor={fieldId} className="text-small text-navy font-semibold">
        {label}
        {required && (
          <span className="text-danger" aria-hidden="true">
            {" "}
            *
          </span>
        )}
      </label>
      <div className="mt-1.5">{children}</div>
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

function useFieldIds(name: string) {
  const uid = useId();
  const fieldId = `${uid}-${name}`;
  return { fieldId, errorId: `${fieldId}-error`, hintId: `${fieldId}-hint` };
}

function describedBy(
  error?: string,
  hint?: string,
  errorId?: string,
  hintId?: string,
) {
  return (
    [error ? errorId : null, hint && !error ? hintId : null]
      .filter(Boolean)
      .join(" ") || undefined
  );
}

export function TextField({
  label,
  name,
  error,
  hint,
  required,
  className,
  ...props
}: BaseProps & React.InputHTMLAttributes<HTMLInputElement>) {
  const { fieldId, errorId, hintId } = useFieldIds(name);

  return (
    <FieldShell
      label={label}
      required={required}
      error={error}
      hint={hint}
      fieldId={fieldId}
      errorId={errorId}
      hintId={hintId}
      className={className}
    >
      <input
        id={fieldId}
        name={name}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(error, hint, errorId, hintId)}
        className={cn(inputClass, error && "border-danger")}
        {...props}
      />
    </FieldShell>
  );
}

export function TextAreaField({
  label,
  name,
  error,
  hint,
  required,
  className,
  rows = 4,
  ...props
}: BaseProps & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { fieldId, errorId, hintId } = useFieldIds(name);

  return (
    <FieldShell
      label={label}
      required={required}
      error={error}
      hint={hint}
      fieldId={fieldId}
      errorId={errorId}
      hintId={hintId}
      className={className}
    >
      <textarea
        id={fieldId}
        name={name}
        rows={rows}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(error, hint, errorId, hintId)}
        className={cn(inputClass, "resize-y", error && "border-danger")}
        {...props}
      />
    </FieldShell>
  );
}

export function SelectField({
  label,
  name,
  error,
  hint,
  required,
  className,
  options,
  ...props
}: BaseProps &
  React.SelectHTMLAttributes<HTMLSelectElement> & {
    options: { value: string; label: string }[];
  }) {
  const { fieldId, errorId, hintId } = useFieldIds(name);

  return (
    <FieldShell
      label={label}
      required={required}
      error={error}
      hint={hint}
      fieldId={fieldId}
      errorId={errorId}
      hintId={hintId}
      className={className}
    >
      <select
        id={fieldId}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(error, hint, errorId, hintId)}
        className={cn(inputClass, error && "border-danger")}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

/**
 * Checkbox.
 *
 * The label wraps the control, so the text is part of the hit target — on a
 * phone, a 16px tick box on its own is a miserable thing to aim at.
 */
export function CheckboxField({
  label,
  name,
  hint,
  defaultChecked,
  className,
}: {
  label: string;
  name: string;
  hint?: string;
  defaultChecked?: boolean;
  className?: string;
}) {
  const { fieldId, hintId } = useFieldIds(name);

  return (
    <div className={className}>
      <label
        htmlFor={fieldId}
        className="text-small text-navy flex min-h-[44px] items-center gap-3 font-semibold"
      >
        <input
          id={fieldId}
          name={name}
          type="checkbox"
          defaultChecked={defaultChecked}
          aria-describedby={hint ? hintId : undefined}
          className="accent-blue-strong size-5 shrink-0"
        />
        {label}
      </label>
      {hint && (
        <p id={hintId} className="text-small text-slate mt-0.5">
          {hint}
        </p>
      )}
    </div>
  );
}

/** Form-level error, announced when it appears. */
export function FormError({ message }: { message: string | null }) {
  return (
    <p role="alert" aria-live="polite" className="text-small text-danger-text">
      {message}
    </p>
  );
}
