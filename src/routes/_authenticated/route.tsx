import { createFileRoute, redirect } from "@tanstack/react-router";

import { currentUserQueryOptions } from "../../api/auth.js";
import { AuthenticatedAppShell } from "../../components/layout/authenticated-app-shell.js";
import {
  AuthErrorScreen,
  AuthLoadingScreen,
} from "../../components/states/auth-route-states.js";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ context }) => {
    const currentUser = await context.queryClient.ensureQueryData(
      currentUserQueryOptions(),
    );

    if (!currentUser) {
      throw redirect({ to: "/", replace: true });
    }

    return { currentUser };
  },
  component: AuthenticatedAppShell,
  pendingComponent: AuthLoadingScreen,
  pendingMs: 0,
  pendingMinMs: 180,
  errorComponent: AuthErrorScreen,
});
