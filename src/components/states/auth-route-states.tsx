import type { ErrorComponentProps } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";

export function AuthLoadingScreen() {
  return (
    <main className="grid min-h-screen place-items-center px-gutter">
      <div className="w-full max-w-sm" role="status">
        <p className="font-semibold tracking-tight">
          Stashed<span className="text-accent">.</span>
        </p>
        <div className="mt-6 h-1 overflow-hidden rounded-full bg-surface-muted">
          <span className="auth-loading-line block h-full w-1/2 rounded-full bg-primary" />
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          Checking your session…
        </p>
      </div>
    </main>
  );
}

export function AuthErrorScreen({ error, reset }: ErrorComponentProps) {
  return (
    <main className="grid min-h-screen place-items-center px-gutter py-16">
      <section className="w-full max-w-reading border-l-2 border-danger pl-6 sm:pl-10">
        <p className="font-mono text-label uppercase text-danger">
          Session unavailable
        </p>
        <h1 className="mt-3 text-page-title font-semibold">
          We could not check your sign-in.
        </h1>
        <p className="mt-4 max-w-xl text-prose text-muted-foreground">
          {error.message || "Stashed could not reach the session service."}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={reset}
            className="min-h-11 rounded-control bg-primary px-5 font-medium text-primary-foreground"
          >
            Try again
          </button>
          <Link
            to="/"
            className="inline-flex min-h-11 items-center rounded-control border border-border bg-surface px-5 font-medium"
          >
            Return home
          </Link>
        </div>
      </section>
    </main>
  );
}
