/** Tailwind recipes for dialogs. Named hooks support scoped descendant variants. */

export const twDeleteDialogOverlay = `
delete-dialog-overlay fixed inset-0 z-[79]
data-[state=open]:animate-[dialog-overlay-in_var(--duration-standard)_var(--motion-standard)]
data-[state=closed]:animate-[dialog-overlay-out_var(--duration-fast)_var(--motion-standard)]
motion-reduce:animate-none
`;

export const twDeleteDialogContent = `
delete-dialog-content fixed left-1/2 top-1/2 z-[80] max-h-[calc(100dvh-2rem)] overflow-y-auto
[transform:translate(-50%,-50%)]
data-[state=open]:animate-[dialog-content-in_var(--duration-standard)_var(--motion-emphasized)]
data-[state=closed]:animate-[dialog-content-out_var(--duration-fast)_var(--motion-standard)]
motion-reduce:animate-none
`;

export const twDeleteDialogTitle = `
delete-dialog-title m-0 font-sans text-xl font-emphasis leading-heading tracking-tight text-foreground
`;

export const twDeleteDialogDescription = `
delete-dialog-description mt-3 grid gap-2 font-sans text-ui leading-relaxed text-muted-foreground
`;

export const twDeleteDialogIdeaTitle = `
delete-dialog-idea-title text-foreground font-editor font-medium wrap-anywhere
`;

export const twDeleteDialogActions = `
delete-dialog-actions mt-6 flex flex-wrap justify-end gap-2 max-phone:[&_.ui-button]:flex-1
`;

export const twUiDialogBackdrop = `
ui-dialog-backdrop bg-black/42 backdrop-blur-[3px] motion-reduce:animate-none
motion-reduce:transition-none
`;

export const twUiDialogPanel = `
ui-dialog-panel w-[min(calc(100%-2rem),27.5rem)] rounded-dialog border border-border
bg-surface-elevated p-6 max-phone:p-5 overscroll-contain wrap-anywhere font-sans text-foreground shadow-dialog motion-reduce:animate-none
motion-reduce:transition-none
`;

export const twUiDialogSheet = `
ui-dialog-sheet [&]:border [&]:border-border [&]:bg-surface-elevated [&]:text-foreground
[&]:font-sans [&]:shadow-dialog [&]:rounded-[12px_12px_0_0] [&]:border-b-0
[&_>_div:first-child]:border-border [&_>_div:first-child]:px-6 [&_h2]:font-sans [&_h2]:font-emphasis
[&_h2]:not-italic [&_h2]:text-xl [&_h2]:leading-heading [&_h2]:tracking-tight [&_p]:text-ui
[&_p]:leading-relaxed [&_button[aria-pressed]]:min-h-control [&_button[aria-pressed]]:text-ui
[&_button[aria-pressed='true']]:font-medium [&_button[aria-pressed='true']]:bg-surface-muted
[&_button[aria-pressed]:focus-visible]:[outline:2px_solid_var(--ring)]
[&_button[aria-pressed]:focus-visible]:[outline-offset:-2px] motion-reduce:[&]:animate-none
motion-reduce:[&]:transition-none
`;

/** A responsive, right-aligned editing surface for resource metadata. */
export const twResourceEditSheetBackdrop = `
resource-edit-sheet-backdrop fixed inset-0 z-[49] bg-foreground/35 backdrop-blur-[2px]
opacity-100 transition-opacity duration-(--duration-standard) data-[ending-style]:opacity-0
data-[starting-style]:opacity-0 motion-reduce:transition-none
`;

export const twResourceEditSheet = `
resource-edit-sheet fixed inset-y-0 right-0 z-[50] flex h-dvh w-full min-w-0 flex-col overflow-hidden
border-l border-border bg-surface-elevated text-foreground shadow-dialog transition-transform
duration-(--duration-slow) ease-emphasized data-[ending-style]:translate-x-full
data-[starting-style]:translate-x-full motion-reduce:transition-none sm:w-[min(32rem,calc(100dvw-2rem))]
`;

/** A wider resource sheet for search-and-select workflows with richer rows. */
export const twResourceEditSheetWide = `
sm:w-[min(42rem,calc(100dvw-2rem))]
`;

export const twResourceEditSheetHeader = `
resource-edit-sheet-header flex shrink-0 items-start justify-between gap-4 border-b border-border-subtle
px-5 py-4 sm:px-6
`;

export const twResourceEditSheetFooter = `
resource-edit-sheet-footer relative z-10 shrink-0 border-t border-border-subtle bg-surface-elevated px-5 py-4 sm:px-6
`;
