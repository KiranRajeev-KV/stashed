import { createFileRoute } from "@tanstack/react-router";

import { CreateIdeaPage } from "../../../features/ideas/idea-form-pages.js";

export const Route = createFileRoute("/_authenticated/ideas/new")({
  component: CreateIdeaPage,
});
