# Local database seeding

Run `pnpm db:seed` after installing dependencies. It validates the fixtures,
applies local migrations, and seeds all application tables in one atomic local
D1 batch. No Cloudflare login, AI provider calls, or new dependencies are needed.
It uses the existing Wrangler CLI and the application's Markdown converter.
Node.js 22.6+ is required for `--experimental-strip-types`.

## Commands

```sh
# Migrate and seed normal local Wrangler state
pnpm db:seed

# Reuse your real local GitHub login, or create its local identity before login
pnpm db:seed --owner-github-id 12345 --owner-username demo-maintainer

# Migrate/seed isolated state without modifying your usual development database
pnpm db:seed --persist-to /tmp/stashed-demo

# Print generated SQL without migrating or writing anything
node --experimental-strip-types scripts/seed.mjs --dry-run > seed.sql

# Integration checks in a disposable, automatically removed D1 state directory
pnpm verify:seed
```

`pnpm db:seed --help` lists the supported options. `--remote`, arbitrary database
names, and unknown flags are rejected. Use the Node command above when redirecting
SQL: `pnpm` can print its script header to stdout.

The Vite integration's state directory must match the seed command. See
`vite.config.ts` for the configured Cloudflare plugin; the `persistState` option
is a plugin setting, not a Vite CLI flag. For an isolated Worker session, build
and run Wrangler directly instead:

```sh
pnpm build
pnpm exec wrangler dev --persist-to /tmp/stashed-demo
```

## Coverage

The fixture set has four personas, 45 Ideas, 21 tags, and 27 Collections. Dates
and IDs are fixed so sorting, links, and reruns are reproducible. Public Ideas and the Product experiments membership list exceed the UI's
20-record page size. Collections are curated by topic, rather than padded with
numbered copies to force pagination.

| Tables                                                     | Scenarios                                                                                                                                                   |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `users`, `user_identities`                                 | Four authors; synthetic GitHub identities by default; optional real owner mapping; existing login/profile reuse                                             |
| `ideas`                                                    | Every combination of six statuses and three visibility levels; curated Markdown, empty content, long titles, Unicode, tables, code and task lists           |
| `tags`, `idea_tags`                                        | Relevant topic tags, tag-free drafts, existing tags reused case-insensitively                                                                               |
| `collections`                                              | Public, Unlisted, Private, empty and differently owned Collections; pagination                                                                              |
| `collection_collaborators`                                 | Owner on the container; Editor and Viewer collaborators; nonparticipant access scenarios                                                                    |
| `collection_ideas`                                         | Shared Ideas in multiple Collections; more than one page of public Ideas in Product experiments; mixed Idea visibility independent of Collection visibility |
| `tag_suggestion_control`                                   | Migration-provided singleton; original enabled state and quota limits restored                                                                              |
| `tag_suggestion_attempts`                                  | Successful, failed and pending historical attempts across two days in June and one day in July 2026                                                         |
| `tag_suggestion_user_usage`, `tag_suggestion_global_usage` | Attempt and token counters derived through the real quota triggers                                                                                          |

Search virtual tables and their SQLite shadow tables are derived, never populated
as independent fixtures. Inserts/updates exercise the FTS triggers.
`content_plain` uses `worker/ideas/markdown.ts`, exactly as application writes do.
Wrangler/D1 migration and internal tables are maintained by their owning tools.

## Demo workspace

The data represents a fictional product studio with four contributors:

| Contributor  | Focus                                 | Examples                                                 |
| ------------ | ------------------------------------- | -------------------------------------------------------- |
| Alex Morgan  | Product direction and team operations | Evidence maps, project handoffs, feedback follow-up      |
| Mira Chen    | Research and knowledge tools          | Interview observations, study protocols, useful search   |
| Elias Porter | Engineering and service reliability   | Deployment diagnostics, job delivery, portable exports   |
| Noor Rahman  | Accessible interaction design         | Focus recovery, screen-reader errors, translated layouts |

Each Idea has its own title, notes, lifecycle, author, and topic tags. Published
concepts are Public, review drafts are Unlisted, and personal working notes are
Private. Closed experiments describe the outcome rather than presenting an
unfinished checklist as completed work.

Collection memberships use explicit Idea keys. Subject collections group related
work, and narrower collections connect Ideas across those subjects. For example,
**Knowledge tools** includes notebook sync, exports, and retrieval; **Portable
data** links the notebook and export proposals with the portable-project format.
**Product experiments** is the public portfolio. It includes public concepts and
findings, with all four contributors able to curate it. It excludes private
scratchpads and link-shared reviews.

Ownership and collaborator roles follow those responsibilities. A contributor
adds their own work when they are an editor. A Collection manager can add another
author's public/link-accessible Idea, but only an Idea's author can add a private
Idea. The validator enforces this independent access rule. Sharing a Collection
does not grant its collaborators access to a private Idea inside it.

Useful routes:

