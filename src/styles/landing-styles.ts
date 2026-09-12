/** Tailwind recipes for landing. Named hooks support scoped descendant variants. */

export const twStLanding = `
st-landing [&]:bg-background [&]:text-foreground [&]:overflow-clip [&_*]:box-border
[&_*::before]:box-border [&_*::after]:box-border [&_a]:no-underline [&_button]:cursor-pointer
[&_em]:text-primary [&_em]:font-normal
[&_[data-reveal].st-visible]:[animation:st-content-in_0.65s_both]
[&_section[id]]:[scroll-margin-top:24px] motion-reduce:[&_*]:animate-none!
motion-reduce:[&_*]:transition-none! motion-reduce:[&_*]:[scroll-behavior:auto]!
motion-reduce:[&_*::before]:animate-none! motion-reduce:[&_*::before]:transition-none!
motion-reduce:[&_*::before]:[scroll-behavior:auto]! motion-reduce:[&_*::after]:animate-none!
motion-reduce:[&_*::after]:transition-none! motion-reduce:[&_*::after]:[scroll-behavior:auto]!
[&_main_section[id]]:[scroll-margin-top:80px]
max-md:[&_section[id]]:[scroll-margin-top:124px]
max-md:[&_main_section[id]]:[scroll-margin-top:124px]
`;

export const twStWrap = `
st-wrap [&]:w-[min(1184px,_calc(100%_-_96px))] [&]:mx-auto max-compact:[&]:w-[calc(100%_-_56px)]
max-md:[&]:w-[calc(100%_-_40px)] max-xs:[&]:w-[calc(100%_-_28px)]
`;

export const twStLogo = `
st-logo [&]:inline-flex [&]:items-center [&]:gap-[9px] [&]:text-brand [&]:font-brand
[&]:tracking-brand max-md:[&]:text-2xl max-xs:[&]:gap-1
max-xs:[&]:text-2xl
`;

export const twStHero = `
st-hero [&]:min-h-165 [&]:grid [&]:grid-cols-[1.08fr_1fr] [&]:items-center [&]:gap-8 [&]:pt-18
[&]:pb-19.5 [&_h1]:relative [&_h1]:font-display [&_h1]:font-normal
[&_h1]:text-hero
[&_h1]:m-[0_0_31px] wide:[&]:min-h-177.5 max-compact:[&]:gap-2.5
max-compact:[&]:min-h-150 max-compact:[&_h1]:text-hero max-md:[&]:grid-cols-[1fr]
max-md:[&]:pt-[47px] max-md:[&]:pb-9.5 max-md:[&]:gap-8
max-md:[&_h1]:text-hero-mobile
max-xs:[&_h1]:text-hero-mobile
`;

export const twStEyebrow = `
st-eyebrow [&]:font-mono [&]:text-micro [&]:tracking-eyebrow [&]:font-medium [&]:flex
[&]:items-center [&]:gap-[9px] [&]:text-primary [&]:m-[0_0_25px] [&]:leading-reading
max-md:[&]:text-micro
`;

export const twStLiveDot = `
st-live-dot [&]:w-1.5 [&]:h-1.5 [&]:inline-block [&]:rounded-[50%] [&]:bg-primary [&]:[flex:none]
[&]:[box-shadow:0_0_0_4px_color-mix(in_srgb,_var(--primary)_10%,_transparent)]
`;

export const twStStatusDot = `
st-status-dot [&]:w-1.5 [&]:h-1.5 [&]:inline-block [&]:rounded-[50%] [&]:bg-primary [&]:[flex:none]
`;

export const twStUnderline = `
st-underline [&]:absolute [&]:w-[73%] [&]:max-w-[355px] [&]:h-4.5 [&]:bottom-[-15px] [&]:left-[8%]
[&]:[fill:none] [&]:[stroke:var(--accent)] [&]:[stroke-width:2] [&]:[stroke-linecap:round]
[&]:[stroke-dasharray:800] [&]:[animation:st-draw_1.4s_0.3s_both]
`;

export const twStHeroDescription = `
st-hero-description [&]:text-body [&]:leading-description [&]:text-muted-foreground [&]:m-[0_0_29px]
max-compact:[&]:text-ui max-md:[&]:text-sm
`;

