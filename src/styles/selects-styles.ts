/** Tailwind recipes for selects. Named hooks support scoped descendant variants. */

export const twIdeaVisibilityTrigger = `
idea-visibility inline-flex items-center gap-1.5 cursor-pointer
[&.idea-visibility]:min-h-8 [&.idea-visibility]:border-0 [&.idea-visibility]:bg-transparent
[&.idea-visibility]:shadow-none [&.idea-visibility]:px-1.75 [&.idea-visibility]:text-metadata
[&.idea-visibility]:text-muted-foreground [&.idea-visibility:hover]:bg-surface-muted
[&.idea-visibility[data-popup-open]]:bg-surface-muted [&_svg]:size-3.5
[@media(pointer:_coarse)]:[&.idea-visibility]:min-h-control
`;

export const twTagSelector = `
tag-selector [&[data-invalid]]:border-danger relative min-w-0 border border-border rounded-control
bg-surface
[transition:border-color_var(--duration-fast)_var(--motion-standard),_box-shadow_var(--duration-fast)_var(--motion-standard)]
[&:focus-within]:[box-shadow:0_0_0_2px_color-mix(in_srgb,_var(--ring)_30%,_transparent)]
[&]:min-h-control [&]:rounded-control
`;

export const twTagSelectorInputRow = `
tag-selector-input-row flex min-h-12 min-w-0 flex-wrap items-center gap-[0.4rem] p-[0.4rem]
[&_>_input]:min-h-9 [&_>_input]:min-w-0 [&_>_input]:max-w-full [&_>_input]:[flex:1_1_12rem] [&_>_input]:border-0
[&_>_input]:[outline:0] [&_>_input]:bg-transparent [&_>_input]:px-[0.4rem]
[&_>_input]:text-foreground [&_>_input:disabled]:cursor-not-allowed
[&_>_input:disabled]:text-muted-foreground
`;

export const twTagToken = `
tag-token inline-flex min-h-8 max-w-full items-center gap-1 border border-border rounded-full
bg-surface-muted pl-[0.65rem] text-foreground font-mono text-metadata [&_>_span]:max-w-56
[&_>_span]:min-w-0 [&_>_span]:wrap-anywhere [&_button]:shrink-0 [&_button]:grid
[&_button]:min-h-8 [&_button]:w-8 [&_button]:place-items-center [&_button]:rounded-full
[&_button]:text-muted-foreground [&_button:hover]:text-danger [&_svg]:w-3.5 [&_svg]:h-3.5
[&]:rounded-[5px] [&]:font-sans [&]:text-metadata [@media(pointer:_coarse)]:min-h-control [@media(pointer:_coarse)]:[&_button]:min-h-control [@media(pointer:_coarse)]:[&_button]:w-11
`;

export const twTagSelectorLoader = `
tag-selector-loader w-3.5 h-3.5 [flex:none] mr-[0.6rem] [animation:form-spin_0.8s_linear_infinite]
text-muted-foreground motion-reduce:[&]:animate-none
`;

export const twTagSelectorMenu = `
tag-selector-menu absolute z-30 top-[calc(100%_+_0.4rem)] right-0 left-0 max-h-68 overflow-y-auto
border border-border-strong rounded-card bg-surface-elevated p-[0.35rem] shadow-overlay [&]:border
[&]:border-border [&]:rounded-[9px] [&]:bg-surface-elevated [&]:text-foreground
[&]:[box-shadow:0_0_0_1px_rgb(0_0_0_/_0.02),_0_4px_8px_rgb(0_0_0_/_0.06),_0_16px_40px_rgb(0_0_0_/_0.12)]
[&]:font-sans [&]:text-ui [&]:p-[5px]
`;

export const twTagSelectorOption = `
tag-selector-option flex min-h-control w-full items-center justify-between gap-4 rounded-control
py-[0.55rem] px-[0.7rem] text-left wrap-anywhere [&_>_span:first-child]:min-w-0
[&[aria-selected='true']]:bg-surface-muted [&]:min-h-9 [&]:rounded-[5px] [&]:py-2 [&]:px-2.5
[&]:font-sans [&]:text-ui [&]:leading-normal [&]:font-normal [&]:text-foreground [&]:gap-2
[&]:[scroll-margin:5px] [@media(pointer:_coarse)]:[&]:min-h-control
`;

export const twTagSelectorCreate = `
tag-selector-create inline-flex items-center gap-[0.35rem] text-primary font-mono text-caption
font-medium uppercase [&_svg]:w-3.5 [&_svg]:h-3.5
`;

