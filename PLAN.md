# Plan: Idea Access and Distribution

Status: implementation plan for [IDEA.md](./IDEA.md), researched against the
repository on 2026-09-26. No application code or production data is changed by
this document.

## Outcome and invariants

Replace the idea's one-dimensional `visibility` with `access: PUBLIC |
PRIVATE` and `distribution: LISTED | COLLECTIONS_ONLY | UNLISTED`. A direct
request may read any public idea; only its author may read a private idea.
The public archive returns only `PUBLIC + LISTED`; global search also returns
the signed-in author's own `PRIVATE` ideas, regardless of distribution. An
accessible collection may show `PUBLIC + LISTED`, `PUBLIC +
COLLECTIONS_ONLY`, and an author's own private ideas. No collection shows a
`PUBLIC + UNLISTED` idea. Private ideas retain their distribution when toggled
back to public.

One policy definition must drive SQL predicates and any in-memory checks.
Never page then filter hidden rows. For an inaccessible idea, keep the existing
`IDEA_NOT_FOUND` behavior. An author-only personal view may show the author's
hidden ideas; the public archive may not. Global search includes the author's
private ideas but excludes their `PUBLIC + UNLISTED` and `PUBLIC +
COLLECTIONS_ONLY` ideas.

## 1. Establish the policy contract

1. Add an idea policy module alongside `worker/collections/policy.ts`. Define
   access/distribution types, `canAccessIdea`, and explicit surface checks for
   `DETAIL`, `ARCHIVE`, `GLOBAL_SEARCH`, `COLLECTION`, `TAG_DISCOVERY`, and
   `OWNER_MANAGEMENT`. Map these decisions to reusable Drizzle SQL predicates;
   provide a parameterized raw-SQL fragment for the FTS5 query. Make unknown
   surfaces deny by default. Keep collection access as an independent
   prerequisite.
2. Define the full matrix for anonymous viewer, author, collection owner,
   editor, viewer, and unrelated signed-in member. Include each collection
   visibility (`PUBLIC`, `UNLISTED`, `PRIVATE`) and both membership and
   non-membership. Treat `COLLECTIONS_ONLY` with zero memberships as valid.
3. Decide endpoint scopes explicitly: `/api/ideas` defaults to public
   `DISCOVER`; an authenticated `MINE` scope returns the requester's ideas,
   including hidden ones. `/api/search` defaults to global search, returning
   `PUBLIC + LISTED` and the signed-in requester's `PRIVATE` ideas. An
   authenticated `MINE` scope may additionally support searching the
   requester's public hidden ideas. Collection-local
   search remains under `/api/collections/:id/ideas`. Validate scope and
   filters server-side, and never interpret `visibility=PUBLIC` as permission
   to return all public ideas. Update URL query parameters with a deliberate
   mapping for existing `visibility` links; malformed or obsolete values
   should degrade safely to the public discovery scope.

Acceptance: the matrix is written down in the policy module or verification
harness, and every endpoint has one named scope. A direct-link success does
not imply appearance in any list.

## 2. Migrate and release without a visibility gap

1. Update `worker/db/schema.ts` with `ideas.access` and
   `ideas.distribution`, both `NOT NULL`. Generate a Drizzle migration, then
   inspect its SQL before use. Backfill from `ideas.visibility` exactly:
   `PUBLIC → PUBLIC/LISTED`, `UNLISTED → PUBLIC/UNLISTED`, and `PRIVATE →
