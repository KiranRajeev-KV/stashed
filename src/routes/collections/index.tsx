import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { CollectionsPage } from "../../features/collections/collections-page.js";

const searchSchema = z.object({
  scope: z
    .enum(["DISCOVER", "OWNED", "COLLABORATING"])
    .optional()
    .catch(undefined),
  q: z.string().trim().min(1).max(200).optional().catch(undefined),
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
});

export const Route = createFileRoute("/collections/")({
  validateSearch: searchSchema,
  component: CollectionsPage,
});
