import { LoaderCircle } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import {
  twSearchTransitionBadge,
  twSearchTransitionContent,
} from "../../styles/archive-styles.js";

/** Delays non-critical activity affordances so fast searches do not flicker. */
function useDelayedSearchActivity(active: boolean, delay = 160) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!active) {
      setVisible(false);
      return;
    }
    const timeout = window.setTimeout(() => setVisible(true), delay);
    return () => window.clearTimeout(timeout);
  }, [active, delay]);

  return visible;
}

export function SearchActivity({
  active,
  label,
  className = "",
}: {
  active: boolean;
  label: string;
  className?: string;
}) {
  const visible = useDelayedSearchActivity(active);
  if (!visible) return null;

  return (
    <LoaderCircle
      className={`size-4 shrink-0 animate-spin text-muted-foreground motion-reduce:animate-none ${className}`}
      aria-label={label}
    />
  );
}

/**
 * Keeps useful search data readable during a query-key transition and marks it
 * as stale until fresh data has replaced it. This is presentation-only: query
 * ownership and caching remain with TanStack Query.
 */
export function SearchResultsTransition({
  active,
  children,
  hasPreviousResults,
  label = "Updating results",
  className = "",
}: {
  active: boolean;
  children: ReactNode;
  hasPreviousResults: boolean;
  label?: string;
  className?: string;
}) {
  const showActivity = useDelayedSearchActivity(active);
  const showingStaleResults = active && hasPreviousResults;

  return (
    <div
      className={`relative flex min-w-0 flex-col ${className}`}
      aria-busy={active}
    >
      <span className="sr-only" role="status">
        {showActivity ? label : null}
      </span>
      {showActivity && hasPreviousResults ? (
        <span className={twSearchTransitionBadge} aria-hidden="true">
          <LoaderCircle className="size-3 animate-spin motion-reduce:animate-none" />
          Updating
        </span>
      ) : null}
      <div
        className={`${twSearchTransitionContent} ${showingStaleResults ? "opacity-60" : "opacity-100"}`}
      >
        {children}
      </div>
    </div>
  );
}
