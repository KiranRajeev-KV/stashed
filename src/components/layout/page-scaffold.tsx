type PageScaffoldProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function PageScaffold({
  eyebrow,
  title,
  description,
}: PageScaffoldProps) {
  return (
    <section className="max-w-reading">
      <p className="font-mono text-label uppercase text-accent">{eyebrow}</p>
      <h1 className="mt-3 text-page-title font-semibold">{title}</h1>
      <p className="mt-4 max-w-2xl text-prose text-muted-foreground">
        {description}
      </p>
    </section>
  );
}
