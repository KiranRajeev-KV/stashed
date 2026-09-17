import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { CollectionDetail } from "../../features/collections/collection-detail.js";

const searchSchema = z.object({
  q: z.string().trim().min(1).max(200).optional().catch(undefined),
  status: z
    .enum([
      "DRAFT",
      "ACTIVE",
      "PLANNED",
      "IN_PROGRESS",
      "COMPLETED",
      "ARCHIVED",
    ])
    .optional()
    .catch(undefined),
  visibility: z
    .enum(["PUBLIC", "UNLISTED", "PRIVATE"])
    .optional()
    .catch(undefined),
  sort: z
    .enum([
      "UPDATED_DESC",
      "CREATED_DESC",
      "CREATED_ASC",
      "NAME_ASC",
      "NAME_DESC",
    ])
    .optional()
    .catch(undefined),
  offset: z.coerce
    .number()
    .int()
    .min(0)
    .max(10_000)
    .optional()
    .catch(undefined)
    .transform((value) => (value === undefined ? undefined : String(value))),
});

export const Route = createFileRoute("/collections/$collectionId")({
  validateSearch: searchSchema,
  component: CollectionDetail,
});
