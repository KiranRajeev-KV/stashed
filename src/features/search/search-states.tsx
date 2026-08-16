import { Link } from "@tanstack/react-router";
import { Search, SearchX } from "lucide-react";

export function SearchPromptState() {
  return (
    <section className="search-empty-state">
      <Search aria-hidden="true" className="search-empty-icon" />
      <p className="font-mono text-label uppercase text-accent">
        Open the index
      </p>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight wrap-anywhere">
        What thread are you looking for?
      </h2>
      <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
        Search the words you remember from a title or note. Short fragments are
        often enough to find your way back.
      </p>
    </section>
  );
}

export function SearchNoResultsState({ query }: { query: string }) {
  return (
    <section className="search-empty-state">
      <SearchX aria-hidden="true" className="search-empty-icon" />
      <p className="font-mono text-label uppercase text-accent">No match</p>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight">
        Nothing surfaced for “{query}”.
      </h2>
      <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
        Try fewer or more specific words, check the spelling, or return to the
        idea index and browse by status or tag.
      </p>
      <Link
        to="/ideas"
        className="mt-6 inline-flex min-h-11 items-center rounded-control border border-border-strong bg-surface px-5 font-medium transition-colors duration-(--duration-fast) hover:bg-surface-muted"
      >
        Browse all ideas
      </Link>
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
        The index could not be searched.
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
          className="search-result-card min-h-56 animate-pulse motion-reduce:animate-none"
        >
          <div className="search-result-margin" />
          <div className="search-result-content">
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