export const twStHeroButtons = `
st-hero-buttons [&]:flex [&]:items-center [&]:gap-7 max-compact:[&]:gap-[17px]
max-xs:[&]:gap-3.5
`;

export const twStHeroFoot = `
st-hero-foot [&]:flex [&]:items-center [&]:gap-[7px] [&]:text-micro [&]:text-muted-foreground
[&]:mt-[21px] [&_>_span]:mx-[3px]
`;

export const twStHeroArt = `
st-hero-art [&]:relative [&]:h-107.5 [&]:isolate
[@media(hover:_hover)]:[&:hover_.st-main-card]:[transform:rotate(-2deg)_translateY(-6px)]
max-compact:[&]:h-102.5 max-md:[&]:w-[min(460px,_100%)] max-md:[&]:h-[425px]
max-md:[&]:mx-auto max-xs:[&]:h-[399px]
motion-reduce:[&:hover_.st-main-card]:[transform:rotate(-5deg)]
`;

export const twStArtGrid = `
st-art-grid [&]:absolute [&]:inset-[-18px_-18px_0]
[&]:[background-image:radial-gradient(_var(--border-strong)_0.7px,_transparent_0.7px_)]
[&]:[background-size:19px_19px] [&]:[mask-image:radial-gradient(ellipse,_black,_transparent_72%)]
[&]:opacity-60 [&]:[z-index:-2]
`;

export const twStOrbitLabel = `
st-orbit-label [&]:flex [&]:items-center [&]:gap-2 [&]:absolute [&]:top-2 [&]:left-10
[&]:text-muted-foreground [&]:font-display [&]:italic [&]:text-base [&]:[transform:rotate(-5deg)]
`;

export const twStMainCard = `
st-main-card [&]:absolute [&]:w-[87%] [&]:left-[3%] [&]:top-18.5 [&]:border [&]:border-border
[&]:rounded-[7px] [&]:p-[27px_29px_20px] [&]:bg-surface-elevated [&]:[transform:rotate(-5deg)]
[&]:[box-shadow:0_18px_35px_rgb(45_40_25_/_0.1)] [&]:[animation:st-card-in_1s_0.15s_backwards]
[&]:[transition:transform_0.4s] [&_h2]:font-display [&_h2]:font-normal [&_h2]:not-italic
[&_h2]:text-3xl [&_h2]:leading-tight [&_h2]:tracking-tight [&_h2]:m-[24px_0_14px]
[&_h2_em]:text-foreground [&_>_p]:text-metadata [&_>_p]:leading-description [&_>_p]:text-muted-foreground
max-compact:[&]:p-[25px_20px_19px] max-compact:[&_h2]:text-card-title max-md:[&]:p-[27px]
max-md:[&_h2]:text-3xl max-xs:[&]:p-[24px_20px_19px]
max-xs:[&_h2]:text-2xl motion-reduce:[&:hover]:[transform:rotate(-5deg)]
`;

export const twStBackCard = `
st-back-card [&]:absolute [&]:w-[87%] [&]:left-[3%] [&]:top-18.5 [&]:border [&]:border-border
[&]:rounded-[7px] [&]:h-67.5 [&]:p-4.5 [&_>_span]:flex [&_>_span]:justify-between
[&_>_span]:items-center [&_>_span]:font-mono [&_>_span]:text-micro
`;

export const twStBackOne = `
st-back-one [&]:[background:#e0e5c9] [&]:[color:#42503a]
[&]:[transform:rotate(9deg)_translate(22px,_4px)]
`;

export const twStBackTwo = `
st-back-two [&]:[background:#e9bda5] [&]:[color:#6b4535]
[&]:[transform:rotate(3deg)_translate(8px,_-15px)]
`;

export const twStCardTape = `
st-card-tape [&]:absolute [&]:w-[95px] [&]:h-[27px] [&]:[background:#d5cfaf88] [&]:top-[-14px]
[&]:left-[39%] [&]:[transform:rotate(4deg)] [&]:[clip-path:polygon(3%_0,_99%_2%,_97%_100%,_0_93%)]
`;

