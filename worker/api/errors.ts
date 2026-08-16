import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";

export type ApiErrorCode =
  | "AUTHORIZATION_FAILED"
  | "AUTH_STATE_INVALID"
  | "FORBIDDEN"
  | "IDEA_NOT_FOUND"
  | "INTERNAL_ERROR"
  | "NOT_FOUND"
  | "UNAUTHORIZED"
  | "VALIDATION_ERROR";

export class ApiError extends Error {
  readonly status: ContentfulStatusCode;
  readonly code: ApiErrorCode;

  constructor(
    status: ContentfulStatusCode,
    code: ApiErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export function apiError(
  c: Context,
  status: ContentfulStatusCode,
  code: ApiErrorCode,
  message: string,
) {
  return c.json({ error: { code, message } }, status);
}
