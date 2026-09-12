/** Tailwind recipes for markdown. Named hooks support scoped descendant variants. */

export const twMarkdownReadingSurface = `
markdown-reading-surface min-w-0
`;

export const twMarkdownContent = `
markdown-content min-w-0 max-w-[var(--layout-reading)] text-foreground font-editor text-base
leading-reading wrap-anywhere [&_>_:first-child]:mt-0 [&_>_:last-child]:mb-0 [&_p]:my-4
[&_h1]:text-foreground [&_h1]:font-emphasis [&_h1]:tracking-tight [&_h1]:leading-heading
[&_h1]:text-pretty [&_h1]:mt-10 [&_h1]:mb-4 [&_h1]:text-document-title
[&_h2]:text-foreground [&_h2]:font-emphasis [&_h2]:tracking-tight [&_h2]:leading-heading
[&_h2]:text-pretty [&_h2]:mt-9 [&_h2]:mb-[0.8rem] [&_h2]:text-document-section
[&_h3]:text-foreground [&_h3]:font-emphasis [&_h3]:tracking-tight [&_h3]:leading-heading
[&_h3]:text-pretty [&_h3]:mt-7 [&_h3]:mb-[0.65rem] [&_h3]:text-lg [&_blockquote]:my-7
[&_blockquote]:mx-0 [&_blockquote]:border-l-2 [&_blockquote]:p-[0.15rem_0_0.15rem_1.25rem]
[&_blockquote]:text-muted-foreground [&_blockquote]:not-italic [&_blockquote]:border-l-border-strong
[&_blockquote_>_:first-child]:mt-0 [&_blockquote_>_:last-child]:mb-0 [&_ul]:my-4 [&_ul]:pl-[1.6rem]
[&_ul]:[list-style:disc] [&_ol]:my-4 [&_ol]:pl-[1.6rem] [&_ol]:[list-style:decimal]
[&_li]:my-[0.4rem] [&_li]:pl-1 [&_li_>_p]:my-0 [&_li_>_div_>_p]:my-0
[&_.markdown-block-list]:relative [&_.markdown-block-list]:my-[0.4rem]
[&_.markdown-block-list_+_.markdown-block-list]:mt-0 [&_a]:text-primary [&_a]:font-medium
[&_a]:[text-decoration-line:underline] [&_a]:[text-decoration-thickness:1px]
[&_a]:[text-underline-offset:0.2em] [&_a:hover]:text-accent [&_code]:border [&_code]:border-border
[&_code]:rounded-control [&_code]:bg-surface-muted [&_code]:py-[0.1em] [&_code]:px-[0.35em]
[&_code]:font-mono [&_code]:text-inline-code
`;

export const twMarkdownCodeBlock = `
markdown-code-block relative my-7 overflow-hidden border border-border-strong rounded-card
bg-surface-muted [&_pre]:max-w-full [&_pre]:m-0 [&_pre]:overflow-x-auto
[&_pre]:p-[2.5rem_1rem_1.25rem] [&_pre]:[overscroll-behavior-inline:contain] [&_pre]:[tab-size:2]
[&_code]:border-0 [&_code]:rounded-[0] [&_code]:bg-transparent [&_code]:p-0 [&_code]:text-ui
[&_code]:leading-relaxed [&_code]:[white-space:pre]
`;

export const twMarkdownCodeLanguage = `
markdown-code-language absolute top-[0.55rem] right-3 font-mono text-micro uppercase
`;

export const twMarkdownTaskList = `
markdown-task-list [list-style:none]! pl-11! [&_>_li]:min-h-control [&_>_li]:pt-[0.4rem]
`;

export const twMarkdownTaskCheckbox = `
markdown-task-checkbox absolute top-[-0.1rem] left-0 grid w-11 h-11 place-items-center
[&_input]:w-4.5 [&_input]:h-4.5 [&_input]:m-0 [&_input]:[accent-color:var(--primary)]
[&_input]:cursor-pointer [&_input:disabled]:cursor-default
`;

