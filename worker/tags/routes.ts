import { Hono } from "hono";

import { requireSession } from "../middleware/session.js";
import type { AppEnv } from "../types.js";
import { listTags } from "./service.js";

export const tagsRoutes = new Hono<AppEnv>();

tagsRoutes.use("*", requireSession);
tagsRoutes.get("/", async (c) => c.json(await listTags(c.get("db"))));
