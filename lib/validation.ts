export type ConfigResult<T> =
  | { ok: true; config: T }
  | { ok: false; errors: string[] };

/** Parses a JSON string column. Returns undefined if it isn't valid JSON. */
export function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}
