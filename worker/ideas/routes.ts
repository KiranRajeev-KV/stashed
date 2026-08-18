import { zValidator } from "@hono/zod-validator";
import { Hono, type Context } from "hono";

import { apiError } from "../api/errors.js";
import { requireSession } from "../middleware/session.js";
import type { AppEnv } from "../types.js";
import {
  createIdeaSchema,
  ideaIdParamSchema,
  listIdeasQuerySchema,
  searchIdeasQuerySchema,
  updateIdeaSchema,
} from "./schemas.js";
import {
  createIdea,
  deleteIdea,
  getIdea,
  listIdeas,
  searchIdeas,
  updateIdea,
} from "./service.js";

const validationHook = (result: { success: boolean }, c: Context) => {
  if (!result.success) {
    return apiError(c, 400, "VALIDATION_ERROR", "Request validation failed");
  }
};

export const ideasRoutes = new Hono<AppEnv>()
  .get(
    "/",
    zValidator("query", listIdeasQuerySchema, validationHook),
    async (c) => c.json(await listIdeas(c.get("db"), c.req.valid("query"))),
  )
  .get(
    "/:id",
    zValidator("param", ideaIdParamSchema, validationHook),
    async (c) => c.json(await getIdea(c.get("db"), c.req.valid("param").id)),
  )
  .post(
    "/",
    requireSession,
    zValidator("json", createIdeaSchema, validationHook),
    async (c) => {
      const result = await createIdea(
        c.get("db"),
        c.get("currentUser").id,
        c.req.valid("json"),
      );
      return c.json(result, 201);
    },
  )
  .patch(
    "/:id",
    requireSession,
    zValidator("param", ideaIdParamSchema, validationHook),
    zValidator("json", updateIdeaSchema, validationHook),
    async (c) =>
      c.json(
        await updateIdea(
          c.get("db"),
          c.req.valid("param").id,
          c.get("currentUser").id,
          c.req.valid("json"),
        ),
      ),
  )
  .delete(
    "/:id",
    requireSession,
    zValidator("param", ideaIdParamSchema, validationHook),
    async (c) => {
      await deleteIdea(
        c.get("db"),
        c.req.valid("param").id,
        c.get("currentUser").id,
      );
      return c.body(null, 204);
    },
  );

export const searchRoutes = new Hono<AppEnv>().get(
  "/",
  zValidator("query", searchIdeasQuerySchema, validationHook),
  async (c) => {
    const { q, limit, offset } = c.req.valid("query");
    return c.json(await searchIdeas(c.get("db"), q, limit, offset));
  },
);
