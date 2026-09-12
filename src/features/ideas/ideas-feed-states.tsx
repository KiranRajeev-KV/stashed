import { buttonStyles } from "../../components/ui/button-variants.js";
import { twAnimatePulse } from "../../styles/common-styles.js";
import {
  twArchiveCardGrid,
  twArchiveStateIcon,
  twIdeaCard,
  twIdeaCardContent,
  twIdeaCardMargin,
  twIdeaEmptyState,
} from "../../styles/archive-styles.js";
import { Link } from "@tanstack/react-router";
import { Lightbulb, ListFilter } from "lucide-react";

export function IdeasFeedSkeleton() {
  return (
    <div
      className={twArchiveCardGrid}
      aria-label="Loading ideas"
      aria-live="polite"
      role="status"
    >
      {Array.from({ length: 4 }, (_, index) => (
        <div
          key={index}
          className={`${twIdeaCard} min-h-72 ${twAnimatePulse} motion-reduce:animate-none`}
        >
          <div className={twIdeaCardMargin} />
          <div className={twIdeaCardContent}>
            <div className="h-6 w-20 rounded-full bg-surface-muted" />
            <div className="mt-5 h-7 w-4/5 rounded-control bg-surface-muted" />
            <div className="mt-3 h-7 w-3/5 rounded-control bg-surface-muted" />
            <div className="mt-6 space-y-2">
              <div className="h-3 w-full rounded-full bg-surface-muted" />
              <div className="h-3 w-11/12 rounded-full bg-surface-muted" />
              <div className="h-3 w-2/3 rounded-full bg-surface-muted" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

type IdeasErrorStateProps = {
  message: string;
  onRetry: () => void;
};

export function IdeasErrorState({ message, onRetry }: IdeasErrorStateProps) {
  return (
    <section
      className="border-l-2 border-danger bg-danger/5 px-5 py-6 sm:px-7"
      role="alert"
    >
      <p className="font-mono text-label uppercase text-danger">
        Archive unavailable
      </p>
      <h2 className="mt-2 text-xl font-semibold">
        The ideas could not be opened.
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
        {message || "Stashed could not reach the ideas service."}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className={buttonStyles({ variant: "primary", className: "mt-5" })}
      >
        Try again
      </button>
    </section>
  );
}

type IdeasEmptyStateProps = {
  filtered: boolean;
  onClearFilters: () => void;
};

export function IdeasEmptyState({
  filtered,
  onClearFilters,
}: IdeasEmptyStateProps) {
  if (filtered) {
    return (
      <section className={twIdeaEmptyState}>
        <ListFilter className={twArchiveStateIcon} aria-hidden="true" />
        <p className="font-mono text-label uppercase text-accent">No match</p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight">
          No ideas match these filters.
        </h2>
        <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
          Clear the filters to browse everything the group has saved, or try a
          different status or set of tags.
        </p>
        <button
          type="button"
          onClick={onClearFilters}
          className={buttonStyles({ variant: "secondary", className: "mt-6" })}
        >
          Clear filters
        </button>
      </section>
    );
  }

  return (
    <section className={twIdeaEmptyState}>
      <Lightbulb className={twArchiveStateIcon} aria-hidden="true" />
      <p className="font-mono text-label uppercase text-accent">
        Nothing saved yet
      </p>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight">
        Every collection starts with a little spark.
      </h2>
      <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
        Save enough of a thought to make it recognizable. You—or someone else in
        the group—can find it again when it becomes useful.
      </p>
      <Link
        to="/ideas/new"
        className={buttonStyles({ variant: "primary", className: "mt-6" })}
      >
        Create your first idea
      </Link>
    </section>
  );
}
