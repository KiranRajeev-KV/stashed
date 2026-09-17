import type { ReactNode } from "react";

import {
  twResourcePageActions,
  twResourcePageContext,
  twResourcePageSaveState,
  twResourcePageToolbar,
  twResourcePageToolbarSticky,
} from "../../styles/idea-page-styles.js";

/** Shared resource header for Idea and Collection routes. */
export function ResourcePageToolbar({
  breadcrumbs,
  actions,
  status,
  sticky = false,
}: {
  breadcrumbs: ReactNode;
  actions: ReactNode;
  status?: string;
  sticky?: boolean;
}) {
  return (
    <header
      className={`${twResourcePageToolbar}${sticky ? ` ${twResourcePageToolbarSticky}` : ""}`}
    >
      <div className={twResourcePageContext}>
        {breadcrumbs}
        {status ? (
          <span className={twResourcePageSaveState} aria-live="polite">
            {status}
          </span>
        ) : null}
      </div>
      <div className={twResourcePageActions}>{actions}</div>
    </header>
  );
}
