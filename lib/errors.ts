/**
 * Turns a thrown value into a non-empty message. Some errors have an empty
 * message (e.g. an AggregateError from a refused connection), so fall back
 * to the error code or name.
 */
export function describeError(e: unknown): string {
  if (e instanceof Error) {
    const code = (e as { code?: unknown }).code;
    return e.message || (typeof code === "string" ? code : "") || e.name || "Unknown error";
  }
  return String(e) || "Unknown error";
}
