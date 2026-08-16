import { DetailedError, hc } from "hono/client";

import { apiErrorCodes } from "../../worker/api/errors.js";
import type { ApiErrorCode } from "../../worker/api/errors.js";
import type { AppType } from "../../worker/index.js";

export const apiClient = hc<AppType>(window.location.origin, {
  init: {
    credentials: "same-origin",
  },
});

export type ApiClientErrorCode =
  ApiErrorCode | "INVALID_RESPONSE" | "NETWORK_ERROR" | "UNKNOWN_ERROR";

export class ApiClientError extends Error {
  readonly code: ApiClientErrorCode;
  readonly status: number;

  constructor(
    message: string,
    options: {
      cause?: unknown;
      code: ApiClientErrorCode;
      status: number;
    },
  ) {
    super(message, { cause: options.cause });
    this.name = "ApiClientError";
    this.code = options.code;
    this.status = options.status;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

const knownApiErrorCodes: ReadonlySet<string> = new Set(apiErrorCodes);

function isApiErrorCode(value: unknown): value is ApiErrorCode {
  return typeof value === "string" && knownApiErrorCodes.has(value);
}

function parseErrorBody(value: unknown) {
  if (!isRecord(value) || !isRecord(value.error)) {
    return undefined;
  }

  const { code, message } = value.error;
  if (!isApiErrorCode(code) || typeof message !== "string") {
    return undefined;
  }

  return { code, message };
}

function fromDetailedError(error: DetailedError) {
  const status = typeof error.statusCode === "number" ? error.statusCode : 0;
  const detail: unknown = error.detail;
  const data = isRecord(detail) ? detail.data : undefined;
  const parsed = parseErrorBody(data);

  if (parsed) {
    return new ApiClientError(parsed.message, {
      cause: error,
      code: parsed.code,
      status,
    });
  }

  const statusText =
    isRecord(detail) && typeof detail.statusText === "string"
      ? detail.statusText
      : undefined;

  return new ApiClientError(
    statusText ||
      (status > 0 ? `Request failed (${status})` : "Request failed"),
    {
      cause: error,
      code: "INVALID_RESPONSE",
      status,
    },
  );
}

export async function apiRequest<T>(request: () => Promise<T>): Promise<T> {
  try {
    return await request();
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw error;
    }
    if (error instanceof DetailedError) {
      throw fromDetailedError(error);
    }
    if (error instanceof TypeError) {
      throw new ApiClientError("Unable to reach Stashed", {
        cause: error,
        code: "NETWORK_ERROR",
        status: 0,
      });
    }
    if (error instanceof SyntaxError) {
      throw new ApiClientError("Stashed returned an invalid response", {
        cause: error,
        code: "INVALID_RESPONSE",
        status: 0,
      });
    }

    throw new ApiClientError("Something went wrong", {
      cause: error,
      code: "UNKNOWN_ERROR",
      status: 0,
    });
  }
}
