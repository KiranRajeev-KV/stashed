# Migrations

`drizzle-kit` generates migrations from `worker/db/schema.ts`. This directory
also contains hand-written SQL for DDL that Drizzle cannot express.

## Warning: `ideas_fts` is custom SQL, not managed by Drizzle

`ideas_fts` (an FTS5 virtual table) and its three triggers are custom SQL.
They are NOT represented in `worker/db/schema.ts`, so Drizzle has no knowledge
of them. `0002_puzzling_justice.sql` rebuilds it to index `content_plain`.
Custom migrations are the intended solution for unsupported DDL such as this.

## Data migrations

Most migrations only change schema and are fully handled by `pnpm db:remote`.
When a migration needs existing records transformed, its instructions belong in
this section rather than in the root README.

### `0002_puzzling_justice.sql`: plain-text idea search index

Run this once **only if the target database contained ideas before migration
`0002`**. The schema migration preserves those rows temporarily, then this
backfill replaces their raw Markdown with normalized `content_plain` text and
updates FTS through its triggers:

```bash
pnpm db:backfill-content-plain
```

Fresh databases do not need this command: new ideas always derive
`content_plain` when they are created or their content changes.

### `0003_spicy_proemial_gods.sql`: tag discovery indexes

This migration adds `tags.name_key` and a materialized `tags.idea_count`.
It backfills both values from existing data and installs triggers that keep
the count correct whenever an `idea_tags` row is inserted or deleted. It is
self-contained: do not run a separate production backfill script.

Before applying it remotely, verify it locally:

```bash
pnpm db:local
pnpm db:seed
pnpm exec wrangler d1 execute stashed-db --local --command "SELECT id, name, name_key, idea_count FROM tags ORDER BY name_key LIMIT 10"
pnpm exec wrangler d1 execute stashed-db --local --command "SELECT t.id, t.idea_count, count(it.idea_id) AS actual_count FROM tags AS t LEFT JOIN idea_tags AS it ON it.tag_id = t.id GROUP BY t.id HAVING t.idea_count != count(it.idea_id)"
pnpm exec wrangler d1 execute stashed-db --local --command "EXPLAIN QUERY PLAN SELECT id, name, idea_count FROM tags WHERE idea_count > 0 ORDER BY idea_count DESC, name_key ASC, name ASC LIMIT 50"
```

The count-consistency query must return no rows. The query plan should use
`tags_idea_count_name_key_idx` and must not join or aggregate `idea_tags`.

After the local check succeeds, apply the already-versioned migration to the
remote database with `pnpm db:remote`, then run the same verification commands
with `--remote` instead of `--local`. This migration is compatible with the
previous Worker version: its `tags_after_insert_populate_name_key` trigger
fills the new derived key for legacy inserts. Apply the migration, verify it,
then deploy the Worker that writes `name_key` directly. Run `PRAGMA optimize`
once after the remote migration so SQLite refreshes planner statistics:

```bash
pnpm exec wrangler d1 execute stashed-db --remote --command "PRAGMA optimize"
```

For a local D1 simulator check, append `--local` to the command. Run the
remote command after `pnpm db:remote` has applied migration `0003`.

Whenever a future migration substantially modifies or rebuilds the `ideas`
table, inspect the generated SQL and verify:

- `ideas_fts` still exists
- all 3 triggers still exist
- an FTS integrity-check passes

In particular, SQLite schema changes sometimes require table recreation,
which silently drops virtual tables and triggers. Treat FTS verification as
a mandatory step for every migration touching `ideas`.

### Verify

```sql
-- Exists?
SELECT name FROM sqlite_master WHERE name = 'ideas_fts';
SELECT name FROM sqlite_master
WHERE type = 'trigger' AND tbl_name = 'ideas' AND name LIKE 'ideas_fts_%';

-- Index is internally consistent and agrees with the external ideas table
INSERT INTO ideas_fts(ideas_fts, rank) VALUES ('integrity-check', 1);
```

### If the FTS setup is damaged

Re-run the latest FTS DDL migration (recreate the table + triggers), then
rebuild the index:

```sql
INSERT INTO ideas_fts(ideas_fts) VALUES ('rebuild');
```
