import { createFileRoute } from "@tanstack/react-router";

import { IdeaDetail } from "../../features/ideas/idea-detail.js";

export const Route = createFileRoute("/ideas/$ideaId")({
  component: IdeaDetail,
});
