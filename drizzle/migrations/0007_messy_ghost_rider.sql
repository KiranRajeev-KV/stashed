ALTER TABLE `ideas` ADD `access` text DEFAULT 'PUBLIC' NOT NULL;--> statement-breakpoint
ALTER TABLE `ideas` ADD `distribution` text DEFAULT 'LISTED' NOT NULL;--> statement-breakpoint
UPDATE ideas SET
  access = CASE WHEN visibility = 'PRIVATE' THEN 'PRIVATE' ELSE 'PUBLIC' END,
  distribution = CASE WHEN visibility = 'UNLISTED' THEN 'UNLISTED' ELSE 'LISTED' END;
--> statement-breakpoint
-- Old Workers still write visibility while this migration precedes deployment.
CREATE TRIGGER ideas_legacy_insert_bridge AFTER INSERT ON ideas
WHEN NEW.access = 'PUBLIC' AND NEW.distribution = 'LISTED'
  AND NEW.visibility IN ('PRIVATE', 'UNLISTED')
BEGIN
  UPDATE ideas SET
    access = CASE WHEN NEW.visibility = 'PRIVATE' THEN 'PRIVATE' ELSE 'PUBLIC' END,
    distribution = CASE WHEN NEW.visibility = 'UNLISTED' THEN 'UNLISTED' ELSE 'LISTED' END
  WHERE row_id = NEW.row_id;
END;
--> statement-breakpoint
CREATE TRIGGER ideas_legacy_update_bridge AFTER UPDATE OF visibility ON ideas
WHEN NEW.access = OLD.access AND NEW.distribution = OLD.distribution
  AND NEW.visibility != OLD.visibility
BEGIN
  UPDATE ideas SET
    access = CASE WHEN NEW.visibility = 'PRIVATE' THEN 'PRIVATE' ELSE 'PUBLIC' END,
    distribution = CASE WHEN NEW.visibility = 'UNLISTED' THEN 'UNLISTED' ELSE 'LISTED' END
  WHERE row_id = NEW.row_id;
END;
--> statement-breakpoint
DROP TRIGGER idea_tags_after_insert_update_public_tag_count;
--> statement-breakpoint
DROP TRIGGER idea_tags_after_delete_update_public_tag_count;
--> statement-breakpoint
DROP TRIGGER ideas_after_update_visibility_update_public_tag_count;
--> statement-breakpoint
DROP TRIGGER ideas_before_delete_update_public_tag_count;
--> statement-breakpoint
UPDATE tags SET public_idea_count = (
  SELECT count(*) FROM idea_tags it JOIN ideas i ON i.id = it.idea_id
  WHERE it.tag_id = tags.id AND i.access = 'PUBLIC' AND i.distribution = 'LISTED'
);
--> statement-breakpoint
CREATE TRIGGER idea_tags_after_insert_update_public_tag_count AFTER INSERT ON idea_tags
WHEN (SELECT access = 'PUBLIC' AND distribution = 'LISTED' FROM ideas WHERE id = NEW.idea_id)
BEGIN
  UPDATE tags SET public_idea_count = public_idea_count + 1 WHERE id = NEW.tag_id;
END;
--> statement-breakpoint
CREATE TRIGGER idea_tags_after_delete_update_public_tag_count AFTER DELETE ON idea_tags
WHEN (SELECT access = 'PUBLIC' AND distribution = 'LISTED' FROM ideas WHERE id = OLD.idea_id)
BEGIN
  UPDATE tags SET public_idea_count = public_idea_count - 1 WHERE id = OLD.tag_id;
END;
--> statement-breakpoint
CREATE TRIGGER ideas_after_update_policy_update_public_tag_count
AFTER UPDATE OF access, distribution ON ideas
WHEN (OLD.access = 'PUBLIC' AND OLD.distribution = 'LISTED')
  != (NEW.access = 'PUBLIC' AND NEW.distribution = 'LISTED')
BEGIN
  UPDATE tags SET public_idea_count = public_idea_count
    + CASE WHEN NEW.access = 'PUBLIC' AND NEW.distribution = 'LISTED' THEN 1 ELSE -1 END
  WHERE id IN (SELECT tag_id FROM idea_tags WHERE idea_id = NEW.id);
END;
--> statement-breakpoint
CREATE TRIGGER ideas_before_delete_update_public_tag_count BEFORE DELETE ON ideas
WHEN OLD.access = 'PUBLIC' AND OLD.distribution = 'LISTED'
BEGIN
  UPDATE tags SET public_idea_count = public_idea_count - 1
  WHERE id IN (SELECT tag_id FROM idea_tags WHERE idea_id = OLD.id);
END;

