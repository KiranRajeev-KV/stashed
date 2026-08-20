ALTER TABLE `ideas` ADD `content_plain` text DEFAULT '' NOT NULL;
--> statement-breakpoint
-- Preserve all existing content during the rolling deployment. The Worker
-- normalizes it before display, while the post-deployment backfill replaces
-- these transitional values with fully normalized text.
UPDATE `ideas` SET `content_plain` = `content`;
--> statement-breakpoint
DROP TRIGGER `ideas_fts_after_insert`;
--> statement-breakpoint
DROP TRIGGER `ideas_fts_after_delete`;
--> statement-breakpoint
DROP TRIGGER `ideas_fts_after_searchable_update`;
--> statement-breakpoint
DROP TABLE `ideas_fts`;
--> statement-breakpoint
CREATE VIRTUAL TABLE `ideas_fts` USING fts5(
  title,
  content_plain,
  content = 'ideas',
  content_rowid = 'row_id',
  tokenize = "unicode61 tokenchars '+#'"
);
--> statement-breakpoint
CREATE TRIGGER `ideas_fts_after_insert`
AFTER INSERT ON `ideas`
BEGIN
  INSERT INTO `ideas_fts`(rowid, title, content_plain)
  VALUES (new.row_id, new.title, new.content_plain);
END;
--> statement-breakpoint
CREATE TRIGGER `ideas_fts_after_delete`
AFTER DELETE ON `ideas`
BEGIN
  INSERT INTO `ideas_fts`(ideas_fts, rowid, title, content_plain)
  VALUES ('delete', old.row_id, old.title, old.content_plain);
END;
--> statement-breakpoint
CREATE TRIGGER `ideas_fts_after_searchable_update`
AFTER UPDATE OF title, content_plain ON `ideas`
BEGIN
  INSERT INTO `ideas_fts`(ideas_fts, rowid, title, content_plain)
  VALUES ('delete', old.row_id, old.title, old.content_plain);

  INSERT INTO `ideas_fts`(rowid, title, content_plain)
  VALUES (new.row_id, new.title, new.content_plain);
END;
--> statement-breakpoint
INSERT INTO `ideas_fts`(ideas_fts) VALUES ('rebuild');
