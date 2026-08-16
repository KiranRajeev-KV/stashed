import { Link } from "@tanstack/react-router";

export function IdeasFeedSkeleton() {
  return (
    <div
      className="grid gap-4 md:grid-cols-2"
      aria-label="Loading ideas"
      aria-live="polite"
      role="status"
    >
      {Array.from({ length: 4 }, (_, index) => (
        <div
          key={index}
          className="idea-card min-h-72 animate-pulse motion-reduce:animate-none"
        >
          <div className="idea-card-margin" />
          <div className="idea-card-content">
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
        Index unavailable
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
        className="mt-5 min-h-11 rounded-control bg-primary px-5 font-medium text-primary-foreground transition-colors duration-(--duration-fast) hover:bg-primary/90"
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
      <section className="idea-empty-state">
        <p className="font-mono text-label uppercase text-accent">No match</p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight">
          No ideas fit these notes.
        </h2>
        <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
          Clear the filters to return to the complete index, or try a different
          status or tag.
        </p>
        <button
          type="button"
          onClick={onClearFilters}
          className="mt-6 min-h-11 rounded-control border border-border-strong bg-surface px-5 font-medium transition-colors duration-(--duration-fast) hover:bg-surface-muted"
        >
          Clear filters
        </button>
      </section>
    );
  }

  return (
    <section className="idea-empty-state">
      <p className="font-mono text-label uppercase text-accent">First page</p>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight">
        Your idea index is waiting.
      </h2>
      <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
        Capture the useful fragment now. It can become more complete the next
        time you return.
      </p>
      <Link
        to="/ideas/new"
        className="mt-6 inline-flex min-h-11 items-center rounded-control bg-primary px-5 font-medium text-primary-foreground transition-colors duration-(--duration-fast) hover:bg-primary/90"
      >
        Create your first idea
      </Link>
    </section>
  );
}
