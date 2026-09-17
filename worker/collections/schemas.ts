import { z } from "zod";

import {
  collectionCollaboratorRoleValues,
  collectionVisibilityValues,
  ideaStatusValues,
  ideaVisibilityValues,
} from "../db/schema.js";

const COLLECTION_ICONS = [
  "folder",
  "bookmark",
  "library",
  "lightbulb",
  "layers",
  "briefcase",
  "palette",
  "rocket",
  "code",
  "heart",
] as const;

export const collectionIdParamSchema = z.object({ id: z.string().uuid() });
export const collectionIdeaParamSchema = z.object({
  id: z.string().uuid(),
  ideaId: z.string().uuid(),
});
export const collectionCollaboratorParamSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
});

const nameSchema = z.string().trim().min(1).max(200);
const descriptionSchema = z.string().trim().max(2_000);

export const createCollectionSchema = z
  .object({
    name: nameSchema,
    description: descriptionSchema.optional(),
    icon: z.enum(COLLECTION_ICONS).optional(),
    visibility: z.enum(collectionVisibilityValues).optional(),
  })
  .strict();

export const updateCollectionSchema = z
  .object({
    name: nameSchema.optional(),
    description: descriptionSchema.optional(),
    icon: z.enum(COLLECTION_ICONS).optional(),
    visibility: z.enum(collectionVisibilityValues).optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });

export const listCollectionsQuerySchema = z.object({
  scope: z.enum(["DISCOVER", "OWNED", "COLLABORATING"]).default("DISCOVER"),
  q: z.string().trim().max(200).optional(),
  ownerId: z.string().uuid().optional(),
  sort: z
    .enum([
      "UPDATED_DESC",
      "CREATED_DESC",
      "CREATED_ASC",
      "NAME_ASC",
      "NAME_DESC",
    ])
    .default("UPDATED_DESC"),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).max(10_000).default(0),
});

export const collectionIdeasQuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
  status: z.enum(ideaStatusValues).optional(),
  visibility: z.enum(ideaVisibilityValues).optional(),
  sort: z
    .enum([
      "UPDATED_DESC",
      "CREATED_DESC",
      "CREATED_ASC",
      "NAME_ASC",
      "NAME_DESC",
    ])
    .default("UPDATED_DESC"),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).max(10_000).default(0),
});

export const addCollectionIdeaSchema = z
  .object({ ideaId: z.string().uuid() })
  .strict();

export const addCollectionIdeasSchema = z
  .object({
    ideaIds: z.array(z.string().uuid()).min(1).max(50),
  })
  .strict()
  .refine((value) => new Set(value.ideaIds).size === value.ideaIds.length, {
    message: "Idea IDs must be unique",
  });

/** A bounded, idempotent membership removal payload. */
export const removeCollectionIdeasSchema = z
  .object({
    ideaIds: z.array(z.string().uuid()).min(1).max(50),
  })
  .strict()
  .refine((value) => new Set(value.ideaIds).size === value.ideaIds.length, {
    message: "Idea IDs must be unique",
  });

export const collectionIdeaCandidatesQuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).max(10_000).default(0),
});

/** Collections the current user can add one specific, accessible Idea to. */
export const collectionIdeaTargetsQuerySchema = z.object({
  ideaId: z.string().uuid(),
  q: z.string().trim().max(200).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).max(10_000).default(0),
});
export const setCollaboratorSchema = z
  .object({ role: z.enum(collectionCollaboratorRoleValues) })
  .strict();

export type CreateCollectionInput = z.infer<typeof createCollectionSchema>;
export type UpdateCollectionInput = z.infer<typeof updateCollectionSchema>;
export type ListCollectionsInput = z.infer<typeof listCollectionsQuerySchema>;
export type CollectionIdeasInput = z.infer<typeof collectionIdeasQuerySchema>;
export type CollectionIdeaCandidatesInput = z.infer<
  typeof collectionIdeaCandidatesQuerySchema
>;
export type CollectionIdeaTargetsInput = z.infer<
  typeof collectionIdeaTargetsQuerySchema
>;
