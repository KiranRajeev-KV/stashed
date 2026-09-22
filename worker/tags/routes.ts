import { zValidator } from "@hono/zod-validator";
import { Hono, type Context } from "hono";

import { apiError } from "../api/errors.js";
import { listRecentSuggestionCandidates } from "../db/tags.js";
import { markdownToPlainText } from "../ideas/markdown.js";
import { requireSession } from "../middleware/session.js";
import type { AppEnv } from "../types.js";
import { evaluateTagCandidates } from "./jev.js";
import { recordSuggestionUsage, reserveSuggestionAttempt } from "./quota.js";
import { listTagsQuerySchema, suggestTagsSchema } from "./schemas.js";
import { listTags } from "./service.js";

const validationHook = (result: { success: boolean }, c: Context) => {
  if (!result.success) {
    return apiError(c, 400, "VALIDATION_ERROR", "Request validation failed");
  }
};

export const tagsRoutes = new Hono<AppEnv>()
  .get(
    "/",
    zValidator("query", listTagsQuerySchema, validationHook),
    async (c) => c.json(await listTags(c.get("db"), c.req.valid("query"))),
  )
  .post(
    "/suggestions",
    requireSession,
    zValidator("json", suggestTagsSchema, validationHook),
    async (c) => {
      c.header("Cache-Control", "private, no-store");
      const { title, content, tags } = c.req.valid("json");
      const notes = markdownToPlainText(content).slice(0, 4_000);
      if (!title && !notes) {
        return apiError(
          c,
          400,
          "VALIDATION_ERROR",
          "A title or notes are required",
        );
      }
      if (
        !c.env.TYPESAFE_API_KEY ||
        c.env.TYPESAFE_API_KEY.startsWith("replace-with-")
      ) {
        return apiError(
          c,
          503,
          "SUGGESTIONS_UNAVAILABLE",
          "Tag suggestions are currently unavailable",
        );
      }
      try {
        const control = await c.env.DB.prepare(
          "SELECT enabled FROM tag_suggestion_control WHERE id = 1",
        ).first<{ enabled: number }>();
        if (control?.enabled !== 1) {
          return apiError(
            c,
            503,
            "SUGGESTIONS_UNAVAILABLE",
            "Tag suggestions are currently unavailable",
          );
        }
      } catch {
        return apiError(
          c,
          503,
          "SUGGESTIONS_UNAVAILABLE",
          "Tag suggestions are currently unavailable",
        );
      }
      const shortlist = await listRecentSuggestionCandidates(
        c.get("db"),
        c.get("currentUserId"),
      );
      const selected = new Set(
        tags.map((tag) => tag.toLocaleLowerCase("en-US")),
      );
      const candidates = shortlist.filter((tag) => !selected.has(tag.nameKey));
      if (candidates.length === 0) return c.json({ tags: [] });

      const attemptId = await reserveSuggestionAttempt(
        c.env.DB,
        c.get("currentUserId"),
      );
      const result = await evaluateTagCandidates(
        c.env.TYPESAFE_API_KEY,
        { title, notes },
        candidates,
        (status, inputTokens) =>
          recordSuggestionUsage(c.env.DB, attemptId, status, inputTokens),
      );
      return c.json({ tags: result.tags });
    },
  );