export const twStCardTop = `
st-card-top [&]:flex [&]:justify-between [&]:text-accent [&_>_span]:flex [&_>_span]:gap-2
[&_>_span]:items-center [&_>_span]:font-mono [&_>_span]:font-normal [&_>_span]:not-italic
[&_>_span]:text-micro [&_>_span]:leading-normal [&_>_span]:tracking-eyebrow
`;

export const twStCardTags = `
st-card-tags [&]:flex [&]:gap-[7px] [&]:my-5 [&]:mx-0 [&_>_span]:py-[5px] [&_>_span]:px-2
[&_>_span]:bg-surface-muted [&_>_span]:rounded-[4px] [&_>_span]:text-muted-foreground
[&_>_span]:font-mono [&_>_span]:font-normal [&_>_span]:not-italic [&_>_span]:text-micro
[&_>_span]:leading-normal
`;

export const twStCardBottom = `
st-card-bottom [&]:border-t [&]:border-t-border [&]:pt-[13px] [&]:flex [&]:justify-between
[&]:items-center [&]:text-micro [&]:text-muted-foreground [&_>_span:first-child]:flex
[&_>_span:first-child]:items-center [&_>_span:first-child]:gap-1.5
[&_>_span:first-child]:text-primary
`;

export const twStSmallNote = `
st-small-note [&]:absolute [&]:bottom-[1px] [&]:right-[-7px] [&]:z-2 [&]:[transform:rotate(8deg)]
[&]:py-[17px] [&]:px-5.5 [&]:w-[145px] [&]:[background:#ecdda4] [&]:[color:#574d2c]
[&]:[box-shadow:2px_5px_10px_#0000000c] [&]:font-display [&]:font-normal [&]:italic [&]:text-lg
[&]:leading-heading [&_>_span]:absolute [&_>_span]:right-[13px] [&_>_span]:top-[-31px]
[&_>_span]:text-5xl [&_>_span]:text-accent max-compact:[&]:right-0
max-compact:[&]:bottom-[13px] max-md:[&]:bottom-0 max-md:[&]:right-[5px]
max-xs:[&]:w-[127px] max-xs:[&]:text-body
`;

export const twStSavedStamp = `
st-saved-stamp [&]:flex [&]:items-center [&]:gap-2 [&]:absolute [&]:left-7 [&]:bottom-[-5px]
[&]:text-caption [&]:text-primary [&]:[transform:rotate(-4deg)]
`;

export const twStUnderHero = `
st-under-hero [&]:border-t [&]:border-t-border [&]:border-b [&]:border-b-border [&]:flex
[&]:items-center [&]:justify-between [&]:min-h-[63px] [&]:text-muted-foreground [&]:font-mono
[&]:font-normal [&]:not-italic [&]:text-micro [&]:leading-normal [&]:tracking-eyebrow [&_a]:grid
[&_a]:place-items-center [&_a]:w-11 [&_a]:h-11 [&_a]:border [&_a]:border-border [&_a]:rounded-[50%]
[&_a]:[transition:transform_0.2s] [&_a:hover]:[transform:translateY(3px)]
max-md:[&_>_span]:text-micro max-md:[&_>_span]:tracking-wide
max-md:[&_>_span]:max-w-[125px] max-md:[&_>_span]:leading-relaxed
max-md:[&_>_span:last-child]:text-right
`;

export const twStMethod = `
st-method [&]:pt-25.5 [&]:pb-[95px] max-md:[&]:py-16
`;

export const twStSectionHeading = `
st-section-heading [&]:flex [&]:items-end [&]:justify-between [&]:gap-7.5 [&]:mb-11
[&_.st-eyebrow]:mb-[17px] [&_h2]:font-display [&_h2]:font-normal [&_h2]:not-italic [&_h2]:text-section-title
[&_h2]:m-0 [&_>_p]:text-ui [&_>_p]:leading-description
[&_>_p]:text-muted-foreground [&_>_p]:m-[0_0_4px] max-compact:[&_h2]:text-section-title
max-md:[&]:flex-col max-md:[&]:items-start max-md:[&]:gap-5
max-md:[&]:mb-7.5 max-md:[&_h2]:text-section-title
`;

