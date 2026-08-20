# Migrations

`drizzle-kit` generates migrations from `worker/db/schema.ts`. This directory
also contains hand-written SQL for DDL that Drizzle cannot express.

## Warning: `ideas_fts` is custom SQL, not managed by Drizzle

`ideas_fts` (an FTS5 virtual table) and its three triggers are custom SQL.
They are NOT represented in `worker/db/schema.ts`, so Drizzle has no knowledge
of them. `0002_puzzling_justice.sql` rebuilds it to index `content_plain`.
Custom migrations are the intended solution for unsupported DDL such as this.

After applying `0002_puzzling_justice.sql` remotely, run this once from an
authenticated checkout to replace its transitional raw-Markdown values with
normalized text and update the FTS index through its triggers:

```bash
pnpm db:backfill-content-plain
```

For a local D1 simulator check, append `--local` to the command.

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
