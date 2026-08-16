import { getRouteApi } from "@tanstack/react-router";

import { AppShell } from "./app-shell.js";

const authenticatedRoute = getRouteApi("/_authenticated");

export function AuthenticatedAppShell() {
  const { currentUser } = authenticatedRoute.useRouteContext();
  return <AppShell user={currentUser} />;
}