export const twStPrivacy = `
st-privacy [&_.st-eyebrow]:mb-[17px] [&_h2]:font-display [&_h2]:font-normal [&_h2]:not-italic
[&_h2]:text-section-title [&_h2]:m-0 [&]:grid
[&]:grid-cols-[1fr_1fr] [&]:gap-20 [&]:items-center [&]:py-[105px] max-compact:[&_h2]:text-section-title
max-compact:[&]:gap-[25px] max-md:[&_h2]:text-section-title max-md:[&]:grid-cols-[1fr]
max-md:[&]:py-[65px] max-md:[&]:gap-7.5
`;

export const twStMethodGrid = `
st-method-grid [&]:grid [&]:grid-cols-[repeat(3,_1fr)] [&]:gap-6 max-compact:[&]:gap-3.5
max-md:[&]:grid-cols-[1fr] max-md:[&]:gap-4
`;

export const twStMethodCard = `
st-method-card [&]:p-[25px_25px_23px] [&]:border [&]:border-border [&]:rounded-[7px]
[&]:[background:color-mix(in_srgb,_var(--surface)_55%,_transparent)]
[&]:[transition:transform_0.25s,_border-color_0.25s] [&:hover]:[transform:translateY(-5px)]
[&:hover]:border-border-strong [&_h3]:font-display [&_h3]:font-normal [&_h3]:not-italic
[&_h3]:text-card-title [&_h3]:m-[24px_0_12px]
[&_>_p]:text-ui [&_>_p]:leading-description [&_>_p]:text-muted-foreground [&_>_p]:mb-6
max-compact:[&]:p-[21px] max-compact:[&_h3]:text-2xl max-md:[&]:p-[23px]
max-md:[&_h3]:text-card-title max-md:[&_h3]:mt-[19px] max-md:[&_>_p]:max-w-110
max-md:[&_>_p]:mb-5
`;

export const twStMethodTop = `
st-method-top [&]:flex [&]:justify-between [&]:items-center
`;

export const twStFeatureIcon = `
st-feature-icon [&]:grid [&]:place-items-center [&]:w-[45px] [&]:h-[45px] [&]:rounded-[11px]
[&]:[background:#e5e9d8] [&]:[color:#46604a] [&]:[transform:rotate(-5deg)]
`;

export const twStNumber = `
st-number [&]:font-mono [&]:font-normal [&]:not-italic [&]:text-caption [&]:leading-normal
[&]:text-border-strong
`;

export const twStMethodDetail = `
st-method-detail [&]:[border-top:1px_dashed_var(--border)] [&]:pt-[17px] [&]:block [&]:font-display
[&]:font-normal [&]:italic [&]:text-ui [&]:leading-normal [&]:text-primary
`;

export const twStPlaygroundSection = `
st-playground-section [&]:pt-[81px] [&]:pb-[63px]
[&]:[background:color-mix(in_srgb,_var(--surface-muted)_53%,_var(--background))]
[&]:[border-block:1px_solid_var(--border)] max-md:[&]:pt-14 max-md:[&]:pb-9
`;

export const twStPlayground = `
st-playground [&]:border [&]:border-border-strong [&]:bg-surface [&]:rounded-[9px]
[&]:[box-shadow:0_12px_24px_#00000005] [&]:overflow-hidden
`;

export const twStPlaygroundToolbar = `
st-playground-toolbar [&]:flex [&]:items-center [&]:justify-between [&]:gap-[15px] [&]:py-[21px]
[&]:px-7 [&]:border-b [&]:border-b-border [&_>_span:first-child]:flex
[&_>_span:first-child]:items-center [&_>_span:first-child]:gap-[9px] [&_>_span:first-child]:text-ui
[&_>_span:first-child]:font-medium max-md:[&]:p-4.5
`;

export const twStDemoLabel = `
st-demo-label [&]:font-mono [&]:font-normal [&]:not-italic [&]:text-micro [&]:leading-normal
[&]:tracking-eyebrow [&]:text-muted-foreground max-md:[&]:text-micro
max-md:[&]:max-w-19.5 max-md:[&]:text-right max-md:[&]:leading-normal
`;

