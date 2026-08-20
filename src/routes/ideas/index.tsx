import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { IdeasFeed } from "../../features/ideas/ideas-feed.js";
import { IDEA_STATUSES } from "../../features/ideas/idea-status.js";

const tagSearchSchema = z
  .union([z.string().uuid(), z.array(z.string().uuid()).max(20)])
  .optional()
  .catch(undefined);

const ideasSearchSchema = z.object({
  q: z.string().trim().min(1).max(200).optional().catch(undefined),
  status: z.enum(IDEA_STATUSES).optional().catch(undefined),
  sort: z
    .enum([
      "UPDATED_DESC",
      "CREATED_DESC",
      "UPDATED_ASC",
      "CREATED_ASC",
      "BEST_MATCH",
    ])
    .optional()
    .catch(undefined),
  tag: tagSearchSchema.transform((value) => {
    if (!value) return undefined;
    const tags = [...new Set(Array.isArray(value) ? value : [value])].sort();
    return tags.length > 0 ? tags : undefined;
  }),
});

export const Route = createFileRoute("/ideas/")({
  validateSearch: ideasSearchSchema,
  component: IdeasFeed,
});
