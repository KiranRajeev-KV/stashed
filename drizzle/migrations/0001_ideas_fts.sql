-- Full-text search index for ideas.
--
-- `ideas` remains the source of truth for title/content.
-- FTS5 stores the search index and maps each search document to
-- ideas.row_id using content_rowid.

CREATE VIRTUAL TABLE ideas_fts USING fts5(
    title,
    content,
    content = 'ideas',
    content_rowid = 'row_id',
    tokenize = "unicode61 tokenchars '+#'"
);

--> statement-breakpoint

-- When an idea is created, add its searchable fields to the FTS index.
CREATE TRIGGER ideas_fts_after_insert
AFTER INSERT ON ideas
BEGIN
    INSERT INTO ideas_fts(rowid, title, content)
    VALUES (new.row_id, new.title, new.content);
END;

--> statement-breakpoint

-- When an idea is deleted, remove the old document from the FTS index.
CREATE TRIGGER ideas_fts_after_delete
AFTER DELETE ON ideas
BEGIN
    INSERT INTO ideas_fts(ideas_fts, rowid, title, content)
    VALUES ('delete', old.row_id, old.title, old.content);
END;

--> statement-breakpoint

-- Only title/content changes need to update the search index.
-- Changing status or timestamps does not require re-indexing.
CREATE TRIGGER ideas_fts_after_searchable_update
AFTER UPDATE OF title, content ON ideas
BEGIN
    INSERT INTO ideas_fts(ideas_fts, rowid, title, content)
    VALUES ('delete', old.row_id, old.title, old.content);

    INSERT INTO ideas_fts(rowid, title, content)
    VALUES (new.row_id, new.title, new.content);
END;

--> statement-breakpoint

-- Populate/rebuild the FTS index from any ideas that already exist.
INSERT INTO ideas_fts(ideas_fts) VALUES ('rebuild');