export const twStFilterRow = `
st-filter-row [&]:flex [&]:gap-2 [&]:p-[21px_28px_8px] [&]:flex-wrap [&_button]:flex
[&_button]:items-center [&_button]:gap-1.5 [&_button]:py-2.5 [&_button]:px-3 [&_button]:min-h-10
[&_button]:text-caption [&_button]:text-muted-foreground [&_button]:rounded-[5px]
[&_button]:[border:1px_solid_transparent] [&_button]:[transition:background_0.2s,_color_0.2s]
[&_button:hover]:bg-surface-muted [&_button[aria-pressed='true']]:text-primary-foreground
[&_button[aria-pressed='true']]:bg-primary max-md:[&]:p-[17px_14px_5px]
max-md:[&]:gap-1 max-md:[&_button]:px-2
`;

export const twStPreviewBody = `
st-preview-body [&]:grid [&]:grid-cols-[0.85fr_1.4fr] [&]:gap-7.5 [&]:p-[20px_28px_28px]
[&]:min-h-[393px] max-compact:[&]:gap-5 max-md:[&]:grid-cols-[1fr]
max-md:[&]:p-[17px] max-md:[&]:gap-[19px]
`;

export const twStPreviewList = `
st-preview-list [&]:flex [&]:flex-col [&]:gap-[9px] max-md:[&]:grid
max-md:[&]:grid-cols-[repeat(3,_minmax(0,_1fr))] max-md:[&]:gap-[7px]
`;

export const twStPreviewItem = `
st-preview-item [&]:block [&]:text-left [&]:py-3 [&]:px-4 [&]:border [&]:border-border
[&]:rounded-[5px] [&]:bg-background [&]:[transition:transform_0.2s,_border-color_0.2s]
[&[aria-pressed='true']]:border-primary
[&[aria-pressed='true']]:[background:color-mix(in_srgb,_var(--primary)_7%,_var(--surface))]
[&:hover]:[transform:translateX(3px)] [&_h3]:m-[2px_0_7px] [&_h3]:font-display [&_h3]:font-normal
[&_h3]:not-italic [&_h3]:text-lg [&_h3]:leading-normal max-md:[&]:p-2.5
max-md:[&_h3]:text-body max-md:[&_h3]:mt-[7px] max-xs:[&]:p-2
`;

export const twStPreviewItemMeta = `
st-preview-item-meta [&]:flex [&]:justify-between [&]:font-mono [&]:font-normal [&]:not-italic
[&]:text-micro [&]:leading-normal [&]:text-muted-foreground max-md:[&_svg]:w-[13px]
`;

export const twStPreviewItemTag = `
st-preview-item-tag [&]:font-mono [&]:font-normal [&]:not-italic [&]:text-micro [&]:leading-normal
[&]:text-muted-foreground
`;

export const twStPreviewHint = `
st-preview-hint [&]:m-[5px_0_0] [&]:flex [&]:items-center [&]:gap-[5px] [&]:text-muted-foreground
[&]:font-display [&]:font-normal [&]:italic [&]:text-metadata [&]:leading-normal
max-md:[&]:[grid-column:1_/_-1]
`;

export const twStPreviewDetail = `
st-preview-detail [&]:p-[27px_30px_20px] [&]:border [&]:border-border [&]:rounded-[5px]
[&]:bg-surface-elevated
[&]:[background-image:repeating-linear-gradient(_transparent,_transparent_30px,_color-mix(in_srgb,_var(--border)_25%,_transparent)_31px_)]
[&]:[animation:st-content-in_0.3s_both] [&_h3]:font-display [&_h3]:font-normal [&_h3]:not-italic
[&_h3]:text-3xl [&_h3]:leading-tight [&_h3]:tracking-tight [&_h3]:m-[27px_0_17px]
[&_>_p]:text-ui [&_>_p]:leading-description [&_>_p]:text-muted-foreground
[&_blockquote]:[border-left:2px_solid_var(--accent)] [&_blockquote]:pl-[15px]
[&_blockquote]:my-[25px] [&_blockquote]:mx-0 [&_blockquote]:text-primary [&_blockquote]:font-display
[&_blockquote]:font-normal [&_blockquote]:italic [&_blockquote]:text-lg
[&_blockquote]:leading-normal max-compact:[&]:p-[23px] max-md:[&]:min-h-[343px]
max-md:[&]:p-[21px] max-md:[&_h3]:text-3xl max-xs:[&]:p-[17px]
`;

