# Migrations

`drizzle-kit` generates migrations from `worker/db/schema.ts`. This directory
also contains hand-written SQL for DDL that Drizzle cannot express.

## Warning: `ideas_fts` is custom SQL, not managed by Drizzle

`ideas_fts` (an FTS5 virtual table) and its three triggers are custom SQL in
`0001_ideas_fts.sql`. They are NOT represented in `worker/db/schema.ts`, so
Drizzle has no knowledge of them. Custom migrations are the intended solution
for unsupported DDL such as this.

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

-- Index is consistent with the ideas table
INSERT INTO ideas_fts(ideas_fts) VALUES ('integrity-check');
```

### If the FTS setup is damaged

Re-run the DDL from `0001_ideas_fts.sql` (recreate the table + triggers),
then rebuild the index:

```sql
INSERT INTO ideas_fts(ideas_fts) VALUES ('rebuild');
```
