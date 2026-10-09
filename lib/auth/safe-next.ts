/**
 * Where to send someone after they sign in.
 *
 * `next` comes from the query string, so it is attacker-controlled. Taking it
 * as-is would make login an open redirect: /login?next=https://evil.example.
 * A "starts with / but not //" check is not enough on its own — browsers
 * treat a backslash as a slash in the path, so `/\evil.example` is the
 * protocol-relative `//evil.example`, and tabs or newlines inside the URL are
 * stripped before it is resolved.
 *
 * So the value is resolved against a placeholder origin and accepted only if
 * it is still on that origin, and the result is rebuilt from the parsed
 * path, query and hash rather than echoing the raw string.
 */
export function safeNextPath(
  next: string | null | undefined,
  fallback = "/admin",
): string {
  if (!next || !next.startsWith("/")) return fallback;
  /* Anything the URL parser would silently drop or reinterpret. */
  if (/[\\\u0000-\u001f\u007f]/.test(next)) return fallback;

  const base = "https://same-origin.invalid";
  let url: URL;
  try {
    url = new URL(next, base);
  } catch {
    return fallback;
  }

  if (url.origin !== base) return fallback;
  return `${url.pathname}${url.search}${url.hash}`;
}