export const twStPreviewDetailTop = `
st-preview-detail-top [&]:flex [&]:gap-2.5 [&]:items-center [&]:justify-between [&]:font-mono
[&]:font-normal [&]:not-italic [&]:text-micro [&]:leading-normal [&]:text-muted-foreground
max-md:[&]:text-micro
`;

export const twStPreviewStatus = `
st-preview-status [&]:inline-flex [&]:items-center [&]:gap-[5px] [&]:py-[5px] [&]:px-2
[&]:rounded-[20px] [&]:bg-surface-muted [&]:text-primary
`;

export const twStPreviewDetailFoot = `
st-preview-detail-foot [&]:flex [&]:justify-between [&]:gap-2.5 [&]:border-t [&]:border-t-border
[&]:pt-4 [&_>_span]:flex [&_>_span]:items-center [&_>_span]:gap-[5px] [&_>_span]:font-mono
[&_>_span]:font-normal [&_>_span]:not-italic [&_>_span]:text-micro [&_>_span]:leading-normal
[&_>_span]:text-muted-foreground
`;

export const twStPreviewCaption = `
st-preview-caption [&]:flex [&]:justify-between [&]:gap-5 [&]:items-center [&]:mt-5.5
[&_>_span]:text-muted-foreground [&_>_span]:text-caption max-md:[&]:flex-col
max-md:[&]:items-start max-md:[&]:gap-[13px]
`;

export const twStPrivacyCopy = `
st-privacy-copy [&_>_p:not(.st-eyebrow)]:text-muted-foreground [&_>_p:not(.st-eyebrow)]:text-sm
[&_>_p:not(.st-eyebrow)]:leading-description [&_>_p:not(.st-eyebrow)]:my-[23px]
[&_>_p:not(.st-eyebrow)]:mx-0
`;

export const twStPrivacyOptions = `
st-privacy-options [&]:inline-flex [&]:p-[5px] [&]:border [&]:border-border [&]:rounded-[7px]
[&]:gap-1 [&_button]:inline-flex [&_button]:items-center [&_button]:gap-[7px]
[&_button]:min-h-control [&_button]:py-2.5 [&_button]:px-3.5 [&_button]:text-metadata
[&_button]:rounded-[4px] [&_button]:text-muted-foreground [&_button]:[transition:background_0.2s]
[&_button[aria-pressed='true']]:bg-primary [&_button[aria-pressed='true']]:text-primary-foreground
max-md:[&_button]:px-3.5 max-xs:[&_button]:px-[11px]
`;

export const twStPrivacyVisual = `
st-privacy-visual [&]:py-5 [&]:px-5.5
[&]:[background-image:radial-gradient(var(--border)_1px,_transparent_1px)]
[&]:[background-size:16px_16px] max-md:[&]:max-w-125 max-md:[&]:w-full
max-md:[&]:m-auto max-md:[&]:p-[15px]
`;

export const twStPrivacySheet = `
st-privacy-sheet [&]:p-7 [&]:border [&]:border-border [&]:rounded-[7px] [&]:bg-surface-elevated
[&]:[box-shadow:5px_6px_0_var(--surface-muted),_6px_7px_0_var(--border)]
[&]:[animation:st-content-in_0.3s_both] [&]:min-h-[315px] [&_.st-eyebrow]:text-micro
[&_.st-eyebrow]:mb-2.5 [&_h3]:font-display [&_h3]:font-normal [&_h3]:not-italic [&_h3]:text-card-title
[&_h3]:m-[0_0_12px] [&_>_p:not(.st-eyebrow)]:text-metadata
[&_>_p:not(.st-eyebrow)]:leading-description [&_>_p:not(.st-eyebrow)]:text-muted-foreground
`;

