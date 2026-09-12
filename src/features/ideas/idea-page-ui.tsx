import {
  twIdeaPageActions,
  twIdeaPageBreadcrumb,
  twIdeaPageCurrent,
  twIdeaPageSaveState,
  twIdeaPageToolbar,
  twIdeaPageToolbarSticky,
  twIdeaTagLink,
} from "../../styles/idea-page-styles.js";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Hash } from "lucide-react";
import type { ReactNode } from "react";

export function IdeaPageToolbar({
  title,
  actions,
  onBack,
  backLabel = "Ideas",
  status,
  disabled,
  sticky = false,
}: {
  title: string;
  actions: ReactNode;
  onBack?: () => void;
  backLabel?: string;
  status?: string;
  disabled?: boolean;
  sticky?: boolean;
}) {
  const backContent = (
    <>
      <ArrowLeft size={15} aria-hidden="true" />
      {backLabel}
    </>
  );
  return (
    <header
      className={`${twIdeaPageToolbar}${sticky ? ` ${twIdeaPageToolbarSticky}` : ""}`}
    >
      <nav className={twIdeaPageBreadcrumb} aria-label="Breadcrumb">
        {onBack ? (
          <button type="button" disabled={disabled} onClick={onBack}>
            {backContent}
          </button>
        ) : (
          <Link to="/ideas">{backContent}</Link>
        )}
        <span aria-hidden="true">/</span>
        <span className={twIdeaPageCurrent} aria-current="page" title={title}>
          {title}
        </span>
        {status ? (
          <span className={twIdeaPageSaveState} aria-live="polite">
            {status}
          </span>
        ) : null}
      </nav>
      <div className={twIdeaPageActions}>{actions}</div>
    </header>
  );
}

export function IdeaTagLink({ tag }: { tag: { id: string; name: string } }) {
  return (
    <Link to="/ideas" search={{ tag: tag.id }} className={twIdeaTagLink}>
      <Hash size={12} aria-hidden="true" />
      <span>{tag.name}</span>
    </Link>
  );
}
