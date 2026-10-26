# Idea Access and Distribution

Status: product brief, researched against the repository on 2026-09-26. This
document defines the intended behavior; [PLAN.md](./PLAN.md) describes the
implementation. The existing decisions in this brief are preserved.

## Goal

Separate **who can view an idea** from **where Stashed is allowed to surface it**.

Today, `PUBLIC`, `UNLISTED`, and `PRIVATE` mix access and discovery into one field. The new model treats them as independent concepts.

## Model

```ts
access: PUBLIC;
PRIVATE;

distribution: LISTED;
COLLECTIONS_ONLY;
UNLISTED;
```

`distribution` is always stored, even when an idea is private.

## Semantics

| State                       | Direct link | Ideas archive | Global search | Tags | Collections |
| --------------------------- | ----------: | ------------: | ------------: | ---: | ----------: |
| `PUBLIC + LISTED`           |         Yes |           Yes |           Yes |  Yes |         Yes |
| `PUBLIC + COLLECTIONS_ONLY` |         Yes |            No |            No |   No |         Yes |
| `PUBLIC + UNLISTED`         |         Yes |            No |            No |   No |          No |
| `PRIVATE + *`               | Author only |            No |   Author only |   No | Author only |

### LISTED

Normal public idea.

It may appear in:

- Ideas archive
- Global search
- Tag discovery
- Collections
- Other normal public discovery surfaces

### COLLECTIONS_ONLY

The idea is public, but Stashed does not surface it globally.

It may:

- Be opened directly by URL
- Appear inside collections the viewer can access
- Be searched or filtered within those collections

It must not appear in:

- Ideas archive
- Global search
- Tag archives/counts
- General recommendations or ranking surfaces
- Public profile idea feeds

It is valid for a `COLLECTIONS_ONLY` idea to belong to zero collections.

### UNLISTED

The public idea is strictly link-only.

It:

- Can be opened by anyone with the URL
- Does not appear in any discovery surface
- Does not appear in collections
- Does not appear in global or collection search
- Does not contribute to public tag counts

To expose an unlisted idea through a collection, its distribution must first be changed to `COLLECTIONS_ONLY` or `LISTED`.

### PRIVATE

Only the author can access the idea. Signed-in authors can find their own
private ideas in global search, regardless of the stored distribution.

Distribution is retained internally but has no public effect while the idea is private.

Changing it back to public restores its previous distribution behavior.

## Core Rule

Access always takes precedence over distribution.

```ts
canSurfaceIdea(viewer, idea, surface) =
  canAccessIdea(viewer, idea) && surfaceAllows(idea, viewer, surface);
```

A collection or discovery surface must never grant access that the idea itself does not allow.

The public Ideas archive contains only listed public ideas. Global search
contains listed public ideas plus the signed-in author's own private ideas.
An author's personal management view may also show their public link-only and
collections-only ideas. Those public hidden ideas remain absent from global
search. The current `/api/ideas` and `/api/search` mix public discovery with
author-owned results; the new API must implement these scopes explicitly.

Direct access means a request for a known idea ID. `PUBLIC +
COLLECTIONS_ONLY` and `PUBLIC + UNLISTED` are still publicly readable through
that route. Neither is a secrecy mechanism; a recipient can share its URL.

## Collections

- Collections do not grant access to private ideas.
- Anyone may add another user's public `LISTED` or `COLLECTIONS_ONLY` idea to their collection.
- Another user's public `UNLISTED` idea cannot be added.
- Existing collection memberships are preserved if an idea becomes `PRIVATE` or `PUBLIC + UNLISTED`. A private membership remains visible only to its author; a public unlisted membership is hidden from everyone.
- If its access/distribution later allows collection visibility again, the membership becomes visible automatically.
- Deleting an idea permanently deletes its collection memberships.
- Authors cannot remove their public ideas from collections owned by other users.
- Collection counts should reflect only ideas visible to the current viewer.
- If memberships exist but are no longer visible, collection owners may see a generic unavailable count without leaked idea metadata.

The collection's own `PUBLIC`, `UNLISTED`, or `PRIVATE` setting and collaborator
roles continue to govern access to the container. For an accessible
collection, the nested idea query must additionally apply the idea's access
and distribution policy before searching, counting, sorting, or paginating.
`COLLECTIONS_ONLY` is eligible in any accessible collection, including a
public one; the container does not promote a private idea to public.

