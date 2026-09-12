import { Button } from "../ui/button.js";
import { buttonStyles } from "../ui/button-variants.js";
import {
  twSiteBrand,
  twSiteNavActions,
  twSiteNavError,
  twSiteNavLink,
  twSiteNavLinks,
  twSiteNavbar,
  twSiteNavbarInner,
  twSiteSessionLoading,
  twSkipLink,
} from "../../styles/navigation-styles.js";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowUpRight, Layers3, LogOut } from "lucide-react";
import {
  currentUserQueryKey,
  currentUserQueryOptions,
  githubLoginPath,
  logout,
  type CurrentUser,
} from "../../api/auth.js";
import { ThemeControl } from "../ui/theme-control.js";
import { UserIdentity } from "./user-identity.js";

export function Navbar({
  user: suppliedUser,
  contentId = "app-content",
}: {
  user?: CurrentUser;
  contentId?: string;
}) {
  const session = useQuery(currentUserQueryOptions());
  const user = suppliedUser ?? session.data;
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const signOut = useMutation({
    mutationFn: logout,
    onSuccess: async () => {
      // Discard cached private data when the account leaves.
      queryClient.clear();
      queryClient.setQueryData(currentUserQueryKey, null);
      await navigate({ to: "/", replace: true });
    },
  });

  return (
    <>
      <a href={`#${contentId}`} className={twSkipLink}>
        Skip to content
      </a>
      <header className={twSiteNavbar}>
        <div className={twSiteNavbarInner}>
          <Link to="/" className={twSiteBrand} aria-label="Stashed home">
            <Layers3 size={22} aria-hidden="true" />
            <span>
              stashed<span className="text-accent">.</span>
            </span>
          </Link>
          <nav className={twSiteNavLinks} aria-label="Primary">
            <Link to="/ideas" className={twSiteNavLink}>
              Ideas
            </Link>
          </nav>
          <div className={twSiteNavActions}>
            <ThemeControl variant="toggle" />
            {user ? (
              <>
                <UserIdentity user={user} />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  loading={signOut.isPending}
                  loadingLabel=""
                  onClick={() => signOut.mutate()}
                  disabled={signOut.isPending}
                  aria-label={signOut.isPending ? "Logging out" : "Log out"}
                  title="Log out"
                >
                  <LogOut size={16} aria-hidden="true" />
                </Button>
              </>
            ) : session.isPending ? (
              <span className={twSiteSessionLoading} role="status">
                Loading…
              </span>
            ) : (
              <a href={githubLoginPath} className={buttonStyles()}>
                Sign in <ArrowUpRight size={14} aria-hidden="true" />
              </a>
            )}
          </div>
        </div>
        {signOut.isError && (
          <p className={twSiteNavError} role="alert">
            Could not log out. Please try again.
          </p>
        )}
        {session.isError && !user && (
          <p className={twSiteNavError} role="status">
            Couldn't check your session.{" "}
            <Button
              variant="ghost"
              loading={session.isFetching}
              loadingLabel="Retrying…"
              onClick={() => session.refetch()}
            >
              Retry
            </Button>{" "}
            or sign in.
          </p>
        )}
      </header>
    </>
  );
}
