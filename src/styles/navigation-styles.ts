/** Tailwind recipes for navigation. Named hooks support scoped descendant variants. */

export const twSkipLink = `
skip-link fixed z-100 top-3 left-3 min-h-control py-[0.7rem] px-4 border border-border-strong
rounded-control bg-surface-elevated text-foreground shadow-overlay font-medium
[transform:translateY(calc(-100%_-_1rem))]
[transition:transform_var(--duration-fast)_var(--motion-standard)]
[&:focus]:[transform:translateY(0)] motion-reduce:[&]:transition-none
`;

export const twUserIdentity = `
user-identity relative inline-flex [flex:none]
`;

export const twUserIdentityTrigger = `
user-identity-trigger grid min-w-10 min-h-10 p-1 cursor-pointer place-items-center border-0 rounded-full
bg-transparent [transition:background-color_var(--duration-fast)_var(--motion-standard)]
[&:hover]:bg-surface-muted [&:focus-visible]:bg-surface-muted
`;

export const twUserIdentityTooltip = `
user-identity-tooltip absolute z-40 top-[calc(100%_+_0.5rem)] right-0 w-max
max-w-[min(16rem,_calc(100vw_-_2rem))] py-[0.55rem] px-3 pointer-events-none invisible border
border-border-strong rounded-control opacity-0 bg-surface-elevated text-foreground shadow-overlay
[transform:translateY(-0.25rem)]
[transition:opacity_var(--duration-fast)_var(--motion-standard),_transform_var(--duration-fast)_var(--motion-standard),_visibility_var(--duration-fast)_var(--motion-standard)]
[&[data-visible='true']]:visible [&[data-visible='true']]:opacity-100
[&[data-visible='true']]:[transform:translateY(0)]
`;

export const twUserIdentityTooltipName = `
user-identity-tooltip-name block wrap-anywhere text-sm font-semibold
`;

export const twUserIdentityTooltipUsername = `
user-identity-tooltip-username block wrap-anywhere mt-0.5 text-muted-foreground font-mono
text-metadata
`;

export const twSiteNavbar = `
site-navbar [&]:sticky [&]:top-0 [&]:z-40
[&]:[background:color-mix(in_srgb,_var(--background)_95%,_transparent)]
[&]:[backdrop-filter:blur(14px)] [&]:border-b [&]:border-b-border motion-reduce:[&_a]:transition-none
motion-reduce:[&_button]:transition-none
`;

export const twSiteNavbarInner = `
site-navbar-inner [&]:w-[min(1184px,_calc(100%_-_96px))] [&]:min-h-16 [&]:mx-auto [&]:flex
[&]:items-center [&]:gap-9.5 max-compact:[&]:w-[calc(100%_-_56px)] max-compact:[&]:gap-5.5
max-md:[&]:w-[calc(100%_-_40px)] max-md:[&]:grid
max-md:[&]:grid-cols-[minmax(0,1fr)_auto] max-md:[&]:gap-[0_10px] max-xs:[&]:gap-x-1
`;

export const twSiteBrand = `
site-brand [&]:inline-flex [&]:items-center [&]:gap-[9px] [&]:shrink-0 [&]:text-2xl [&]:font-brand
[&]:tracking-brand [&_>_svg]:text-primary max-md:[&]:min-h-16 max-xs:[&]:text-xl max-xs:[&]:gap-1
`;

export const twSiteNavLinks = `
site-nav-links [&]:flex [&]:items-center [&]:gap-[5px] [&]:[flex:1] max-md:[&]:[grid-row:2]
max-md:[&]:[grid-column:1_/_-1] max-md:[&]:min-h-control max-md:[&]:border-t
max-md:[&]:border-t-border max-md:[&]:gap-[5px]
`;

