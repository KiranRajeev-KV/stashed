/** Tailwind recipes for common. Named hooks support scoped descendant variants. */

export const twStashedToast = `
stashed-toast data-sonner-toast:border-border-strong! data-sonner-toast:rounded-card!
data-sonner-toast:bg-surface-elevated! data-sonner-toast:text-foreground!
data-sonner-toast:shadow-overlay! data-sonner-toast:font-sans!
`;

export const twStashedToastDescription = `
stashed-toast-description in-data-sonner-toast:text-muted-foreground!
`;

export const twStashedToastClose = `
stashed-toast-close in-data-sonner-toast:border-border! in-data-sonner-toast:bg-surface-muted!
in-data-sonner-toast:text-foreground!
`;

export const twAnimatePulse = `
animate-pulse motion-reduce:[&]:animate-none!
`;

/** Shared title/name input treatment for full-page creation flows. */
export const twFormTitleInput = `
form-title-input resize-y rounded-control border border-border bg-surface px-3 py-2.5 text-foreground
shadow-control outline-none placeholder:text-muted-foreground/60 focus:border-ring focus:ring-2
focus:ring-ring/20
`;
