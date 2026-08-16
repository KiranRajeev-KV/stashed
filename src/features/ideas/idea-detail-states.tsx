import { Link } from "@tanstack/react-router";

export function IdeaDetailSkeleton() {
  return (
    <div
      aria-label="Loading idea"
      aria-live="polite"
      role="status"
      className="animate-pulse motion-reduce:animate-none"
    >
      <div className="h-4 w-28 rounded-full bg-surface-muted" />
      <div className="mt-8 max-w-3xl space-y-3">
        <div className="h-10 w-11/12 rounded-control bg-surface-muted sm:h-12" />
        <div className="h-10 w-3/5 rounded-control bg-surface-muted sm:h-12" />
      </div>
      <div className="mt-7 h-10 w-64 max-w-full rounded-control bg-surface-muted" />
      <div className="idea-detail-sheet mt-10 min-h-96">
        <div className="idea-detail-margin" />
        <div className="idea-detail-paper space-y-4">
          <div className="h-4 w-full rounded-full bg-surface-muted" />
          <div className="h-4 w-11/12 rounded-full bg-surface-muted" />
          <div className="h-4 w-4/5 rounded-full bg-surface-muted" />
          <div className="h-4 w-9/12 rounded-full bg-surface-muted" />
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
    <section
      className="border-l-2 border-danger bg-danger/5 px-5 py-8 sm:px-8"
      role="alert"
    >
      <p className="font-mono text-label uppercase text-danger">
        Note unavailable
      </p>
      <h1 className="mt-3 text-page-title font-semibold">
        This idea could not be opened.
      </h1>
      <p className="mt-4 max-w-xl text-prose text-muted-foreground">
        {message || "Stashed could not reach the ideas service."}
      </p>
      <div className="mt-7 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onRetry}
          className="min-h-11 rounded-control bg-primary px-5 font-medium text-primary-foreground transition-colors duration-(--duration-fast) hover:bg-primary/90"
        >
          Try again
        </button>
        <Link
          to="/ideas"
          className="inline-flex min-h-11 items-center rounded-control border border-border-strong bg-surface px-5 font-medium hover:bg-surface-muted"
        >
          Back to ideas
        </Link>
      </div>
    </section>
  );
}

export function IdeaNotFound() {
  return (
    <section className="border-l-2 border-accent px-5 py-8 sm:px-8">
      <p className="font-mono text-label uppercase text-accent">
        404 / Misfiled
      </p>
      <h1 className="mt-3 text-page-title font-semibold">
        That idea is not in the index.
      </h1>
      <p className="mt-4 max-w-xl text-prose text-muted-foreground">
        It may have been deleted, or the address may no longer point to a saved
        note.
      </p>
      <Link
        to="/ideas"
        className="mt-7 inline-flex min-h-11 items-center rounded-control bg-primary px-5 font-medium text-primary-foreground hover:bg-primary/90"
      >
        Return to ideas
      </Link>
    </section>
  );
}
