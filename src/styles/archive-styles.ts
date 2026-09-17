/** Tailwind recipes for archive. Named hooks support scoped descendant variants. */

export const twIdeaCard = `
idea-card relative block min-w-0 overflow-hidden rounded-card border border-card-border bg-card
shadow-control transition-[border-color,transform,box-shadow] duration-180 ease-standard
hover:border-border-strong hover:-translate-y-0.5 hover:shadow-raised
focus-within:border-border-strong motion-reduce:transform-none motion-reduce:transition-none
`;

export const twIdeaCardMargin = `
idea-card-margin hidden
`;

export const twIdeaCardContent = `
idea-card-content flex h-full min-w-0 flex-col px-6.5 pt-[23px] pb-0 wrap-anywhere max-md:px-5
max-md:pt-5
`;

export const twIdeaStatus = String.raw`
idea-status inline-flex min-h-8 items-center gap-1.5 border-0 bg-transparent px-0 font-sans
text-caption leading-normal font-normal text-muted-foreground before:size-1.25 before:shrink-0
before:rounded-full before:bg-muted-foreground before:content-['']
data-[status=ACTIVE]:before:bg-status-active data-[status=COMPLETED]:before:bg-success
data-[status=PLANNED]:before:bg-status-planned data-[status=ARCHIVED]:before:bg-status-archived
data-[status=IN\_PROGRESS]:before:bg-warning
`;

export const twIdeaStatusTrigger = `
idea-status-trigger gap-1 disabled:cursor-wait disabled:opacity-65
`;

export const twIdeaStatusEditor = `
idea-status-editor min-w-0
`;

export const twIdeaEmptyState = `
idea-empty-state relative overflow-hidden rounded-card border border-border bg-surface p-8
text-center
`;

export const twSearchEmptyState = `
search-empty-state relative overflow-hidden rounded-card border border-border bg-surface p-8
text-center
`;

export const twSearchEmptyIcon = `
search-empty-icon w-6 h-6 mb-5 text-muted-foreground [stroke-width:1.5]
`;

export const twArchiveShell = `
archive-shell
`;

export const twArchiveWrap = `
archive-wrap [&]:w-[min(1184px,_calc(100%_-_96px))] [&]:mx-auto
max-compact:[&]:w-[calc(100%_-_56px)] max-md:[&]:w-[calc(100%_-_40px)]
`;

export const twArchiveLogo = `
archive-logo [&]:inline-flex [&]:items-center [&]:gap-[9px] [&]:shrink-0 [&]:text-brand
[&]:font-brand [&]:tracking-brand [&_>_svg]:text-primary [&_>_span]:ml-[-9px]
max-md:[&]:text-2xl
`;

export const twArchiveMain = `
archive-main pt-8 pb-[65px] min-h-[calc(100vh_-_205px)] max-md:pt-[25px] max-md:pb-[45px]
`;

export const twArchiveIntro = `
archive-intro relative flex items-center justify-between gap-7.5 pb-[25px]
animate-[archive-arrive_0.5s_backwards] [&_h1]:m-0 [&_h1]:font-display [&_h1]:text-section-title
[&_h1]:font-normal [&_h1_em]:font-normal
[&_h1_em]:text-primary max-md:flex-wrap max-md:gap-4 max-md:[&_h1]:text-section-title
motion-reduce:animate-none
`;

export const twArchiveIntroDescription = `
archive-intro-description mt-2 font-sans text-ui leading-description text-muted-foreground
max-md:[&_br]:hidden
`;

export const twArchiveResultsLabel = `
archive-results-label [&]:font-sans [&]:font-normal [&]:not-italic [&]:text-metadata
[&]:tracking-wide [&]:text-muted-foreground [&]:flex [&]:justify-between [&]:items-center
[&]:gap-3 [&]:mb-4.5 [&]:leading-relaxed
`;

export const twArchiveFilters = `
archive-filters [&]:p-5.5 [&]:border [&]:border-border [&]:rounded-card
[&]:[background:color-mix(in_srgb,_var(--surface-muted)_45%,_var(--background))]
[&_input]:text-sm [&_label]:text-micro [&_[data-slot='label']]:text-micro [&_button]:cursor-pointer
[&_button[role='combobox']]:text-metadata [&_button[role='combobox']]:bg-surface
max-md:[&]:p-3.5 max-md:[&_input]:text-ui
`;

/** Shared local search affordance for archive-style pages. */
export const twArchiveSearchField = `
archive-search-field grid min-h-11 min-w-0 grid-cols-[auto_auto_minmax(0,1fr)_auto] items-center gap-2
rounded-control border border-border bg-surface-elevated px-3 text-foreground shadow-raised
[transition:border-color_var(--duration-fast)_var(--motion-standard),_box-shadow_var(--duration-fast)_var(--motion-standard)]
hover:border-border-strong focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30
[&_input]:min-w-0 [&_input]:border-0 [&_input]:bg-transparent [&_input]:text-ui [&_input]:text-foreground
[&_input]:outline-none [&_input]:placeholder:text-muted-foreground/80
motion-reduce:transition-none
`;

/** Shared loading treatment for result lists during an active search update. */
export const twSearchTransitionContent = `
flex min-h-0 min-w-0 flex-1 flex-col transition-opacity duration-(--duration-standard) ease-standard
motion-reduce:transition-none
`;

