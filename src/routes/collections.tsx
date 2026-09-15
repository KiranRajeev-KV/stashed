import { Outlet, createFileRoute } from "@tanstack/react-router";
import { PublicArchiveShell } from "../components/layout/public-archive-shell.js";

export const Route = createFileRoute("/collections")({
  component: () => (
    <PublicArchiveShell>
      <Outlet />
    </PublicArchiveShell>
  ),
});
