import { z } from "zod";
import { createFileRoute } from "@tanstack/react-router";

import { IdeaDetail } from "../../features/ideas/idea-detail.js";

export const Route = createFileRoute("/ideas/$ideaId")({
  validateSearch: z.object({
    collectionId: z.string().uuid().optional().catch(undefined),
  }),
  component: IdeaDetail,
});
