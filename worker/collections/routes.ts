import { zValidator } from "@hono/zod-validator";
import { Hono, type Context } from "hono";

import { apiError } from "../api/errors.js";
import { loadOptionalSession, requireSession } from "../middleware/session.js";
import type { AppEnv } from "../types.js";
import {
  addCollectionIdeasSchema,
  addCollectionIdeaSchema,
  collectionCollaboratorParamSchema,
  collectionIdParamSchema,
  collectionIdeaParamSchema,
  collectionIdeasQuerySchema,
  collectionIdeaCandidatesQuerySchema,
  collectionIdeaTargetsQuerySchema,
  createCollectionSchema,
  listCollectionsQuerySchema,
  removeCollectionIdeasSchema,
  setCollaboratorSchema,
  updateCollectionSchema,
} from "./schemas.js";
import {
  addCollectionIdeas,
  addCollectionIdea,
  createCollection,
  deleteCollection,
  getCollaborators,
  getCollection,
  listCollectionIdeas,
  listCollectionIdeaCandidates,
  listCollectionIdeaTargets,
  listCollections,
  removeCollaborator,
  removeCollectionIdea,
  removeCollectionIdeas,
  setCollaborator,
  updateCollection,
} from "./service.js";

const validationHook = (result: { success: boolean }, c: Context) =>
  result.success
    ? undefined
    : apiError(c, 400, "VALIDATION_ERROR", "Request validation failed");

export const collectionsRoutes = new Hono<AppEnv>()
  .use("*", loadOptionalSession)
  .use("*", async (c, next) => {
    c.header("Cache-Control", "private, no-store");
    c.header("Vary", "Cookie");
    await next();
  })
  .get(
    "/",
    zValidator("query", listCollectionsQuerySchema, validationHook),
    async (c) =>
      c.json(
        await listCollections(
          c.get("db"),
          c.req.valid("query"),
          c.get("sessionUserId"),
        ),
      ),
  )
  .post(
    "/",
    requireSession,
    zValidator("json", createCollectionSchema, validationHook),
    async (c) =>
      c.json(
        await createCollection(
          c.get("db"),
          c.get("currentUserId"),
          c.req.valid("json"),
        ),
        201,
      ),
  )
  .delete(
    "/:id/ideas/batch",
    requireSession,
    zValidator("param", collectionIdParamSchema, validationHook),
    zValidator("json", removeCollectionIdeasSchema, validationHook),
    async (c) =>
      c.json(
        await removeCollectionIdeas(
          c.get("db"),
          c.req.valid("param").id,
          c.req.valid("json").ideaIds,
          c.get("currentUserId"),
        ),
      ),
  )
  .get(
    "/idea-targets",
    requireSession,
    zValidator("query", collectionIdeaTargetsQuerySchema, validationHook),
    async (c) =>
      c.json(
        await listCollectionIdeaTargets(
          c.get("db"),
          c.req.valid("query"),
          c.get("currentUserId"),
        ),
      ),
  )
  .get(
    "/:id",
    zValidator("param", collectionIdParamSchema, validationHook),
    async (c) =>
      c.json(
        await getCollection(
          c.get("db"),
          c.req.valid("param").id,
          c.get("sessionUserId"),
        ),
      ),
  )
  .patch(
    "/:id",
    requireSession,
    zValidator("param", collectionIdParamSchema, validationHook),
    zValidator("json", updateCollectionSchema, validationHook),
    async (c) =>
      c.json(
        await updateCollection(
          c.get("db"),
          c.req.valid("param").id,
          c.get("currentUserId"),
          c.req.valid("json"),
        ),
      ),
  )
  .delete(
    "/:id",
    requireSession,
    zValidator("param", collectionIdParamSchema, validationHook),
    async (c) => {
      await deleteCollection(
        c.get("db"),
        c.req.valid("param").id,
        c.get("currentUserId"),
      );
      return c.body(null, 204);
    },
  )
  .get(
    "/:id/ideas/candidates",
    requireSession,
    zValidator("param", collectionIdParamSchema, validationHook),
    zValidator("query", collectionIdeaCandidatesQuerySchema, validationHook),
    async (c) =>
      c.json(
        await listCollectionIdeaCandidates(
          c.get("db"),
          c.req.valid("param").id,
          c.req.valid("query"),
          c.get("currentUserId"),
        ),
      ),
  )
  .post(
    "/:id/ideas/batch",
    requireSession,
    zValidator("param", collectionIdParamSchema, validationHook),
    zValidator("json", addCollectionIdeasSchema, validationHook),
    async (c) =>
      c.json(
        await addCollectionIdeas(
          c.get("db"),
          c.req.valid("param").id,
          c.req.valid("json").ideaIds,
          c.get("currentUserId"),
        ),
      ),
  )
  .get(
    "/:id/ideas",
    zValidator("param", collectionIdParamSchema, validationHook),
    zValidator("query", collectionIdeasQuerySchema, validationHook),
    async (c) =>
      c.json(
        await listCollectionIdeas(
          c.get("db"),
          c.req.valid("param").id,
          c.req.valid("query"),
          c.get("sessionUserId"),
        ),
      ),
  )
  .post(
    "/:id/ideas",
    requireSession,
    zValidator("param", collectionIdParamSchema, validationHook),
    zValidator("json", addCollectionIdeaSchema, validationHook),
    async (c) => {
      await addCollectionIdea(
        c.get("db"),
        c.req.valid("param").id,
        c.req.valid("json").ideaId,
        c.get("currentUserId"),
      );
      return c.body(null, 204);
    },
  )
  .delete(
    "/:id/ideas/:ideaId",
    requireSession,
    zValidator("param", collectionIdeaParamSchema, validationHook),
    async (c) => {
      const { id, ideaId } = c.req.valid("param");
      await removeCollectionIdea(
        c.get("db"),
        id,
        ideaId,
        c.get("currentUserId"),
      );
      return c.body(null, 204);
    },
  )
  .get(
    "/:id/collaborators",
    zValidator("param", collectionIdParamSchema, validationHook),
    async (c) =>
      c.json(
        await getCollaborators(
          c.get("db"),
          c.req.valid("param").id,
          c.get("sessionUserId"),
        ),
      ),
  )
  .put(
    "/:id/collaborators/:userId",
    requireSession,
    zValidator("param", collectionCollaboratorParamSchema, validationHook),
    zValidator("json", setCollaboratorSchema, validationHook),
    async (c) => {
      const { id, userId } = c.req.valid("param");
      return c.json(
        await setCollaborator(
          c.get("db"),
          id,
          userId,
          c.req.valid("json").role,
          c.get("currentUserId"),
        ),
      );
    },
  )
  .delete(
    "/:id/collaborators/:userId",
    requireSession,
    zValidator("param", collectionCollaboratorParamSchema, validationHook),
    async (c) => {
      const { id, userId } = c.req.valid("param");
      await removeCollaborator(c.get("db"), id, userId, c.get("currentUserId"));
      return c.body(null, 204);
    },
  );