export const twSearchTransitionBadge = `
absolute right-0 top-0 z-10 inline-flex min-h-6 items-center gap-1.5 rounded-control border border-border-subtle
bg-surface-elevated/92 px-2 text-metadata text-muted-foreground shadow-control backdrop-blur-sm
`;

export const twArchiveCardGrid = `
archive-card-grid [&]:grid [&]:grid-cols-[repeat(2,_minmax(0,_1fr))] [&]:gap-5.5 [&]:items-start
[&_>_article]:[animation:archive-arrive_0.45s_backwards]
[&_>_article:nth-child(2n)]:[animation-delay:0.07s] max-compact:[&]:gap-[17px]
max-md:[&]:grid-cols-[minmax(0,_1fr)] max-md:[&]:gap-4.5
motion-reduce:[&_>_article]:animate-none
`;

export const twArchiveFeed = `
archive-feed [&_.idea-empty-state]:py-12.5 [&_.idea-empty-state]:px-10
[&_.idea-empty-state]:bg-surface
[&_.idea-empty-state]:[background-image:radial-gradient(var(--border)_0.6px,_transparent_0.6px)]
[&_.idea-empty-state]:[background-size:19px_19px] [&_.idea-empty-state]:text-center
[&_.search-empty-state]:py-12.5 [&_.search-empty-state]:px-10 [&_.search-empty-state]:bg-surface
[&_.search-empty-state]:[background-image:radial-gradient(var(--border)_0.6px,_transparent_0.6px)]
[&_.search-empty-state]:[background-size:19px_19px] [&_.search-empty-state]:text-center
[&_.idea-empty-state::before]:hidden [&_.idea-empty-state_h2]:font-display
[&_.idea-empty-state_h2]:font-normal [&_.idea-empty-state_h2]:not-italic
[&_.idea-empty-state_h2]:text-3xl [&_.idea-empty-state_h2]:leading-tight
[&_.idea-empty-state_h2]:tracking-tight [&_.search-empty-state_h2]:font-display
[&_.search-empty-state_h2]:font-normal [&_.search-empty-state_h2]:not-italic
[&_.search-empty-state_h2]:text-3xl [&_.search-empty-state_h2]:leading-tight
[&_.search-empty-state_h2]:tracking-tight [&_section[role='alert']_h2]:font-display
[&_section[role='alert']_h2]:font-normal [&_section[role='alert']_h2]:not-italic
[&_section[role='alert']_h2]:text-3xl [&_section[role='alert']_h2]:leading-tight
[&_section[role='alert']_h2]:tracking-tight [&_.idea-empty-state_>_p]:mx-auto
[&_.search-empty-state_>_p]:mx-auto [&_.search-empty-icon]:block
[&_.search-empty-icon]:[box-sizing:content-box] [&_.search-empty-icon]:w-[23px]
[&_.search-empty-icon]:h-[23px] [&_.search-empty-icon]:p-[15px]
[&_.search-empty-icon]:m-[0_auto_23px] [&_.search-empty-icon]:rounded-dialog
[&_.search-empty-icon]:bg-surface-muted [&_.search-empty-icon]:text-primary
[&_.search-empty-icon]:[transform:rotate(-5deg)]
[&_section[role='alert']]:[border:1px_solid_color-mix(in_srgb,_var(--danger)_35%,_var(--border))]
[&_section[role='alert']]:rounded-[7px] [&_section[role='alert']]:p-7.5
max-md:[&_.idea-empty-state]:py-[35px] max-md:[&_.idea-empty-state]:px-5.5
max-md:[&_.search-empty-state]:py-[35px] max-md:[&_.search-empty-state]:px-5.5
max-md:[&_.idea-empty-state_h2]:text-3xl
max-md:[&_.search-empty-state_h2]:text-3xl
`;

export const twArchiveStateIcon = `
archive-state-icon [&]:block [&]:[box-sizing:content-box] [&]:w-[23px] [&]:h-[23px] [&]:p-[15px]
[&]:m-[0_auto_23px] [&]:rounded-dialog [&]:bg-surface-muted [&]:text-primary
[&]:[transform:rotate(-5deg)]
`;

export const twArchivePagination = `
archive-pagination [&]:pt-7.5 [&]:mt-[35px] [&_>_p]:font-display [&_>_p]:font-normal [&_>_p]:italic
[&_>_p]:text-sm [&_>_p]:leading-relaxed [&_>_p]:text-center [&_>_button]:text-ui
`;

export const twArchiveFooter = `
archive-footer [&]:flex [&]:gap-7 [&]:items-center [&]:border-t [&]:border-t-border [&]:min-h-26
[&_.archive-logo]:text-brand [&_p]:[flex:1] [&_p]:text-caption [&_p]:text-muted-foreground
[&_>_a:last-child]:inline-flex [&_>_a:last-child]:items-center [&_>_a:last-child]:gap-1.5
[&_>_a:last-child]:text-caption [&_>_a:last-child]:min-h-control max-md:[&]:flex-wrap
max-md:[&]:gap-[10px_20px] max-md:[&]:py-6 max-md:[&_p]:text-micro
max-md:[&_p]:[flex-basis:calc(100%_-_150px)] max-md:[&_>_a:last-child]:ml-auto
`;

export const twArchiveMasonry = `
archive-masonry [&[data-masonry='true']]:[grid-auto-rows:1px] [&[data-masonry='true']]:gap-y-0
`;

export const twArchiveMasonryItem = `
archive-masonry-item [&]:min-w-0 [&]:[align-self:start]
`;
