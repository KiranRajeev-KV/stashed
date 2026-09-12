/** Shared action recipes. Keep navigation, menu options, and editor tools separate. */
export const twButtonBase = `ui-button inline-flex min-h-control shrink-0 items-center justify-center gap-2 rounded-control border px-4 py-2 font-sans text-ui font-medium leading-5 whitespace-nowrap cursor-pointer transition-colors duration-(--duration-fast) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 aria-busy:cursor-wait motion-reduce:transition-none [&_svg]:shrink-0`;
export const twButtonPrimary = `ui-button-primary border-transparent bg-primary text-primary-foreground hover:bg-primary/90`;
export const twButtonSecondary = `ui-button-secondary border-border bg-surface text-foreground hover:border-border-strong hover:bg-surface-muted`;
export const twButtonGhost = `ui-button-ghost border-transparent bg-transparent text-muted-foreground hover:bg-surface-muted hover:text-foreground`;
export const twButtonDestructive = `ui-button-destructive border-transparent bg-danger text-danger-foreground hover:bg-danger/90`;
export const twButtonIcon = `ui-button-icon size-control p-0`;
