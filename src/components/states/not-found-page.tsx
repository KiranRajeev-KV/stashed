import { Link } from "@tanstack/react-router";

export function NotFoundPage() {
  return (
    <main className="grid min-h-screen place-items-center px-gutter py-16">
      <section className="w-full max-w-reading border-l-2 border-accent pl-6 sm:pl-10">
        <p className="font-mono text-label uppercase text-accent">
          404 / Misfiled
        </p>
        <h1 className="mt-3 text-page-title font-semibold">
          That page is not in this archive.
        </h1>
        <p className="mt-4 max-w-xl text-prose text-muted-foreground">
          The address may have changed, or the idea may have been moved.
        </p>
        <Link
          to="/"
          className="mt-8 inline-flex min-h-11 items-center rounded-control bg-primary px-5 font-medium text-primary-foreground transition-colors duration-(--duration-fast) hover:bg-primary/90"
        >
          Return home
        </Link>
      </section>
    </main>
  );
}
