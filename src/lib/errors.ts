/**
 * Domain errors carry a stable `code` that UI maps to a translated message.
 * Stack traces never reach the client: actions return { ok: false, error: code }.
 */
export class AppError extends Error {
  constructor(
    public code: string,
    public status = 400,
    public meta?: Record<string, unknown>,
  ) {
    super(code);
    this.name = "AppError";
  }
}

export class AuthError extends AppError {
  constructor(code = "unauthorized") {
    super(code, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor() {
    super("forbidden", 403);
  }
}

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string>; meta?: Record<string, unknown> };

export function ok<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

/** Converts any thrown value to a safe ActionResult; logs unexpected errors server-side. */
export function toActionError(err: unknown): { ok: false; error: string; meta?: Record<string, unknown> } {
  if (err instanceof AppError) return { ok: false, error: err.code, meta: err.meta };
  // Next.js uses thrown errors for redirect()/notFound() — let them propagate.
  if (err && typeof err === "object" && "digest" in err && typeof (err as { digest: unknown }).digest === "string") {
    const digest = (err as { digest: string }).digest;
    if (digest.startsWith("NEXT_REDIRECT") || digest.startsWith("NEXT_HTTP_ERROR_FALLBACK") || digest === "NEXT_NOT_FOUND") {
      throw err;
    }
  }
  console.error("[action error]", err);
  return { ok: false, error: "server_error" };
}

export function zodFieldErrors(issues: { path: PropertyKey[]; message: string }[]) {
  const out: Record<string, string> = {};
  for (const i of issues) {
    const key = i.path.map(String).join(".");
    if (!out[key]) out[key] = i.message;
  }
  return out;
}
