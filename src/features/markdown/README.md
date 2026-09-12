# Markdown loading

The reader uses `react-markdown` + `remark-gfm`, not a read-only Plate editor.
Do not import `technical-markdown-plugins` or `platejs` into the reader: doing so
pulls editing, input-rule, and selection code into the idea detail route.
Both renderers retain the shared Tailwind typography recipes.

Raw HTML is skipped and react-markdown's default URL sanitizer is retained.
Checklist interactions use the parsed list item's source offset to change only
the checkbox marker. All other Markdown bytes are preserved, including nested
lists, code fences, and whitespace. Permission checks, pending disabling, and
optimistic rollback remain in the idea detail feature.

The form is a lazy module behind the existing editor skeleton. Data fetching and
authorization stay in the lightweight form page; read-only/missing ideas never
mount the editor. A local error boundary offers retry if the editor cannot load.
Keep plugin setup together: dynamically swapping editing plugins mid-document
would risk selection/history behavior. The full editing chunk is still large,
but it is not a static dependency of landing, feed, or detail pages.

Verification: production build, generated Vite manifest dependency inspection,
and one-off server-rendered Markdown inspection. No frontend test suite added.
Browser checks are still needed for checklist focus/rollback, nested and loose
lists, slow-network loading, failed chunk requests, and editor round trips.

References:

- [React lazy and Suspense](https://react.dev/reference/react/lazy)
- [Vite async chunk loading](https://vite.dev/guide/features#async-chunk-loading-optimization)
- [react-markdown components and security](https://github.com/remarkjs/react-markdown)
