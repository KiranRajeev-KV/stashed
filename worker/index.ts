import { Hono } from "hono";

import { ApiError, apiError } from "./api/errors.js";
import { authRoutes } from "./auth/routes.js";
import { ideasRoutes, searchRoutes } from "./ideas/routes.js";
import { databaseMiddleware } from "./middleware/database.js";
import { requireSameOrigin } from "./middleware/same-origin.js";
import type { AppEnv } from "./types.js";

const app = new Hono<AppEnv>();

app.use("/api/*", requireSameOrigin);
app.use("/api/*", databaseMiddleware);

app.route("/api/auth", authRoutes);
app.route("/api/ideas", ideasRoutes);
app.route("/api/search", searchRoutes);

app.get("/api/health", (c) => {
  return c.json({
    ok: true,
    app: "Stashed",
  });
});

app.onError((error, c) => {
  if (error instanceof ApiError) {
    return apiError(c, error.status, error.code, error.message);
  }

  console.error(
    JSON.stringify({
      message: "Unhandled request error",
      error: error.message,
      method: c.req.method,
      path: new URL(c.req.url).pathname,
    }),
  );
  return apiError(c, 500, "INTERNAL_ERROR", "Internal server error");
});

app.notFound((c) => apiError(c, 404, "NOT_FOUND", "Endpoint not found"));

export default app;
