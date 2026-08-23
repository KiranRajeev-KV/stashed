import { createMiddleware } from "hono/factory";

import { apiError } from "../api/errors.js";
import { clearSessionCookie, getSessionUserId } from "../auth/cookies.js";
import type { AppEnv } from "../types.js";

export const requireSession = createMiddleware<AppEnv>(async (c, next) => {
  const userId = await getSessionUserId(c);
  if (!userId) {
    clearSessionCookie(c);
    return apiError(c, 401, "UNAUTHORIZED", "Authentication required");
  }

  c.set("currentUserId", userId);
  await next();
});
