import { createMiddleware } from "hono/factory";

import { apiError } from "../api/errors.js";
import { clearSessionCookie, getSessionUserId } from "../auth/cookies.js";
import { getUserById } from "../db/users.js";
import type { AppEnv } from "../types.js";

export const requireSession = createMiddleware<AppEnv>(async (c, next) => {
  const userId = await getSessionUserId(c);
  if (!userId) {
    clearSessionCookie(c);
    return apiError(c, 401, "UNAUTHORIZED", "Authentication required");
  }

  const user = await getUserById(c.get("db"), userId);
  if (!user) {
    clearSessionCookie(c);
    return apiError(c, 401, "UNAUTHORIZED", "Authentication required");
  }

  c.set("currentUser", user);
  await next();
});
