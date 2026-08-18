import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { PublicArchiveShell } from "../components/layout/public-archive-shell.js";
import { SearchPage } from "../features/search/search-page.js";

const searchParamsSchema = z.object({
  q: z.string().trim().min(1).max(200).optional().catch(undefined),
});

function PublicSearchPage() {
  return (
    <PublicArchiveShell>
      <SearchPage />
    </PublicArchiveShell>
  );
}

export const Route = createFileRoute("/search")({
  validateSearch: searchParamsSchema,
  component: PublicSearchPage,
});