- Product experiments: `/collections/30000000-0000-4000-8000-000000000001`
- Research practice: `/collections/30000000-0000-4000-8000-000000000002`
- Accessible interfaces (Alex has Viewer access): `/collections/30000000-0000-4000-8000-000000000003`
- Team operations (Unlisted): `/collections/30000000-0000-4000-8000-000000000007`
- Next quarter (empty, Private): `/collections/30000000-0000-4000-8000-000000000008`
- Design workbench (Private; Alex has no access): `/collections/30000000-0000-4000-8000-000000000010`

Open an Idea from Product experiments to exercise collection breadcrumbs and
existing-membership button states. Search for `counterexample` to find a phrase
in an interview-library note body, or `coordinating` to find Team operations by
its description. Search checks use ordinary content rather than visible test
markers.

Default personas use negative provider IDs, `.invalid` email addresses and no
external avatars. They cannot be signed into via real GitHub OAuth. Pass your own
numeric GitHub ID to make the primary persona's records manageable through the
normal login flow. This is data seeding, not an authentication bypass. The three
other personas remain useful for authored content and authorization scenarios.

## Rerun behavior and ownership

Fixture IDs define seed-owned Ideas and Collections. Rerunning restores their
content, status, visibility, ownership and links to the fixture definitions.
Edits to those demo records are intentionally overwritten. Relationships inside
seeded Collections and tags on seeded Ideas are restored exactly.

Other Ideas, Collections, memberships in nonseeded Collections, and profiles are
preserved. Existing GitHub identities are resolved by `(provider, provider_user_id)`;
existing tags are resolved case-insensitively by name. Their original IDs and
profile fields are retained. All 45 earlier demo Idea IDs and 27 Collection IDs
are reused, so running the seed replaces the previous placeholder content and
memberships. Obsolete fixture tags are removed only when they have no links;
shared tags remain intact. Avoid using the fixture UUID ranges for your own
manually inserted records.

Use the same owner ID options for each run. Changing the owner option reassigns
the primary persona's demo Ideas and Collections, but preserves previous users
and attempt history. It does not rewrite historical usage records.

Suggestion attempts use stable IDs, and duplicates are excluded before SQLite's
BEFORE INSERT quota trigger can run. User and global usage is derived by those
triggers, not independently hardcoded. The seed temporarily lifts limits inside
the transaction to create the historical attempts, then restores the original
control row. Reruns neither consume additional quota nor change the switch.
Historical usage does not consume today's allowance. Seeding never calls Jev or
any external service, and the switch remains disabled on a fresh database.

There is no implicit reset or deletion of the database. For a pristine disposable
setup, use a new `--persist-to` directory. The separate `just db-reset` recipe
wipes normal local state and does not seed it automatically.

## Validation and maintenance

`pnpm verify:seed` runs against the actual local D1 implementation. It verifies:

- Fixture validation and deterministic generated SQL.
- A fresh database, including automatic migrations.
- Every Drizzle application table exists and receives fixtures.
- Exact rerun stability, including timestamps and quota counters.
- Reuse of an existing login and a case-insensitive shared tag.
- Preservation of unrelated records and custom suggestion settings.
- Full-text search, normalized Markdown, and pagination datasets.
- Tag counts, public-only counts, quota counters and foreign keys.
- Atomic rollback when a late SQL constraint fails.

The runner also checks foreign keys, counters, fixture totals, and both FTS
external-content integrity checks inside the seed batch. Any failure rolls back
all fixture writes, including control changes. Migrations are a separate phase
and remain applied. It does not disable foreign keys or rebuild indexes to hide
broken triggers.

Fixtures live in `scripts/seed/fixtures.mjs`; SQL and invariants live in
`scripts/seed/sql.mjs`. When adding a table or enum value, update the fixtures and
verification. Table coverage is compared against `worker/db/schema.ts` so a new
unseeded table fails verification. CI runs this check after the build.

## Research behind the approach

- [Drizzle's seed overview](https://orm.drizzle.team/docs/seed-overview) explains
  deterministic datasets for repeatable development and debugging. Curated
  fixtures suit this app's small schema and specific authorization scenarios.
- [Cloudflare's local D1 guide](https://developers.cloudflare.com/d1/best-practices/local-development/)
  documents explicit local execution and persistent state directories.
- [Cloudflare's SQL-file import guide](https://developers.cloudflare.com/d1/best-practices/import-export-data/)
  documents loading SQL with Wrangler's `--file` option.
- [D1 batch API](https://developers.cloudflare.com/d1/worker-api/d1-database/#batch)
  documents transactional batches. The installed Wrangler's local SQL-file
  executor uses `db.batch`; the integration test verifies rollback behavior.
- [D1 foreign keys](https://developers.cloudflare.com/d1/sql-api/foreign-keys/)
  documents enforced relationships. Fixtures are inserted in dependency order
  with foreign-key enforcement left enabled.
