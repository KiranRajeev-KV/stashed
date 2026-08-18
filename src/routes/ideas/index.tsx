import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { IdeasFeed } from "../../features/ideas/ideas-feed.js";
import { IDEA_STATUSES } from "../../features/ideas/idea-status.js";

const tagSearchSchema = z
  .union([z.string().uuid(), z.array(z.string().uuid()).max(20)])
  .optional()
  .catch(undefined);

const ideasSearchSchema = z.object({
  status: z.enum(IDEA_STATUSES).optional().catch(undefined),
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
