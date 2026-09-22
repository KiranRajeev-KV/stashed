import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";

export const apiErrorCodes = [
  "AUTHORIZATION_FAILED",
  "AUTH_STATE_INVALID",
  "COLLECTION_NOT_FOUND",
  "FORBIDDEN",
  "IDEA_NOT_FOUND",
  "INTERNAL_ERROR",
  "NOT_FOUND",
  "SUGGESTIONS_UNAVAILABLE",
  "SUGGESTIONS_QUOTA_REACHED",
  "SUGGESTIONS_PROVIDER_ERROR",
  "UNAUTHORIZED",
  "USER_NOT_FOUND",
  "VALIDATION_ERROR",
] as const;

export type ApiErrorCode = (typeof apiErrorCodes)[number];

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

export function apiError<Status extends ContentfulStatusCode>(
  c: Context,
  status: Status,
  code: ApiErrorCode,
  message: string,
) {
  return c.json({ error: { code, message } }, status);
}
