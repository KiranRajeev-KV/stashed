# Tailwind styling

The UI uses Tailwind utilities directly in components and shared static recipes in
the `*-styles.ts` modules. These are class strings, not another CSS framework or
runtime style engine. Named classes retained in a recipe are hooks for scoped
descendant/state selectors; no component stylesheet defines them.

`src/index.css` contains the Tailwind theme, light/dark values, document-wide base
defaults, and animation keyframes. Use semantic tokens (`bg-surface`,
`border-border-subtle`, `font-display`, `text-ui`, `min-h-control`,
`rounded-dialog`) for new styles. Markdown descendants are also styled with
Tailwind variants so the reader and editor share typography.

The visual direction follows [Linear's 2026 refresh](https://linear.app/now/behind-the-latest-design-refresh):
quiet navigation, softer structure, and predictable controls. Keep interface
colors theme-aware and reserve accents for meaningful states.

Typography uses a shared scale: `text-caption` (helper text), `text-metadata`
(dates and tags), `text-ui` (controls), and `text-body`/`text-prose` (body copy).
`text-micro` is reserved for decorative labels. Serif card titles use
`text-card-title`; reader and editor titles both use `text-idea-title`. Fluid
landing headings use `text-hero`, `text-hero-mobile`, `text-section-title`, and
`text-closing-title`. These display tokens include line height and tracking.
Markdown uses `text-document-title`, `text-document-section`, and
`text-inline-code`. Weight and rhythm use `font-emphasis`, `font-brand`,
`leading-heading`, `leading-reading`, and `leading-description`. Standard Tailwind
scale utilities remain valid; arbitrary typography utilities are checked by
Knip and the build/lint gates help prevent the scale from drifting again.

Actions use `Button` from `components/ui/button.tsx`. Router links and anchors use
`buttonStyles` from `components/ui/button-variants.ts` without changing their
navigation semantics. Use primary for the main action, secondary for supporting
actions, ghost for quiet actions, and destructive for delete confirmation. All
variants share the control-height, typography, radius, focus, and motion tokens.
Pass `loading` and `loadingLabel` to `Button` for pending actions; it announces
busy state and disables duplicate clicks. Icon-only buttons need an accessible
label. Menu options, breadcrumbs, and editor toggles remain specialized controls.
Button variants are intentionally kept in one shared recipe so they can be
reviewed together with the action hierarchy.

Local interaction feedback uses `ActionFeedback`: pending and success messages
are polite live updates; failures use a separate alert region. Keep both regions
mounted, place messages next to the action, and explain recovery without also
showing an error toast. Success toasts remain appropriate after create/save/delete
navigation. Keep the announcement markup and duplicate-error policy local to
the shared feedback component.

Knip verifies the reachable code graph and prevents new dead files or exports.
Build and lint checks complement this; they do not replace
visual checks in both themes and at mobile/desktop sizes.

Responsive layout uses the existing `md` and `lg` breakpoints: breadcrumbs get
their own row below `md`; reader/editor sidebars stack below `lg`, with paired
properties on tablets. Editor page actions stop sticking below `lg` to preserve
space for the on-screen keyboard. Formatting groups wrap in DOM order. Long tags
wrap inside shrinkable containers; code blocks retain local horizontal scrolling.
Menus use available-height and viewport-width bounds, and dialog bodies scroll
independently with overscroll containment. No new CSS or breakpoint tokens needed.

Responsive visual QA (requires a connected browser; not covered by compilation):

- Check 320, 390, 768, 1024, and 1440px widths in both themes, plus short landscape.
- Check signed-in/out navigation and long breadcrumbs with pending action labels.
- Open reader/new/edit pages with a 200-character title, 50-character tags, and
  long code lines; confirm only code blocks scroll horizontally.
- Open status, visibility, sort, tag menus, and delete/filter dialogs near the
  viewport edge; confirm all options/actions remain reachable by scrolling.
- Focus editor/link/tag fields with the mobile keyboard open; verify toolbar
  buttons, focus rings, and save/cancel controls remain reachable.
- Check keyboard tab order after wrapping, mobile touch targets, and 200% zoom.
