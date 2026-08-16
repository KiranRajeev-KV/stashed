import { createMiddleware } from "hono/factory";

import { apiError } from "../api/errors.js";
import type { AppEnv } from "../types.js";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export const requireSameOrigin = createMiddleware<AppEnv>(async (c, next) => {
  if (SAFE_METHODS.has(c.req.method)) {
    await next();
    return;
  }

  const fetchSite = c.req.header("Sec-Fetch-Site");
  const origin = c.req.header("Origin");

  if (fetchSite && fetchSite !== "same-origin") {
    return apiError(c, 403, "FORBIDDEN", "Cross-origin request rejected");
  }

  if (!origin) {
    return apiError(c, 403, "FORBIDDEN", "Request origin is required");
  }

  try {
    if (new URL(origin).origin !== new URL(c.req.url).origin) {
      return apiError(c, 403, "FORBIDDEN", "Cross-origin request rejected");
    }
  } catch {
    return apiError(c, 403, "FORBIDDEN", "Invalid request origin");
  }

  await next();
});
