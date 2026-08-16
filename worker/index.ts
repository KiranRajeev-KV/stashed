import { Hono } from "hono";

import { authRoutes } from "./auth/routes.js";
import { databaseMiddleware } from "./middleware/database.js";
import type { AppEnv } from "./types.js";

const app = new Hono<AppEnv>();

app.use("/api/*", databaseMiddleware);

app.route("/api/auth", authRoutes);

app.get("/api/health", (c) => {
  return c.json({
    ok: true,
    app: "Stashed",
  });
});

app.onError((error, c) => {
  console.error(
    JSON.stringify({
      message: "Unhandled request error",
      error: error.message,
      method: c.req.method,
      path: new URL(c.req.url).pathname,
    }),
  );
  return c.json({ error: "Internal server error" }, 500);
});

export default app;