Owners/editors may add another author's `PUBLIC + LISTED` or `PUBLIC +
COLLECTIONS_ONLY` idea, and may add their own private idea regardless of its
stored distribution. No one may add a `PUBLIC + UNLISTED` idea, including its
author. Existing membership in an idea that becomes `PUBLIC + UNLISTED` stays
stored but is hidden. The owner of an idea cannot
remove a membership from another person's collection merely by owning the
idea; normal collection editing permissions still apply.

Membership management responses, candidate pickers, `isMember` flags, batch
results, counts, and error messages must apply the same policy. A generic
unavailable count is visible only to a collection owner and must not disclose
the hidden idea's title, tags, author, ID, or reason it is unavailable.

## Search

Global search:

```text
PUBLIC + LISTED
+
the signed-in author's own PRIVATE ideas, regardless of distribution
```

Collection-local search:

```text
PUBLIC + LISTED
+
PUBLIC + COLLECTIONS_ONLY
+
the author's own PRIVATE ideas, regardless of distribution
```

`PUBLIC + UNLISTED` ideas never appear in global or collection search.

Global search includes only the requester's private ideas, never another
author's private ideas. A separate personal management view can locate the
author's public hidden ideas. A collection-local query may show a private
idea to its author if the author can also access that collection; it must
never show a `PUBLIC + UNLISTED` member, even to its author.

## Tags

Only `PUBLIC + LISTED` ideas contribute to public tag discovery and public tag counts.

`COLLECTIONS_ONLY`, `UNLISTED`, and `PRIVATE` ideas do not.

## Engagement

Likes and bookmarks may be used on any idea the viewer can access.

Engagement must never override distribution.

Likes and bookmarks are a future-facing rule here: the current repository
does not implement them. Any future engagement feed, count, notification, or
recommendation must follow the same surface policy.

For example, a `COLLECTIONS_ONLY` idea with many likes must still remain absent from the global archive and search.

## Editor UX

### Who can view this idea?

- **Anyone**
- **Only me**

### Where should it appear?

- **Everywhere:** Appears in Ideas, search, tags, and collections.

- **Collections only:** Hidden from Ideas and global search. It can be discovered through collections or opened directly with its link.

- **Link only:** Does not appear in Ideas, search, tags, or collections. Anyone with the link can still view it.

When `Only me` is selected, distribution can be hidden or disabled in the UI while preserving its stored value.

The editor should say plainly that `Collections only` and `Link only` are
accessible to anyone with the direct link. If the user switches to `Link only`
while the idea belongs to collections, explain that those memberships remain
stored but stop appearing. Inline card/detail controls and filters must show
both dimensions without confusing an idea's settings with a collection's
separate visibility setting.

## Migration

Existing values map as follows:

```text
PUBLIC
→ access = PUBLIC
→ distribution = LISTED

UNLISTED
→ access = PUBLIC
→ distribution = UNLISTED

PRIVATE
→ access = PRIVATE
→ distribution = LISTED
```

All existing collection memberships survive the migration. In particular,
legacy unlisted memberships must become hidden immediately after the new
policy is activated. Do not delete those rows: changing their distribution
later can make them visible again. Migration and release ordering must account
for the production workflow applying D1 migrations before deploying the new
Worker.

## Architecture Principle

Distribution should be treated as a centralized policy, not as scattered checks throughout the codebase.

The system should conceptually support operations such as:

```ts
canAccessIdea(...)
canSurfaceIdea(..., "ARCHIVE")
canSurfaceIdea(..., "GLOBAL_SEARCH")
canSurfaceIdea(..., "COLLECTION")
canSurfaceIdea(..., "TAG")
```

The initial distribution policies are fixed:

```text
LISTED
COLLECTIONS_ONLY
UNLISTED
```

The design should remain extensible so additional distribution policies or surfaces can be introduced later without changing the meaning of `PUBLIC` and `PRIVATE`.

The same policy needs a TypeScript decision function for ordinary checks and
SQL predicates for list/count/search queries. Filtering unauthorized rows
after pagination would leak counts and produce incomplete pages. New surfaces
should have an explicit policy decision and deny by default.

## Repository findings

- `worker/db/schema.ts` stores the single `ideas.visibility` column and has
  visibility-based feed indexes. `collection_ideas` already uses cascading
  foreign keys, so deleting an idea removes its memberships.
- `worker/db/ideas.ts` allows `PUBLIC` plus the viewer's own ideas in the main
  list and FTS5 search; direct detail allows `PUBLIC`, `UNLISTED`, or author.
- `worker/db/collections.ts` and `worker/collections/policy.ts` currently let
  an unlisted idea appear in some collection contexts. Candidate, target,
  add, and batch flows must be revisited together.
- `worker/db/tags.ts` exposes `tags.public_idea_count`, maintained by
  visibility-sensitive triggers in migration `0004`; tag suggestions also
  query public or author-owned idea links.
- The frontend derives API types from Hono and uses visibility across idea
  forms, inline editors, cards, filters, URL search params, and collection
  screens. The collection visibility picker is shared with idea UI and must
  retain collection semantics.
- `scripts/verify-collections.mjs` provides a local D1 verification harness
  with multiple viewer roles and collection visibilities that can be extended
  for the new matrix.

## Research and design consequences

- [OWASP's authorization guidance](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)
  calls for deny-by-default decisions and authorization on every request.
  Therefore direct detail, nested lists, mutation targets, and metadata
  endpoints all need server-side enforcement.
- [SQLite FTS5's external-content behavior](https://www.sqlite.org/fts5.html#external_content_and_contentless_tables)
  makes the index a search aid, not an access boundary. Continue joining
  matches to `ideas` and apply the current access/distribution predicate
  before returning snippets.
- [SQLite's `ALTER TABLE` rules](https://www.sqlite.org/lang_altertable.html#altertabaddcol)
  allow new `NOT NULL` columns when they have defaults. The old values still
  require an explicit backfill, and migration SQL should be inspected because
  `ideas_fts` and tag-count triggers are maintained outside Drizzle's schema.
- [Cloudflare D1 migrations](https://developers.cloudflare.com/d1/reference/migrations/)
  are versioned SQL. [D1 applies migrations before deployment in this
  repository](./.github/workflows/deploy-production.yml), so old Worker writes during
  rollout need a compatibility strategy. Cloudflare documents migration
  rollback and backup behavior in its [Wrangler command reference](https://developers.cloudflare.com/d1/wrangler-commands/).
- [D1 index guidance](https://developers.cloudflare.com/d1/best-practices/use-indexes/)
  recommends `EXPLAIN QUERY PLAN`; new compound access/distribution predicates
  and collection count queries should be measured before adding indexes.
- [Google's `noindex` documentation](https://developers.google.com/search/docs/crawling-indexing/block-indexing)
  describes crawler behavior, not authorization. Link-only and
  collections-only must be kept out of Stashed discovery in SQL. A `noindex`
  response for their detail pages could be an additional crawler hint, but
  is not part of the access guarantee.
