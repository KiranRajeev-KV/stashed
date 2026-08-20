import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, Outlet, useNavigate } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { useId, useState } from "react";

import {
  currentUserQueryKey,
  logout,
  type CurrentUser,
} from "../../api/auth.js";
import { ThemeControl } from "../ui/theme-control.js";

type AppShellProps = {
  user: CurrentUser;
};

const navLinkClass =
  "inline-flex min-h-11 items-center rounded-control px-3 text-sm font-medium text-muted-foreground transition-colors duration-(--duration-fast) hover:bg-surface-muted hover:text-foreground";

const activeNavLinkClass = "bg-surface-muted text-foreground";

function UserAvatar({ user }: AppShellProps) {
  const initials = user.displayName.trim().slice(0, 2).toUpperCase() || "ST";

  if (user.identity.avatarUrl) {
    return (
      <img
        src={user.identity.avatarUrl}
        alt=""
        width="32"
        height="32"
        className="size-8 shrink-0 rounded-full border border-border object-cover"
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className="grid size-8 shrink-0 place-items-center rounded-full bg-surface-muted font-mono text-xs font-medium text-muted-foreground"
    >
      {initials}
    </span>
  );
}

export function UserIdentity({ user }: AppShellProps) {
  const tooltipId = useId();
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const isTooltipVisible = !isDismissed && (isHovered || isFocused);

  return (
    <span
      className="user-identity"
      onMouseEnter={() => {
        setIsHovered(true);
        setIsDismissed(false);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        if (!isFocused) {
          setIsDismissed(false);
        }
      }}
    >
      <button
        type="button"
        className="user-identity-trigger"
        aria-describedby={tooltipId}
        onFocus={() => {
          setIsFocused(true);
          setIsDismissed(false);
        }}
        onBlur={() => {
          setIsFocused(false);
          if (!isHovered) {
            setIsDismissed(false);
          }
        }}
        onClick={() => setIsDismissed(false)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setIsDismissed(true);
          }
        }}
      >
        <UserAvatar user={user} />
        <span className="sr-only">Signed-in account</span>
      </button>
      <span
        id={tooltipId}
        role="tooltip"
        className="user-identity-tooltip"
        data-visible={isTooltipVisible ? "true" : "false"}
      >
        <span className="user-identity-tooltip-name">{user.displayName}</span>
        <span className="user-identity-tooltip-username">
          @{user.identity.username}
        </span>
      </span>
    </span>
  );
}

export function AppShell({ user }: AppShellProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: async () => {
      queryClient.setQueryData(currentUserQueryKey, null);
      await navigate({ to: "/", replace: true });
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <a href="#app-content" className="skip-link">
        Skip to content
      </a>
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto max-w-app px-gutter">
          <div className="flex min-h-15 items-center justify-between gap-3 border-b border-border py-2 md:min-h-16 md:border-b-0">
            <div className="flex min-w-0 items-center gap-4">
              <Link
                to="/ideas"
                className="shrink-0 text-2xl font-semibold tracking-tight text-foreground"
                aria-label="Stashed ideas"
              >
                Stashed<span className="text-accent">.</span>
              </Link>

              <nav
                aria-label="Primary"
                className="hidden items-center gap-1 md:flex"
              >
                <Link
                  to="/ideas"
                  className={navLinkClass}
                  activeProps={{
                    className: `${navLinkClass} ${activeNavLinkClass}`,
                  }}
                >
                  Ideas
                </Link>
              </nav>
            </div>

            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              <div className="hidden md:block">
                <ThemeControl variant="toggle" />
              </div>
              <UserIdentity user={user} />
              <button
                type="button"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
                className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-control border border-danger/20 bg-danger/10 px-2 text-sm font-medium text-danger transition-colors duration-(--duration-fast) hover:border-danger/30 hover:bg-danger/15 hover:text-danger disabled:cursor-wait disabled:opacity-60 sm:px-3"
              >
                <LogOut aria-hidden="true" size={16} strokeWidth={1.8} />
                {logoutMutation.isPending ? "Leaving…" : "Log out"}
              </button>
            </div>
          </div>

          <div className="flex min-h-14 items-center justify-between gap-2 md:hidden">
            <nav
              aria-label="Primary"
              className="flex min-w-0 items-center gap-1"
            >
              <Link
                to="/ideas"
                className={navLinkClass}
                activeProps={{
                  className: `${navLinkClass} ${activeNavLinkClass}`,
                }}
              >
                Ideas
              </Link>
            </nav>
            <div className="app-shell-mobile-theme">
              <ThemeControl variant="toggle" />
            </div>
          </div>
        </div>

        {logoutMutation.isError ? (
          <p
            role="alert"
            className="border-t border-danger/30 bg-danger/10 px-gutter py-2 text-center text-sm text-danger"
          >
            {logoutMutation.error.message || "Could not log out. Try again."}
          </p>
        ) : null}
      </header>

      <main
        id="app-content"
        tabIndex={-1}
        className="mx-auto w-full max-w-app px-gutter py-8 sm:py-10"
      >
        <Outlet />
      </main>
    </div>
  );
}
