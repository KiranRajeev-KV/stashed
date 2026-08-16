import { zValidator } from "@hono/zod-validator";
import { Hono, type Context } from "hono";

import { apiError } from "../api/errors.js";
import { requireSession } from "../middleware/session.js";
import type { AppEnv } from "../types.js";
import { listTagsQuerySchema } from "./schemas.js";
import { listTags } from "./service.js";

const validationHook = (result: { success: boolean }, c: Context) => {
  if (!result.success) {
    return apiError(c, 400, "VALIDATION_ERROR", "Request validation failed");
  }
};

export const tagsRoutes = new Hono<AppEnv>()
  .use("*", requireSession)
  .get(
    "/",
    zValidator("query", listTagsQuerySchema, validationHook),
    async (c) => c.json(await listTags(c.get("db"), c.req.valid("query"))),
  );
