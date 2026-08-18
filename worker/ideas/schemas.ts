import { z } from "zod";

import { ideaStatusValues } from "../db/schema.js";

const MAX_CONTENT_LENGTH = 200_000;
const MAX_TAGS = 20;
const MAX_TAG_FILTERS = 20;

const titleSchema = z.string().trim().min(1).max(200);
const contentSchema = z.string().max(MAX_CONTENT_LENGTH);
const tagNameSchema = z.string().trim().min(1).max(50);
const tagsSchema = z.array(tagNameSchema).max(MAX_TAGS);

export const ideaIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const listIdeasQuerySchema = z.object({
  status: z.enum(ideaStatusValues).optional(),
  tagId: z
    .union([
      z.string().uuid(),
      z.array(z.string().uuid()).min(1).max(MAX_TAG_FILTERS),
    ])
    .optional()
    .transform((value) => {
      if (!value) return undefined;
      return [...new Set(Array.isArray(value) ? value : [value])];
    }),
  cursor: z.string().min(1).max(500).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const createIdeaSchema = z
  .object({
    title: titleSchema,
    content: contentSchema,
    status: z.enum(ideaStatusValues).optional(),
    tags: tagsSchema.optional(),
  })
  .strict();

export const updateIdeaSchema = z
  .object({
    title: titleSchema.optional(),
    content: contentSchema.optional(),
    status: z.enum(ideaStatusValues).optional(),
    tags: tagsSchema.optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });

export const searchIdeasQuerySchema = z.object({
  q: z.string().trim().min(1).max(200),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).max(10_000).default(0),
});

export type CreateIdeaInput = z.infer<typeof createIdeaSchema>;
export type UpdateIdeaInput = z.infer<typeof updateIdeaSchema>;