export const twStPrivacySymbol = `
st-privacy-symbol [&]:grid [&]:place-items-center
[&]:[background:color-mix(in_srgb,_var(--primary)_10%,_var(--surface))] [&]:text-primary [&]:w-[57px]
[&]:h-[57px] [&]:rounded-[50%] [&]:mb-[21px]
`;

export const twStPrivacyCaption = `
st-privacy-caption [&]:flex [&]:items-center [&]:gap-[7px] [&]:text-primary [&]:text-micro [&]:mt-5
`;

export const twStPrivacyNote = `
st-privacy-note [&]:block [&]:text-right [&]:mt-[23px] [&]:font-display [&]:font-normal [&]:italic
[&]:text-body [&]:leading-normal [&]:text-muted-foreground [&]:[transform:rotate(-3deg)]
`;

export const twStFinalSection = `
st-final-section [&]:pb-[75px] max-md:[&]:pb-12.5
`;

export const twStFinal = `
st-final [&]:relative [&]:text-center [&]:py-[51px] [&]:px-[25px] [&]:overflow-hidden
[&]:[background:#e6e9d9] [&]:[color:#283f31] [&]:[border:1px_solid_#ced4bf] [&]:rounded-card
[[data-theme='dark']_&]:[background:#243329] [[data-theme='dark']_&]:[color:#e8eadf]
[[data-theme='dark']_&]:[border-color:#3b5041] [&_.st-eyebrow]:justify-center [&_.st-eyebrow]:mb-4.5
[&_.st-eyebrow]:text-micro [&_h2]:font-display [&_h2]:font-normal [&_h2]:not-italic
[&_h2]:text-closing-title [&_h2]:m-0
[&_>_p:not(.st-eyebrow)]:text-ui [&_>_p:not(.st-eyebrow)]:m-[20px_0_24px]
max-md:[&_h2]:text-closing-title max-md:[&]:py-[39px] max-md:[&]:px-4.5
max-md:[&_.st-eyebrow]:text-micro
`;

export const twStFinalSpark = `
st-final-spark [&]:block [&]:text-4xl [&]:text-accent [&]:leading-none [&]:mb-[21px]
`;

export const twStFinalFoot = `
st-final-foot [&]:block [&]:font-mono [&]:font-normal [&]:not-italic [&]:text-micro
[&]:leading-normal [&]:mt-[23px] [&]:opacity-70 max-md:[&]:text-micro
`;

export const twStFinalDoodle = `
st-final-doodle [&]:absolute [&]:left-[16%] [&]:bottom-17.5 [&]:text-primary [&]:opacity-40
[&]:font-display [&]:font-normal [&]:not-italic [&]:text-illustration [&]:leading-normal
[&]:[transform:rotate(10deg)] max-md:[&]:hidden
`;

export const twStFooter = `
st-footer [&]:border-t [&]:border-t-border [&]:min-h-25 [&]:flex [&]:items-center [&]:gap-7.5
[&_.st-logo]:text-brand [&_p]:[flex:1] [&_p]:text-caption [&_p]:text-muted-foreground
[&_>_a:not(.st-logo)]:inline-flex [&_>_a:not(.st-logo)]:gap-[5px] [&_>_a:not(.st-logo)]:items-center
[&_>_a:not(.st-logo)]:text-caption max-md:[&]:flex-wrap max-md:[&]:gap-[15px_25px]
max-md:[&]:py-6.5 max-md:[&_p]:[flex-basis:calc(100%_-_145px)]
max-md:[&_p]:text-micro max-md:[&_p]:m-0
max-md:[&_>_a:not(.st-logo)]:min-h-10
`;

export const twStBackTop = `
st-back-top [&]:text-muted-foreground max-md:[&]:ml-auto
`;

export const twStHeroEnter = `
st-hero-enter [&]:[animation:st-content-in_0.7s_both] [&:nth-child(2)]:[animation-delay:0.08s]
[&:nth-child(3)]:[animation-delay:0.16s] [&:nth-child(4)]:[animation-delay:0.24s]
[&:nth-child(5)]:[animation-delay:0.32s]
`;

export const twStHeroCopy = `
st-hero-copy max-md:[&]:max-w-132.5 max-md:[&]:m-auto max-md:[&]:w-full
`;
