import { SearchX } from "lucide-react";

export function SearchNoResultsState({ query }: { query: string }) {
  return (
    <section className="search-empty-state">
      <SearchX aria-hidden="true" className="search-empty-icon" />
      <p className="font-mono text-label uppercase text-accent">No match</p>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight">
        Nothing surfaced for “{query}”.
      </h2>
      <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
        Try fewer or more specific words, check the spelling, or adjust the
        filters above.
      </p>
    </section>
  );
}

export function SearchErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <section
      className="border-l-2 border-danger bg-danger/5 px-5 py-6 sm:px-7"
      role="alert"
    >
      <p className="font-mono text-label uppercase text-danger">
        Search unavailable
      </p>
      <h2 className="mt-2 text-xl font-semibold">
        The shared archive could not be searched.
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
        {message || "Stashed could not reach the search service."}
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

export function SearchResultsSkeleton() {
  return (
    <div
      className="grid gap-4"
      aria-label="Searching ideas"
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
