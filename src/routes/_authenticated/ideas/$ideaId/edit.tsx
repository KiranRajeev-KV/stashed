import { createFileRoute } from "@tanstack/react-router";

import { EditIdeaPage } from "../../../../features/ideas/idea-form-pages.js";

export const Route = createFileRoute("/_authenticated/ideas/$ideaId/edit")({
  component: EditIdeaPage,
});