PRIVATE/LISTED`. Add an index only after checking the actual archive and
   search query plans. Keep collection rows untouched.
2. Respect the current deployment order in
   [deploy-production.yml](./.github/workflows/deploy-production.yml): D1
   migration runs before Worker deployment. During the compatibility window,
   old Worker inserts and visibility updates must synchronize the new columns.
   A migration trigger can map legacy inserts where the new columns still have
   defaults, and `UPDATE OF visibility` can map old updates only when the new
   columns were not explicitly changed in that statement. Verify those `WHEN`
   conditions against the old and new write SQL; do not rely on defaults
   alone. First deploy a compatibility Worker that understands both fields,
   then enable the new values and UI. Keep the legacy column for a later
   cleanup release.
3. During compatibility, write a conservative legacy projection for new
   Workers: `PUBLIC/LISTED → PUBLIC`, `PUBLIC/COLLECTIONS_ONLY → UNLISTED`,
   `PUBLIC/UNLISTED → UNLISTED`, and `PRIVATE/* → PRIVATE`. This lets the old
   tag-count triggers count only listed ideas. The original Worker is not a
   safe rollback target once `COLLECTIONS_ONLY` exists; rollback to the
   compatibility Worker. In a later release, rewrite the tag-count triggers
   against `access` and `distribution`, verify counts, then remove legacy
   storage and bridge triggers if justified.
4. Test the migration on a fresh local D1 database and on a copy/fixture with
   all three legacy visibility values, tags, FTS entries, and collection
   memberships. Simulate old inserts/updates after migration and new
   writes after the compatibility Worker. Check unmapped rows, count drift,
   FTS integrity, foreign keys, and exact membership preservation. For large
   databases, batch the backfill; D1 documents execution limits for large
   updates. Record a D1 Time Travel bookmark or export before production
   cutover and document the forward repair path.

Acceptance: no legacy `PRIVATE` or `UNLISTED` row can be read as listed during
the migration interval, and the original Worker cannot be deployed after
`COLLECTIONS_ONLY` writes begin. Cloudflare's [migration](https://developers.cloudflare.com/d1/reference/migrations/),
[limits](https://developers.cloudflare.com/d1/platform/limits/), and
[Time Travel](https://developers.cloudflare.com/d1/reference/time-travel/)
docs support this release sequence.

## 3. Update all server read and write paths

1. In `worker/ideas/schemas.ts`, replace request/response `visibility` with
   `access` and `distribution`. Creation defaults to `PUBLIC + LISTED`; a
   PATCH changes only provided fields. A PATCH to `PRIVATE` must retain
   distribution. Update serialization in `worker/ideas/service.ts`, create and
   update queries in `worker/db/ideas.ts`, and the Hono client types inferred
   by the frontend. Decide whether a temporary legacy request field is
   accepted only during the compatibility release; reject ambiguous mixed
   input.
2. Use the policy in `listIdeaRecords`, `getIdeaRecord`, and raw
   `searchIdeaRecords`. Global FTS5 must join to `ideas` and filter for
   `PUBLIC + LISTED` or `PRIVATE` with `author_id = viewerId` before returning
   excerpts or paginating. Include a private idea with any stored distribution;
   exclude `PUBLIC + UNLISTED` and `PUBLIC + COLLECTIONS_ONLY`, including the
   requester's own. Anonymous requests have no author branch. Do not remove
   hidden documents from FTS merely to enforce access: the index is also
   used for author search. Keep all query bindings parameterized.
3. Replace `nestedIdeaVisibility` and related logic in
   `worker/db/collections.ts`. Apply the same predicate to nested listing,
   local search, `visibleIdeaCount`, offset/next-page behavior, and
   candidate pickers. Keep a private idea visible only to its author in a
   collection they can access, regardless of its stored distribution. Exclude
   `PUBLIC + UNLISTED` for everyone. Update
   `worker/collections/service.ts` and membership mutation queries so no
   editor can add another author's private idea or anyone's public unlisted idea.
   Recheck eligibility at the write boundary, not only when rendering a
   picker. For existing hidden memberships, expose at most a generic
   unavailable count to collection owners; batch add/remove responses and
   `isMember` must not reveal hidden IDs or state to others.
4. Rework public tag counts and discovery to use `PUBLIC + LISTED`.
   `worker/db/tags.ts` public suggestions use listed public links plus the
   requester's own links, with the latter understood as private to that
   request. Verify tag counts on every access/distribution transition,
   including tag replacement, deletion, and restoration. Keep the database
   triggers authoritative for `tags.public_idea_count`.
5. Audit all remaining `ideas.visibility`, `visibility` API fields, and
   future-facing feeds. Collection visibility is a separate concept and
   must retain its current values and role behavior. Update server docs in
   `worker/ideas/README.md`, `worker/collections/README.md`, and migration
   instructions.

Acceptance: the six idea states match [IDEA.md](./IDEA.md) in detail, archive,
global search, tags, collections, candidates, counts, and mutations. A
collection never grants access to a private idea. The design follows
[OWASP's per-request authorization guidance](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)
and [SQLite's external-content FTS5 model](https://www.sqlite.org/fts5.html#external_content_and_contentless_tables).

## 4. Update editor and discovery UX

### Research translated into Stashed decisions

- Linear's [2024 redesign account](https://linear.app/now/how-we-redesigned-the-linear-ui)
  stresses aligned navigation, clear hierarchy, light/dark contrast, and
  checking a direction against complete views before implementation. Its
  [2026 refresh notes](https://linear.app/now/behind-the-latest-design-refresh)
  describe predictable header controls, quieter navigation, fewer decorative
  icons and separators, and consistent behavior across views. **Apply this to
  Stashed:** keep the existing muted, content-first visual language from
  `src/AGENTS.md`; use one placement and one vocabulary for idea access and
  distribution on create, edit, detail, cards, and collection management.
  Do not copy Linear's chrome or add a global navigation redesign to this
  feature. Review full flows and both themes, rather than judging an isolated
  selector.
- The [GOV.UK radio guidance](https://design-system.service.gov.uk/components/radios/)
  supports a question, a short hint for each choice, and conditional content
  for the selected choice. [WAI's radio pattern](https://www.w3.org/WAI/ARIA/apg/patterns/radio/)
  specifies keyboard behavior. **Apply this:** use two clearly grouped,
  single-choice controls in the full editor, with visible consequences in
  plain language. Keep compact menus for inline edits, but give them the same
  labels and an immediately available explanation of the selected state.
- [NN/g's progressive disclosure guidance](https://www.nngroup.com/articles/progressive-disclosure/)
  supports deferring rare detail while keeping important choices visible.
  **Apply this:** make access and distribution visible before save; place
  membership details only next to the affected `Link only` choice when they
  matter. Do not hide the distinction behind an ambiguous `Visibility` menu.
- [WCAG 2.2 target-size guidance](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum)
  and [status-message guidance](https://www.w3.org/WAI/WCAG21/Understanding/status-messages)
  support usable controls and announced save feedback. **Apply this:** retain
  the existing control-size and focus tokens; verify touch targets and
  keyboard focus at mobile widths; keep `ActionFeedback` mounted for pending,
  saved, and failed inline changes.

### Interaction specification

1. In `idea-form.tsx`, present **Who can view this idea?** (`Anyone`, `Only
me`) followed by **Where should it appear?** (`Everywhere`, `Collections
only`, `Link only`). Default a new idea to `Anyone + Everywhere`. Give
   each distribution choice a one-sentence consequence: `Everywhere` appears
   in Ideas, search, tags, and eligible collections; `Collections only`
   appears in accessible collections and by direct link; `Link only` is
   available by direct link and appears in no Stashed discovery surface.
   State beside the public choices that anyone with the URL may share it.
   For `Only me`, show a concise explanation that only the author can open
   the idea, while retaining the stored distribution. On switching back to
   `Anyone`, restore and visibly reselect that distribution. Choose whether
   to show the inactive distribution group or replace it with a summary
   after checking the complete mobile form; never silently reset its value.
2. For an existing idea with collection memberships, selecting `Link only`
   must explain before save that those memberships remain stored but the
   idea disappears from collection views until distribution changes again.
   This is a contextual explanation, not a destructive confirmation dialog.
   After save, show the final access and distribution in the reader's
   property area; a public hidden idea should state that it can still be
   opened with its link. Avoid a single `Public` badge that implies listing.
3. Update `idea-visibility-editor.tsx`, `visibility-select.tsx`, cards,
   filters, route query schemas, and collection idea management around the
   two dimensions. Keep **collection visibility** (`Public`, `Unlisted`,
   `Private`) labeled as a property of the collection, distinct from an
   idea's access and distribution. In compact cards, show a short combined
   summary such as `Anyone · Collections only` or `Only me`; use text as the
   primary cue and icons only where they improve scanning. Keep status,
   access, and distribution in consistent positions between reader and
   editor. Reuse the current `ResourcePageToolbar` and sidebar layout rather
   than introducing another header pattern.
4. Make the public **Ideas** route explicitly a listed archive. Give authors
   a separately labeled **My ideas** management view with their listed,
   collections-only, link-only, and private ideas, plus access/distribution
   filters that describe the current scope. Keep global search labeled and
   described as listed public ideas plus the author's private ideas; give
   authors a route to search/filter their public hidden ideas in **My ideas**.
   In collection pickers, explain an ineligible link-only idea and offer a
   route to change its distribution; do not imply that adding it will make
   it visible. Empty states should distinguish `no matching ideas` from
   `this scope does not include hidden ideas` without exposing inaccessible
   metadata.
5. Invalidate TanStack Query caches for detail, archive, personal view,
   search, tags, collection lists, counts, and candidate/target pickers after
   an access/distribution edit. Keep the server authoritative on navigation
   and stale cached pages. Place pending/saved/error feedback beside inline
   actions, preserve the selected value after a failed save, and explain how
   to retry. Use native or correctly implemented radio semantics in the
   full form; ensure compact menus and all choices work by keyboard and
   pointer. Review the UI at mobile and desktop widths, with a keyboard and
   in both light and dark themes. Check content wrapping, focus visibility,
   control size, and contrast before tuning subtle borders or icon density.
6. Update root README feature text and screenshots only after the UI is
   implemented. Consider `noindex` for public link-only and collections-only
   detail URLs as a separate crawler hint; it does not replace SQL policy.

Acceptance: authors can predict who can open an idea and where Stashed will
show it before saving; switching to private and back restores its distribution;
a direct link still works for public hidden ideas; archive, global search,
personal view, and collection pickers accurately describe their scopes. The
same vocabulary and control behavior work on desktop/mobile, with keyboard
input and in both themes. Google's [noindex guidance](https://developers.google.com/search/docs/crawling-indexing/block-indexing)
explains the crawler limitation.

## 5. Verify and ship

1. Extend `scripts/verify-collections.mjs` or add a similarly scoped local D1
   verification script. Exercise all six access/distribution states, all
   viewer roles, all three collection visibilities, zero/one/multiple
   memberships, and legacy migration writes. Include direct GET, archive,
   FTS search, nested search, tag discovery, counts, candidates, targets,
   single/batch add and remove, and transitions in both directions. Assert
   response bodies contain no unauthorized title, excerpt, ID, tag, or author.
   Assert that signed-in global search includes the author's private ideas
   with all three stored distributions but excludes their public hidden ideas.
2. Verify that pagination and counts are computed after SQL policy filters.
   Run `EXPLAIN QUERY PLAN` for archive, FTS join, nested listing, and count
   queries with realistic fixture sizes; add or adjust indexes only where
   the plan shows a need. Cloudflare documents this method in its
   [D1 index guide](https://developers.cloudflare.com/d1/best-practices/use-indexes/).
3. Run `pnpm lint`, `pnpm format:check`, `pnpm knip:all`, and `pnpm build`.
   Since frontend work falls under `src/AGENTS.md`, use manual browser
   verification for it and do not add frontend test scripts. Check anonymous,
   author, editor, viewer, and stranger sessions in desktop/mobile and both
   themes. Verify FTS and tag-count integrity queries from
   `drizzle/migrations/README.md`.
4. Release the compatibility migration/Worker, verify its invariants, then
   release the new policy and UI through the existing `main` to `prod`
   process. Run read-only production checks of mapping, tag counts, FTS,
   and sample allowed/denied API responses. Keep the compatibility Worker
   available as the rollback target; use D1 Time Travel only for a data
   incident because restoration changes the whole database state.

Definition of done: every policy row is verified end to end, no hidden idea
metadata leaks through secondary endpoints, local and CI gates pass, and
production verification confirms the migration mapping and discovery rules.
