import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { IdeasFeed } from "../../../features/ideas/ideas-feed.js";
import { IDEA_STATUSES } from "../../../features/ideas/idea-status.js";

const ideasSearchSchema = z.object({
  status: z.enum(IDEA_STATUSES).optional().catch(undefined),
  tag: z.string().uuid().optional().catch(undefined),
});

export const Route = createFileRoute("/_authenticated/ideas/")({
  validateSearch: ideasSearchSchema,
  component: IdeasFeed,
});
