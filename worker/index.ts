import { Hono } from "hono";

const app = new Hono<{ Bindings: Env }>();

app.get("/api/health", (c) => {
  return c.json({
    ok: true,
    app: "Stashed",
  });
});

export default app;
