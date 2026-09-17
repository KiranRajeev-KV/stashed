import { zValidator } from "@hono/zod-validator";
import { Hono, type Context } from "hono";
import { z } from "zod";

import { apiError } from "../api/errors.js";
import { searchUsers } from "../db/users.js";
import { requireSession } from "../middleware/session.js";
import type { AppEnv } from "../types.js";

const validationHook = (result: { success: boolean }, c: Context) =>
  result.success
    ? undefined
    : apiError(c, 400, "VALIDATION_ERROR", "Request validation failed");

export const usersRoutes = new Hono<AppEnv>()
  .use("*", requireSession)
  .use("*", async (c, next) => {
    c.header("Cache-Control", "private, no-store");
    c.header("Vary", "Cookie");
    await next();
  })
  .get(
    "/",
    zValidator(
      "query",
      z.object({ q: z.string().trim().min(2).max(100) }),
      validationHook,
    ),
    async (c) =>
      c.json({
        users: await searchUsers(
          c.get("db"),
          c.req.valid("query").q,
          c.get("currentUserId"),
        ),
      }),
  );
