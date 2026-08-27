ALTER TABLE `ideas` ADD `visibility` text DEFAULT 'PUBLIC' NOT NULL;--> statement-breakpoint
CREATE INDEX `ideas_visibility_updated_row_id_idx` ON `ideas` (`visibility`,"updated_at" desc,"row_id" desc);--> statement-breakpoint
CREATE INDEX `ideas_visibility_created_row_id_idx` ON `ideas` (`visibility`,"created_at" desc,"row_id" desc);--> statement-breakpoint
ALTER TABLE `tags` ADD `public_idea_count` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX `tags_public_idea_count_name_key_idx` ON `tags` ("public_idea_count" desc,`name_key`,`name`);--> statement-breakpoint

-- Every idea that pre-dates this migration is PUBLIC by default. Calculate
-- the count from source tables instead of depending on that implementation
-- detail so this remains correct if the migration is reapplied locally.
UPDATE `tags`
SET `public_idea_count` = (
  SELECT count(*)
  FROM `idea_tags`
  INNER JOIN `ideas` ON `ideas`.`id` = `idea_tags`.`idea_id`
  WHERE `idea_tags`.`tag_id` = `tags`.`id`
    AND `ideas`.`visibility` = 'PUBLIC'
);--> statement-breakpoint

-- Keep the anonymous tag index free of names and counts belonging solely to
-- unlisted or private ideas. The existing idea_count triggers remain the
-- internal all-idea metric.
CREATE TRIGGER `idea_tags_after_insert_update_public_tag_count`
AFTER INSERT ON `idea_tags`
WHEN (
  SELECT `visibility` FROM `ideas` WHERE `id` = new.`idea_id`
) = 'PUBLIC'
BEGIN
  UPDATE `tags`
  SET `public_idea_count` = `public_idea_count` + 1
  WHERE `id` = new.`tag_id`;
END;--> statement-breakpoint

CREATE TRIGGER `idea_tags_after_delete_update_public_tag_count`
AFTER DELETE ON `idea_tags`
WHEN (
  SELECT `visibility` FROM `ideas` WHERE `id` = old.`idea_id`
) = 'PUBLIC'
BEGIN
  UPDATE `tags`
  SET `public_idea_count` = `public_idea_count` - 1
  WHERE `id` = old.`tag_id`;
END;--> statement-breakpoint

CREATE TRIGGER `ideas_after_update_visibility_update_public_tag_count`
AFTER UPDATE OF `visibility` ON `ideas`
WHEN old.`visibility` != new.`visibility`
BEGIN
  UPDATE `tags`
  SET `public_idea_count` = `public_idea_count`
    + CASE WHEN new.`visibility` = 'PUBLIC' THEN 1 ELSE 0 END
    - CASE WHEN old.`visibility` = 'PUBLIC' THEN 1 ELSE 0 END
  WHERE `id` IN (
    SELECT `tag_id` FROM `idea_tags` WHERE `idea_id` = new.`id`
  );
END;--> statement-breakpoint

-- Cascading idea_tags deletes cannot inspect a deleted parent row, so adjust
-- public counts before the cascade begins.
CREATE TRIGGER `ideas_before_delete_update_public_tag_count`
BEFORE DELETE ON `ideas`
WHEN old.`visibility` = 'PUBLIC'
BEGIN
  UPDATE `tags`
  SET `public_idea_count` = `public_idea_count` - 1
  WHERE `id` IN (
    SELECT `tag_id` FROM `idea_tags` WHERE `idea_id` = old.`id`
  );
END;
