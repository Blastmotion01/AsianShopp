/** Converts FormData to a plain object; repeated keys become arrays, checkboxes "on" → true. */
export function formToObject(fd: FormData): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, raw] of fd.entries()) {
    if (key.startsWith("$ACTION")) continue;
    const value = typeof raw === "string" ? raw : raw;
    if (key in out) {
      const prev = out[key];
      out[key] = Array.isArray(prev) ? [...prev, value] : [prev, value];
    } else {
      out[key] = value === "on" ? true : value;
    }
  }
  return out;
}

export type FormState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  message?: string;
  meta?: Record<string, unknown>;
};