export const twTagSelectorMessage = `
tag-selector-message [&_button]:inline-flex [&_button]:items-center [&_button]:gap-[0.35rem]
[&_button]:text-primary [&_button]:font-mono [&_button]:text-caption [&_button]:font-medium
[&_button]:uppercase [&_svg]:w-3.5 [&_svg]:h-3.5 flex min-h-control items-center justify-between
gap-4 m-0 py-[0.55rem] px-[0.7rem] text-muted-foreground text-ui
`;

export const twTagSelectorCount = `
tag-selector-count absolute right-0 bottom-[-1.35rem] m-0 text-muted-foreground font-mono
text-micro
`;

export const twUiSelectTrigger = `
ui-select-trigger [&]:min-h-control [&]:border [&]:border-border [&]:rounded-control [&]:bg-surface
[&]:text-foreground [&]:font-sans [&]:text-ui [&]:font-normal [&]:shadow-control
[&]:[transition:border-color_120ms,_background-color_120ms,_box-shadow_120ms]
[&:hover]:border-border-strong [&:hover]:bg-surface-elevated
[&[data-popup-open]]:border-border-strong [&[data-popup-open]]:bg-surface-elevated
[&:focus-visible]:[outline:2px_solid_var(--ring)] [&:focus-visible]:[outline-offset:3px]
[&[data-disabled]]:opacity-50 [&[data-disabled]]:cursor-not-allowed [&:disabled]:opacity-50
[&:disabled]:cursor-not-allowed [&.idea-status]:min-h-8 [&.idea-status]:border-0
[&.select-compact]:min-h-9 [@media(pointer:_coarse)]:[&.select-compact]:min-h-control
[&.idea-status]:rounded-[5px] [&.idea-status]:bg-transparent [&.idea-status]:shadow-none
[&.idea-status]:text-muted-foreground [&.idea-status]:px-[7px] [&.idea-status]:normal-case
[&.idea-status:hover]:bg-surface-muted [&.idea-status:hover]:text-foreground
[&.idea-status[data-popup-open]]:bg-surface-muted [&.idea-status[data-popup-open]]:text-foreground
motion-reduce:[&]:transition-none
`;

export const twUiSelectPopup = `
ui-select-popup [&]:max-w-[calc(100dvw-2rem)] [&]:max-h-(--available-height) [&]:overflow-y-auto [&]:overscroll-contain [&]:border [&]:border-border [&]:rounded-[9px] [&]:bg-surface-elevated
[&]:text-foreground
[&]:[box-shadow:0_0_0_1px_rgb(0_0_0_/_0.02),_0_4px_8px_rgb(0_0_0_/_0.06),_0_16px_40px_rgb(0_0_0_/_0.12)]
[&]:font-sans [&]:text-ui [&]:[transform-origin:var(--transform-origin)]
[&]:[transition:opacity_120ms,_transform_120ms] [&[data-starting-style]]:opacity-0
[&[data-starting-style]]:[transform:translateY(-3px)_scale(0.985)] [&[data-ending-style]]:opacity-0
[&[data-ending-style]]:[transform:translateY(-3px)_scale(0.985)] [&_[role='listbox']]:p-[5px]
[&_[role='listbox']]:[scrollbar-width:thin] [&_input]:text-ui
[&_input::placeholder]:text-muted-foreground [&_[role='option']]:wrap-anywhere
[&_[role='option']_>_span]:whitespace-normal motion-reduce:[&]:transition-none
`;

export const twUiSelectItem = `
ui-select-item [&]:min-h-9 [&]:rounded-[5px] [&]:py-2 [&]:px-2.5 [&]:font-sans [&]:text-ui
[&]:leading-normal [&]:font-normal [&]:text-foreground [&]:gap-2 [&]:[scroll-margin:5px]
[&[data-highlighted]]:bg-surface-muted [&:hover]:bg-surface-muted
[&[data-selected]:not([data-highlighted])]:bg-surface-muted/60 [&[data-selected]]:font-medium
[&[data-disabled]]:opacity-45 [&[data-disabled]]:pointer-events-none
[&_>_span:first-child]:text-muted-foreground [&[data-selected]_>_span:first-child]:text-foreground
[@media(pointer:_coarse)]:[&]:min-h-control
`;

export const twUiSelectSheet = `
ui-select-sheet [&]:border-border [&]:rounded-t-dialog [&_[role='heading']]:text-lg
[&_[role='heading']]:font-medium [&_button[aria-pressed]]:rounded-control
[&_button[aria-pressed]]:text-ui [&_button[aria-pressed='true']]:bg-surface-muted
[&_button[aria-pressed]_>_span:first-child]:text-foreground
`;
