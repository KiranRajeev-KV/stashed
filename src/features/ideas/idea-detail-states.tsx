import { PageState } from "../../components/states/page-state.js";
import { Button } from "../../components/ui/button.js";
import { buttonStyles } from "../../components/ui/button-variants.js";
import { twAnimatePulse } from "../../styles/common-styles.js";
import {
  twIdeaBanner,
  twIdeaReader,
  twIdeaReaderContent,
  twIdeaReaderDocument,
  twIdeaReaderHeading,
  twIdeaReaderLayout,
  twIdeaReaderSidebar,
  twIdeaReaderToolbar,
} from "../../styles/idea-page-styles.js";
import { Link } from "@tanstack/react-router";
import { FileQuestion, RefreshCw } from "lucide-react";

export function IdeaDetailSkeleton() {
  return (
    <div
      aria-label="Loading idea"
      aria-live="polite"
      role="status"
      className={`${twIdeaReader} ${twAnimatePulse} motion-reduce:animate-none`}
    >
      <div className={twIdeaReaderToolbar} aria-hidden="true">
        <div className="h-11 w-28 rounded-control bg-surface-muted" />
        <div className="h-11 w-24 rounded-control bg-surface-muted" />
      </div>
      <div className={twIdeaBanner} aria-hidden="true" />
      <div className={twIdeaReaderLayout} aria-hidden="true">
        <div className={twIdeaReaderDocument}>
          <div className={`${twIdeaReaderHeading} space-y-4`}>
            <div className="h-3 w-16 rounded bg-surface-muted" />
            <div className="h-12 w-11/12 rounded-control bg-surface-muted" />
            <div className="h-12 w-3/5 rounded-control bg-surface-muted" />
            <div className="h-8 w-44 rounded-control bg-surface-muted" />
          </div>
          <div className={`${twIdeaReaderContent} space-y-4`}>
            <div className="h-4 w-full rounded bg-surface-muted" />
            <div className="h-4 w-11/12 rounded bg-surface-muted" />
            <div className="h-4 w-4/5 rounded bg-surface-muted" />
            <div className="h-4 w-9/12 rounded bg-surface-muted" />
          </div>
        </div>
        <div className={`${twIdeaReaderSidebar} space-y-5`}>
          <div className="h-4 w-16 rounded bg-surface-muted" />
          <div className="h-8 w-full rounded bg-surface-muted" />
          <div className="h-8 w-full rounded bg-surface-muted" />
          <div className="h-8 w-full rounded bg-surface-muted" />
        </div>
      </div>
    </div>
  );
}

type IdeaDetailErrorProps = {
  message: string;
  onRetry: () => void;
};

export function IdeaDetailError({ message, onRetry }: IdeaDetailErrorProps) {
  return (
    <PageState
      role="alert"
      label="Idea unavailable"
      icon={<RefreshCw />}
      title="This idea could not be opened."
      description={
        message ||
        "Stashed could not reach the ideas service. Please try again."
      }
      actions={
        <>
          <Button variant="primary" onClick={onRetry}>
            Try again
          </Button>
          <Link to="/ideas" className={buttonStyles({ variant: "ghost" })}>
            Back to ideas
          </Link>
        </>
      }
    />
  );
}

export function IdeaNotFound() {
  return (
    <PageState
      label="Idea unavailable"
      icon={<FileQuestion />}
      title="This idea isn’t available."
      description="It may be private, deleted, or the link may be incorrect."
      actions={
        <Link to="/ideas" className={buttonStyles({ variant: "primary" })}>
          Back to ideas
        </Link>
      }
    />
  );
}