export const twSiteNavLink = `
site-nav-link relative [&]:min-h-9 [&]:inline-flex [&]:items-center [&]:gap-[7px] [&]:py-2 [&]:px-3
[&]:text-muted-foreground [&]:rounded-[5px] [&]:text-metadata
[&]:[transition:color_var(--duration-fast)_var(--motion-standard),_background-color_var(--duration-fast)_var(--motion-standard)]
[&]:after:absolute [&]:after:inset-x-3 [&]:after:bottom-0 [&]:after:h-px [&]:after:origin-center
[&]:after:scale-x-0 [&]:after:rounded-full [&]:after:bg-primary [&]:after:opacity-0
[&]:after:[transition:transform_var(--duration-fast)_var(--motion-standard),_opacity_var(--duration-fast)_var(--motion-standard)]
[&:hover]:text-foreground [&:hover]:bg-surface-muted/45
[&[data-status='active']]:text-foreground [&[data-status='active']]:bg-transparent
[&[data-status='active']]:font-medium [&[data-status='active']]:after:scale-x-100
[&[data-status='active']]:after:opacity-100 [&[data-status='active']:hover]:bg-transparent
max-md:[&]:min-h-10 max-md:[&]:py-2.5
`;

/** Quiet peer navigation used for in-page views such as collection scopes. */
export const twViewTab = `
view-tab relative inline-flex min-h-9 items-center rounded-control px-3 text-ui text-muted-foreground
[transition:color_var(--duration-fast)_var(--motion-standard),_background-color_var(--duration-fast)_var(--motion-standard)]
after:absolute after:inset-x-3 after:bottom-0 after:h-px after:origin-center after:scale-x-0
after:rounded-full after:bg-primary after:opacity-0
after:[transition:transform_var(--duration-fast)_var(--motion-standard),_opacity_var(--duration-fast)_var(--motion-standard)]
hover:bg-surface-muted/45 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2
focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-40
aria-selected:bg-transparent aria-selected:font-medium aria-selected:text-foreground
aria-selected:after:scale-x-100 aria-selected:after:opacity-100 aria-selected:hover:bg-transparent
motion-reduce:transition-none motion-reduce:after:transition-none
`;

export const twSiteNavActions = `
site-nav-actions [&]:flex [&]:items-center [&]:gap-[7px] [&]:ml-auto max-md:[&]:min-h-16
max-md:[&]:[grid-column:2] max-md:[&]:[grid-row:1] max-md:[&]:gap-[3px]
`;

export const twSiteSessionLoading = `
site-session-loading [&]:text-caption [&]:text-muted-foreground [&]:px-2
`;

export const twSiteNavError = `
site-nav-error [&]:m-0 [&]:py-2 [&]:px-5 [&]:text-center [&]:text-metadata [&]:text-danger
[&]:border-t [&]:border-t-border [&_button]:underline [&_button]:cursor-pointer
`;

/** Semantic resource hierarchy with a quiet, compact Linear-like treatment. */
export const twBreadcrumb = `
breadcrumb min-w-0 font-sans text-metadata leading-normal text-muted-foreground
`;

export const twBreadcrumbList = `
breadcrumb-list flex min-w-0 items-center gap-1.5 overflow-hidden
`;

export const twBreadcrumbItem = `
breadcrumb-item flex min-w-0 shrink items-center
`;

export const twBreadcrumbLink = `
breadcrumb-link [&_a]:inline-flex [&_a]:min-h-control [&_a]:shrink-0 [&_a]:items-center [&_a]:rounded-[5px]
[&_a]:px-1.5 [&_a]:text-muted-foreground [&_a]:transition-colors [&_a]:duration-(--duration-fast)
[&_a:hover]:bg-surface-muted [&_a:hover]:text-foreground [&_a:focus-visible]:outline-2
[&_a:focus-visible]:outline-offset-2 [&_a:focus-visible]:outline-ring motion-reduce:[&_a]:transition-none
`;

export const twBreadcrumbSeparator = `
breadcrumb-separator grid size-4 shrink-0 place-items-center text-muted-foreground/70
`;

export const twBreadcrumbCurrent = `
breadcrumb-current min-w-0 truncate px-1.5 text-foreground
`;
