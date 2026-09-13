/** Tailwind recipes for idea-page. Named hooks support scoped descendant variants. */

export const twIdeaReader = /* @__PURE__ */ String.raw`
idea-reader [&]:min-w-0 [&]:[animation:reader-arrive_240ms_ease-out_both]
[&_:is(a,_button):focus-visible]:[outline:2px_solid_var(--ring)]
[&_:is(a,_button):focus-visible]:[outline-offset:4px] [&_.idea-status]:inline-flex
[&_.idea-status]:items-center [&_.idea-status]:gap-[7px] [&_.idea-status]:min-h-control
[&_.idea-status]:border-0 [&_.idea-status]:rounded-control [&_.idea-status]:bg-transparent
[&_.idea-status]:text-foreground [&_.idea-status]:p-0 [&_.idea-status]:font-sans
[&_.idea-status]:font-normal [&_.idea-status]:not-italic [&_.idea-status]:text-metadata
[&_.idea-status]:leading-normal [&_.idea-status]:whitespace-nowrap
[&_.idea-status:hover]:bg-surface-muted [&_.idea-status::before]:[content:'']
[&_.idea-status::before]:w-[5px] [&_.idea-status::before]:h-[5px] [&_.idea-status::before]:shrink-0
[&_.idea-status::before]:rounded-[50%] [&_.idea-status::before]:bg-muted-foreground
[&_[data-status='ACTIVE']::before]:bg-status-active [&_[data-status='COMPLETED']::before]:bg-success
[&_[data-status='PLANNED']::before]:bg-status-planned [&_[data-status='ARCHIVED']::before]:bg-status-archived
[&_[data-status='IN\_PROGRESS']::before]:bg-warning motion-reduce:[&]:animate-none
motion-reduce:[&_*]:transition-none motion-reduce:[&_*::before]:transition-none
`;

export const twIdeaReaderToolbar = `
idea-reader-toolbar [&]:flex [&]:items-center [&]:justify-between [&]:gap-6 [&]:pb-5 [&]:border-b
[&]:border-b-border-subtle max-phone:[&]:flex-wrap max-phone:[&]:gap-1
max-phone:[&]:pb-4
`;

export const twIdeaReaderLayout = `
idea-reader-layout [&]:grid [&]:grid-cols-[minmax(0,_1fr)_260px] [&]:items-start [&]:gap-12 [&]:pt-9
max-lg:[&]:grid-cols-[minmax(0,_1fr)] max-lg:[&]:gap-8 max-lg:[&]:pt-7.5
`;

export const twIdeaBanner = `
mt-6 h-32 min-w-0 overflow-hidden rounded-surface border border-border-subtle bg-surface
md:h-40 lg:h-50
`;

export const twIdeaReaderDocument = `
idea-reader-document [&]:min-w-0
`;

export const twIdeaReaderHeading = `
idea-reader-heading [&]:pb-7.5 [&_h1]:m-0
[&_h1]:font-display [&_h1]:font-normal [&_h1]:text-idea-title
[&_h1]:wrap-anywhere [&_h1]:[text-wrap:pretty]
`;

export const twIdeaReaderKicker = `
idea-reader-kicker [&]:flex [&]:items-center [&]:gap-[7px] [&]:text-muted-foreground [&]:font-mono
[&]:font-normal [&]:not-italic [&]:text-micro [&]:leading-normal [&]:tracking-eyebrow [&]:uppercase
[&]:m-[0_0_18px]
`;

export const twIdeaReaderAuthor = `
idea-reader-author [&]:flex [&]:items-center [&]:flex-wrap [&]:gap-[9px] [&]:mt-6
[&]:text-muted-foreground [&]:text-metadata [&]:wrap-anywhere [&_img]:w-7.5 [&_img]:h-7.5
[&_img]:shrink-0 [&_img]:border [&_img]:border-border [&_img]:rounded-[50%]
[&_img]:[object-fit:cover]
`;

export const twIdeaReaderAvatar = `
idea-reader-avatar [&]:w-7.5 [&]:h-7.5 [&]:shrink-0 [&]:border [&]:border-border [&]:rounded-[50%]
[&]:[object-fit:cover] [&]:grid [&]:place-items-center [&]:font-mono [&]:font-normal [&]:not-italic
[&]:text-micro [&]:leading-normal [&]:bg-surface-muted
`;

export const twIdeaReaderUsername = `
idea-reader-username [&]:text-caption
`;

export const twIdeaReaderContent = `
idea-reader-content [&]:border-t [&]:border-t-border-subtle [&]:pt-7.5 [&]:min-w-0 [&]:wrap-anywhere
[&_.markdown-content]:text-base [&_.markdown-content]:leading-reading
[&_.markdown-content_>_:first-child]:mt-0 [&_.markdown-reading-surface]:min-w-0
`;

export const twIdeaReaderSidebar = `
idea-reader-sidebar [&]:sticky [&]:top-24 [&]:border-l [&]:border-l-border-subtle [&]:pl-6
[&]:min-w-0 [&_h2]:m-[0_0_15px] [&_h2]:font-sans [&_h2]:font-medium [&_h2]:not-italic
[&_h2]:text-metadata [&_h2]:leading-normal [&_h2]:text-foreground max-lg:[&]:static
max-lg:[&]:p-[24px_0_0] max-lg:[&]:[border-left:0] max-lg:[&]:border-t
max-lg:[&]:border-t-border-subtle
`;

