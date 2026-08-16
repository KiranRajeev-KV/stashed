import { createMiddleware } from "hono/factory";

import { createDb } from "../db/client.js";
import type { AppEnv } from "../types.js";

export const databaseMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  c.set("db", createDb(c.env.DB));
  await next();
});
