/** Linear-inspired recipes for collection browsing and management surfaces. */

export const twCollectionGrid = `
collection-grid grid grid-cols-[repeat(2,minmax(0,1fr))] gap-3.5
max-md:grid-cols-[minmax(0,1fr)] motion-reduce:[&_>_article]:transition-none
`;

export const twCollectionCard = `
collection-card group relative min-w-0 overflow-hidden rounded-card border border-card-border bg-card
shadow-control transition-[border-color,background-color,box-shadow] duration-(--duration-fast)
hover:border-border-strong hover:bg-surface-elevated hover:shadow-raised focus-within:border-border-strong
`;

export const twCollectionCardBody = `
collection-card-body flex min-h-52 min-w-0 flex-col p-5 sm:p-5.5
`;

export const twCollectionIconTile = `
collection-icon-tile grid size-10 shrink-0 place-items-center rounded-control border border-border-subtle
bg-surface-muted text-primary shadow-control
`;

export const twCollectionMeta = `
collection-meta flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-caption text-muted-foreground
`;

export const twCollectionField = `
collection-field flex min-h-control min-w-0 items-center gap-2 rounded-control border border-border
bg-surface px-3 shadow-control transition-[border-color,box-shadow] duration-(--duration-fast)
hover:border-border-strong focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20
`;

export const twCollectionList = `
collection-list min-w-0 divide-y divide-border-subtle overflow-hidden rounded-control border
border-border-subtle bg-surface
`;

export const twCollectionListRow = `
collection-list-row relative flex min-w-0 items-center gap-3 px-3 py-2.5 transition-colors
hover:bg-surface-muted/45
`;

/** Compact sheet-local navigation for related collection settings. */
export const twCollectionSettingsTabs = `
collection-settings-tabs grid grid-cols-2 gap-1 border-b border-border-subtle px-5 py-3 sm:px-6
`;

export const twCollectionSettingsTab = `
collection-settings-tab min-h-9 rounded-control px-3 text-ui text-muted-foreground
transition-[background-color,color,box-shadow] duration-(--duration-fast) hover:bg-surface-muted/60
hover:text-foreground aria-selected:bg-surface-muted aria-selected:font-medium aria-selected:text-foreground
aria-selected:shadow-control focus-visible:relative focus-visible:z-1 focus-visible:outline-2
focus-visible:outline-offset-1 focus-visible:outline-ring motion-reduce:transition-none
`;

export const twCollectionHero = `
collection-hero grid min-w-0 gap-6 border-b border-border-subtle py-8
lg:grid-cols-[minmax(0,1fr)_260px] lg:gap-12
`;

export const twCollectionHeroMain = `
collection-hero-main min-w-0
`;

export const twCollectionSidebar = `
collection-sidebar min-w-0 border-t border-border-subtle pt-5
lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0
`;
