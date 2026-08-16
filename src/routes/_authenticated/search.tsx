import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { SearchPage } from "../../features/search/search-page.js";

const searchParamsSchema = z.object({
  q: z.string().trim().min(1).max(200).optional().catch(undefined),
});

export const Route = createFileRoute("/_authenticated/search")({
  validateSearch: searchParamsSchema,
  component: SearchPage,
});
