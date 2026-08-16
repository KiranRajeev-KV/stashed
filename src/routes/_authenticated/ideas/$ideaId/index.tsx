import { createFileRoute } from "@tanstack/react-router";

import { IdeaDetail } from "../../../../features/ideas/idea-detail.js";

export const Route = createFileRoute("/_authenticated/ideas/$ideaId/")({
  component: IdeaDetail,
});