export const twMarkdownTaskComplete = `
markdown-task-complete text-muted-foreground [text-decoration:line-through]
`;

export const twIdeaEditor = `
idea-editor [&[data-invalid]]:border-danger min-w-0 overflow-clip border border-border
rounded-surface bg-surface shadow-raised
[transition:border-color_var(--duration-fast)_var(--motion-standard),_box-shadow_var(--duration-fast)_var(--motion-standard)]
[&:focus-within]:[box-shadow:0_0_0_2px_color-mix(in_srgb,_var(--ring)_30%,_transparent),_var(--elevation-raised)]
`;

export const twIdeaEditorToolbarShell = `
idea-editor-toolbar-shell border-b border-b-border
[background:color-mix(in_srgb,_var(--surface-elevated)_94%,_transparent)]
[backdrop-filter:blur(0.75rem)]
`;

export const twIdeaEditorToolbar = `
idea-editor-toolbar flex min-h-13 flex-wrap items-center gap-[0.4rem] p-[0.4rem]
[overscroll-behavior-inline:contain] [scrollbar-width:thin]
`;

export const twIdeaEditorToolGroup = `
idea-editor-tool-group inline-flex [flex:none] gap-[0.15rem] border-l border-l-border pl-[0.4rem]
`;

export const twIdeaEditorTool = `
idea-editor-tool grid min-h-control w-11 [flex:none] place-items-center rounded-control
text-muted-foreground
[transition:color_var(--duration-fast)_var(--motion-standard),_background-color_var(--duration-fast)_var(--motion-standard)]
[&:hover]:bg-surface-muted [&:hover]:text-foreground
[&[aria-pressed='true']]:[background:color-mix(in_srgb,_var(--primary)_15%,_var(--surface))]
[&[aria-pressed='true']]:text-primary [&_svg]:w-[1.1rem] [&_svg]:h-[1.1rem]
[&_svg]:[stroke-width:1.8]
`;

export const twIdeaEditorLinkActions = `
idea-editor-link-actions [&_button]:grid [&_button]:min-h-control [&_button]:w-11
[&_button]:[flex:none] [&_button]:place-items-center [&_button]:rounded-control
[&_button]:text-muted-foreground
[&_button]:[transition:color_var(--duration-fast)_var(--motion-standard),_background-color_var(--duration-fast)_var(--motion-standard)]
[&_button:hover]:bg-surface-muted [&_button:hover]:text-foreground [&_svg]:w-[1.1rem]
[&_svg]:h-[1.1rem] [&_svg]:[stroke-width:1.8] flex items-end gap-[0.2rem]
`;

export const twIdeaEditorLinkRow = `
idea-editor-link-row grid gap-[0.65rem] border-t border-t-border p-3
sm:[&]:grid-cols-[minmax(0,_1.5fr)_minmax(0,_1fr)_auto] sm:[&]:items-end
`;

export const twIdeaEditorLinkField = `
idea-editor-link-field grid min-w-0 gap-[0.3rem] [&_label]:font-mono [&_label]:text-micro
[&_label]:tracking-wide [&_label]:uppercase [&_input]:min-h-10 [&_input]:min-w-0 [&_input]:border
[&_input]:border-border [&_input]:rounded-control [&_input]:bg-surface [&_input]:px-[0.65rem]
`;

export const twIdeaEditorLinkError = `
idea-editor-link-error [grid-column:1_/_-1] m-0 text-danger text-metadata
`;

export const twIdeaEditorContent = `
idea-editor-content min-h-[min(52vh,_32rem)] [&]:max-w-none py-6 px-5 bg-none
[caret-color:var(--primary)] [outline:0] [&[data-slate-placeholder='true']]:text-muted-foreground
md:[&]:py-8 md:[&]:px-7
`;
