import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import type { ReactNode } from "react";

import {
  currentUserQueryKey,
  currentUserQueryOptions,
  githubLoginPath,
  logout,
} from "../../api/auth.js";
import { UserIdentity } from "./app-shell.js";
import { ThemeControl } from "../ui/theme-control.js";

type PublicArchiveShellProps = {
  children: ReactNode;
};

function ArchiveAccountAction() {
  const currentUserQuery = useQuery(currentUserQueryOptions());
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: async () => {
      queryClient.setQueryData(currentUserQueryKey, null);
      await navigate({ to: "/", replace: true });
    },
  });

  if (currentUserQuery.isPending) {
    return (
      <span
        className="h-10 w-16 animate-pulse rounded-control bg-surface-muted"
        role="status"
      >
        <span className="sr-only">Checking your session…</span>
      </span>
    );
  }

  if (currentUserQuery.data) {
    return (
      <div className="flex items-center gap-2">
        <span className="hidden sm:block">
          <UserIdentity user={currentUserQuery.data} />
        </span>
        <button
          type="button"
          aria-label="Log out"
          onClick={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-control border border-danger/20 bg-danger/10 px-3 text-sm font-medium text-danger transition-colors duration-(--duration-fast) hover:border-danger/30 hover:bg-danger/15 hover:text-danger disabled:cursor-wait disabled:opacity-60"
        >
          <LogOut aria-hidden="true" size={16} strokeWidth={1.8} />
          <span className="hidden sm:inline">
            {logoutMutation.isPending ? "Leaving…" : "Log out"}
          </span>
        </button>
      </div>
    );
  }

  return (
    <a
      href={githubLoginPath}
      className="inline-flex min-h-10 items-center rounded-control bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors duration-(--duration-fast) hover:bg-primary/90 sm:px-4"
    >
      Sign in
    </a>
  );
}

export function PublicArchiveShell({ children }: PublicArchiveShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <a href="#app-content" className="skip-link">
        Skip to content
      </a>
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto max-w-app px-gutter">
          <div className="flex min-h-15 items-center justify-between gap-3 py-2 md:min-h-16">
            <div className="flex min-w-0 items-center gap-3 sm:gap-5">
              <Link
                to="/"
                className="shrink-0 text-2xl font-semibold tracking-tight text-foreground"
                aria-label="Stashed home"
              >
                Stashed<span className="text-accent">.</span>
              </Link>
              <nav
                className="hidden items-center gap-1 md:flex"
                aria-label="Primary"
              >
                <Link
                  to="/ideas"
                  className="inline-flex min-h-10 items-center rounded-control px-3 text-sm font-medium text-muted-foreground transition-colors duration-(--duration-fast) hover:bg-surface-muted hover:text-foreground"
                  activeProps={{
                    className:
                      "inline-flex min-h-10 items-center rounded-control bg-surface-muted px-3 text-sm font-medium text-foreground",
                  }}
                >
                  Ideas
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <ThemeControl variant="toggle" />
              <ArchiveAccountAction />
            </div>
          </div>
          <nav
            className="flex min-h-13 items-center gap-1 border-t border-border md:hidden"
            aria-label="Primary"
          >
            <Link
              to="/ideas"
              className="inline-flex min-h-10 items-center rounded-control px-3 text-sm font-medium text-muted-foreground transition-colors duration-(--duration-fast) hover:bg-surface-muted hover:text-foreground"
              activeProps={{
                className:
                  "inline-flex min-h-10 items-center rounded-control bg-surface-muted px-3 text-sm font-medium text-foreground",
              }}
            >
              Ideas
            </Link>
          </nav>
        </div>
      </header>
      <main
        id="app-content"
        tabIndex={-1}
        className="mx-auto w-full max-w-app px-gutter py-8 sm:py-10"
      >
        {children}
      </main>
    </div>
  );
}
