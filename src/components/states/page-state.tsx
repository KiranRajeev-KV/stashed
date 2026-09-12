import { useId, type ReactNode } from "react";

type PageStateProps = {
  label: string;
  title: string;
  description: ReactNode;
  actions?: ReactNode;
  icon?: ReactNode;
  role?: "alert" | "status";
};

/** Shared recovery surface for full-page and in-shell route states. */
export function PageState({
  label,
  title,
  description,
  actions,
  icon,
  role,
}: PageStateProps) {
  const titleId = useId();
  return (
    <section
      aria-labelledby={titleId}
      className="w-full rounded-card border border-border-subtle bg-surface p-6 sm:p-10 lg:p-12"
    >
      <div
        role={role}
        aria-atomic={role ? true : undefined}
        className="max-w-xl"
      >
        <p className="flex items-center gap-2 font-sans text-metadata text-muted-foreground">
          {icon ? (
            <span aria-hidden="true" className="flex shrink-0 [&_svg]:size-4">
              {icon}
            </span>
          ) : null}
          {label}
        </p>
        <h1
          id={titleId}
          className="mt-4 font-display text-3xl font-normal leading-tight tracking-tight text-foreground text-balance sm:text-4xl"
        >
          {title}
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground wrap-anywhere">
          {description}
        </p>
      </div>
      {actions ? (
        <div className="mt-6 flex flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </section>
  );
}

/** Avoid session-dependent navigation while authentication is unresolved. */
export function StandaloneStateLayout({ children }: { children: ReactNode }) {
  return (
    <main className="grid min-h-dvh place-items-center bg-background px-gutter py-12 text-foreground sm:py-16">
      <div className="w-full max-w-reading">{children}</div>
    </main>
  );
}
