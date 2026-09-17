import { createFileRoute } from "@tanstack/react-router";
import { NewCollectionPage } from "../../../features/collections/new-collection-page.js";

export const Route = createFileRoute("/_authenticated/collections/new")({
  component: NewCollectionPage,
});
