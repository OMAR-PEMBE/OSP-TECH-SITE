/**
 * The shape every Server Action returns (API.md 2).
 *
 * Actions never throw to the client: a thrown error in a Server Action reaches
 * the browser as an opaque digest in production, which tells the visitor
 * nothing and tells us nothing either. Returning a typed result makes failure
 * a value the form has to handle, and the compiler enforces that it does.
 */

export type ErrorCode =
  | "VALIDATION" /* Zod failed; `fields` carries per-field messages. */
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "RATE_LIMITED"
  | "CONFLICT"
  | "SERVER_ERROR";

export type ActionOk<T> = { ok: true; data: T };

export type ActionErr = {
  ok: false;
  error: {
    code: ErrorCode;
    /** Safe to show a visitor. Never leaks internals (security.md 13). */
    message: string;
    fields?: Record<string, string>;
  };
};

export type ActionResult<T> = ActionOk<T> | ActionErr;

export function ok<T>(data: T): ActionOk<T> {
  return { ok: true, data };
}

export function err(
  code: ErrorCode,
  message: string,
  fields?: Record<string, string>,
): ActionErr {
  return { ok: false, error: { code, message, ...(fields && { fields }) } };
}
