import { Outlet, createFileRoute } from "@tanstack/react-router";

import { PublicArchiveShell } from "../components/layout/public-archive-shell.js";

function PublicIdeasLayout() {
  return (
    <PublicArchiveShell>
      <Outlet />
    </PublicArchiveShell>
  );
}

export const Route = createFileRoute("/ideas")({
  component: PublicIdeasLayout,
});
