import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";

import { currentUserQueryOptions, githubLoginPath } from "../../api/auth.js";
import { ThemeControl } from "../../components/ui/theme-control.js";

function LoginCallToAction() {
  const currentUserQuery = useQuery(currentUserQueryOptions());

  if (currentUserQuery.isPending) {
    return (
      <span
        className="inline-flex min-h-12 items-center rounded-control bg-surface-muted px-5 font-medium text-muted-foreground"
        role="status"
      >
        Checking your session…
      </span>
    );
  }

  if (currentUserQuery.data) {
    return (
      <Link
        to="/ideas"
        className="inline-flex min-h-12 items-center rounded-control bg-primary px-5 font-medium text-primary-foreground transition-transform duration-(--duration-fast) hover:-translate-y-0.5"
      >
        Open your ideas
        <span aria-hidden="true" className="ml-3 font-mono">
          →
        </span>
      </Link>
    );
  }

  return (
    <div>
      <a
        href={githubLoginPath}
        className="inline-flex min-h-12 items-center rounded-control bg-primary px-5 font-medium text-primary-foreground transition-transform duration-(--duration-fast) hover:-translate-y-0.5"
      >
        Continue with GitHub
        <span aria-hidden="true" className="ml-3 font-mono">
          →
        </span>
      </a>
      {currentUserQuery.isError ? (
        <p className="mt-3 max-w-sm text-sm text-danger" role="status">
          Session check failed. You can still sign in, or{" "}
          <button
            type="button"
            onClick={() => currentUserQuery.refetch()}
            className="font-medium underline decoration-danger/50 underline-offset-4"
          >
            try the check again
          </button>
          .
        </p>
      ) : null}
    </div>
  );
}

export function LandingPage() {
  return (
    <main className="landing-page min-h-screen overflow-hidden">
      <a href="#landing-content" className="skip-link">
        Skip to content
      </a>
      <header className="mx-auto flex w-full max-w-app items-center justify-between gap-4 px-gutter py-5 sm:py-7">
        <a
          href="#landing-content"
          className="text-2xl font-semibold tracking-tight text-foreground"
          aria-label="Stashed home"
        >
          Stashed<span className="text-accent">.</span>
        </a>
        <div className="sm:hidden">
          <ThemeControl variant="select" />
        </div>
        <div className="hidden sm:block">
          <ThemeControl />
        </div>
      </header>

      <section
        id="landing-content"
        tabIndex={-1}
        className="mx-auto w-full max-w-app px-gutter pb-16 pt-4 sm:pb-24 sm:pt-8"
      >
        <div className="notebook-spread">
          <article className="notebook-page notebook-page-primary">
            <div className="notebook-page-content">
              <p className="font-mono text-label uppercase text-accent">
                A working archive for unfinished thinking
              </p>
              <h1 className="mt-6 max-w-3xl text-display font-semibold">
                Keep the ideas that keep returning.
              </h1>
              <p className="mt-7 max-w-xl text-prose text-muted-foreground sm:text-lg">
                Stashed gives promising thoughts a durable place to land—then
                lets you tag, revisit, search, and develop them without forcing
                them into a finished shape too soon.
              </p>
              <div className="mt-9">
                <LoginCallToAction />
              </div>
              <p className="mt-5 font-mono text-xs text-muted-foreground">
                Public registration · GitHub authentication
              </p>
            </div>

            <aside className="margin-annotation margin-annotation-primary">
              <span className="annotation-mark" aria-hidden="true">
                01
              </span>
              <p>Capture the useful fragment before it disappears.</p>
            </aside>
          </article>

          <article
            className="notebook-page notebook-page-example"
            aria-label="Example Stashed idea"
          >
            <div className="notebook-page-content">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
                <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  Idea / 024
                </span>
                <span className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 font-mono text-xs font-medium text-primary">
                  Active
                </span>
              </div>

              <div className="mt-8">
                <p className="font-mono text-label uppercase text-accent">
                  Project note
                </p>
                <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
                  A local-first field guide for recurring systems problems
                </h2>
                <p className="mt-6 text-prose text-muted-foreground">
                  Keep the practical discoveries that are too specific for a
                  blog post and too valuable to leave buried in chat history.
                </p>
              </div>

              <div className="mt-9 border-l-2 border-accent pl-4">
                <p className="font-mono text-xs uppercase tracking-wider text-accent">
                  Next pass
                </p>
                <p className="mt-2 text-sm leading-relaxed">
                  Add a structure for symptoms, failed approaches, and the clue
                  that finally unlocked the problem.
                </p>
              </div>

              <ul
                className="mt-9 flex flex-wrap gap-2"
                aria-label="Example tags"
              >
                <li className="rounded-full bg-surface-muted px-3 py-1.5 font-mono text-xs">
                  developer-tools
                </li>
                <li className="rounded-full bg-surface-muted px-3 py-1.5 font-mono text-xs">
                  local-first
                </li>
                <li className="rounded-full bg-surface-muted px-3 py-1.5 font-mono text-xs">
                  writing
                </li>
              </ul>
            </div>

            <aside className="margin-annotation margin-annotation-example">
              <span className="annotation-mark" aria-hidden="true">
                02
              </span>
              <p>Return when the next connection appears.</p>
            </aside>
          </article>
        </div>

        <section
          className="landing-principles"
          aria-labelledby="principles-title"
        >
          <div>
            <p className="font-mono text-label uppercase text-accent">
              The method
            </p>
            <h2
              id="principles-title"
              className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl"
            >
              Ideas need room, not ceremony.
            </h2>
          </div>
          <ol className="grid gap-px overflow-hidden rounded-card border border-border bg-border sm:grid-cols-3">
            <li className="bg-surface p-5 sm:p-6">
              <span className="font-mono text-xs text-accent">
                01 / Collect
              </span>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Save a title and enough context to recognize the thought later.
              </p>
            </li>
            <li className="bg-surface p-5 sm:p-6">
              <span className="font-mono text-xs text-accent">
                02 / Develop
              </span>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Rework the note as evidence, questions, and useful edges emerge.
              </p>
            </li>
            <li className="bg-surface p-5 sm:p-6">
              <span className="font-mono text-xs text-accent">
                03 / Retrieve
              </span>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Use status, tags, and search to recover the right idea on
                demand.
              </p>
            </li>
          </ol>
        </section>
      </section>
    </main>
  );
}