export const twIdeaReaderProperties = `
idea-reader-properties [&]:grid [&]:gap-2 [&]:m-0 [&]:text-metadata [&_>_div]:grid
[&_>_div]:grid-cols-[67px_minmax(0,_1fr)] [&_>_div]:items-center [&_>_div]:gap-2.5 [&_>_div]:min-h-9
[&_dt]:text-muted-foreground [&_dd]:m-0 [&_dd]:min-w-0
max-lg:[&]:grid-cols-[repeat(2,_minmax(0,_1fr))] max-lg:[&]:gap-x-6
max-phone:[&]:grid-cols-[minmax(0,_1fr)]
`;

export const twIdeaReaderVisibility = `
idea-reader-visibility [&]:flex [&]:items-center [&]:gap-[7px] [&_svg]:text-muted-foreground
`;

export const twIdeaReaderStatus = `
idea-reader-status [&]:inline-flex [&]:items-center [&]:gap-[7px] [&]:min-h-control [&]:border-0
[&]:rounded-control [&]:bg-transparent [&]:text-foreground [&]:p-0 [&]:font-sans [&]:font-normal
[&]:not-italic [&]:text-metadata [&]:leading-normal [&]:whitespace-nowrap [&::before]:[content:'']
[&::before]:w-[5px] [&::before]:h-[5px] [&::before]:shrink-0 [&::before]:rounded-[50%]
[&::before]:bg-muted-foreground
`;

export const twIdeaReaderTags = `
idea-reader-tags [&]:mt-7 [&_ul]:flex [&_ul]:flex-wrap [&_ul]:gap-1.5 [&_ul]:[list-style:none]
[&_ul]:m-0 [&_ul]:p-0 [&_li]:max-w-full [&_li]:min-w-0
`;

export const twIdeaReaderManage = `
idea-reader-manage [&]:mt-7 [&]:pt-4 [&]:border-t [&]:border-t-border-subtle
`;

export const twIdeaReaderEmpty = `
idea-reader-empty [&]:flex [&]:flex-col [&]:items-start [&]:gap-3 [&]:py-3 [&]:px-0
[&]:text-muted-foreground [&]:text-sm [&_p]:m-0 [&_a]:inline-flex [&_a]:items-center [&_a]:gap-2
[&_a]:min-h-control [&_a]:text-metadata [&_a]:text-primary
`;

export const twIdeaPageToolbar = `
idea-page-toolbar [&]:flex [&]:items-center [&]:justify-between [&]:gap-6 [&]:min-w-0 [&]:pt-3
[&]:pb-5 [&]:border-b [&]:border-b-border
[&_:is(a,_button):focus-visible]:[outline:2px_solid_var(--ring)]
[&_:is(a,_button):focus-visible]:[outline-offset:3px] max-phone:[&]:flex-wrap
max-md:[&]:flex-wrap max-md:[&]:gap-2
`;

export const twIdeaPageToolbarSticky = `
idea-page-toolbar-sticky [&]:sticky [&]:top-16 [&]:z-20 [&]:bg-background [&]:pt-3
max-lg:[&]:static
`;

export const twIdeaPageBreadcrumb = `
idea-page-breadcrumb [&]:flex [&]:items-center [&]:gap-3 [&]:min-w-0 [&]:text-muted-foreground
[&]:font-sans [&]:font-normal [&]:not-italic [&]:text-metadata [&]:leading-normal
[&_:is(a,_button)]:inline-flex [&_:is(a,_button)]:items-center [&_:is(a,_button)]:gap-2
[&_:is(a,_button)]:min-h-control [&_:is(a,_button)]:shrink-0 [&_:is(a,_button):hover]:text-foreground
max-md:[&]:w-full
`;

export const twIdeaPageCurrent = `
idea-page-current [&]:overflow-hidden [&]:text-ellipsis [&]:whitespace-nowrap [&]:text-foreground
`;

export const twIdeaPageSaveState = `
idea-page-save-state [&]:shrink-0 [&]:text-caption max-md:[&]:hidden
`;

export const twIdeaPageActions = `
idea-page-actions [&]:flex [&]:flex-wrap [&]:min-w-0 [&]:max-w-full [&]:items-start [&]:gap-2 [&]:shrink-0 max-md:[&]:ml-auto
`;

export const twIdeaTagLink = `
idea-tag-link [&]:inline-flex [&]:items-center [&]:gap-[5px] [&]:min-h-8 [&]:max-w-full [&]:py-1
[&]:px-2 [&]:border [&]:border-border [&]:rounded-control [&]:bg-surface [&]:text-muted-foreground
[&]:font-sans [&]:font-normal [&]:not-italic [&]:text-caption [&]:leading-normal
[&]:[transition:border-color_120ms,_color_120ms] [&_svg]:shrink-0 [&_span]:wrap-anywhere
[&_span]:min-w-0 [&:hover]:border-border-strong [&:hover]:text-foreground
[&:focus-visible]:[outline:2px_solid_var(--ring)] [&:focus-visible]:[outline-offset:3px]
motion-reduce:[&]:transition-none
`;

export const twIdeaTitleInput = `
idea-title-input [&]:font-display [&]:font-normal
`;
