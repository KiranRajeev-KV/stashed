ALTER TABLE `tags` ADD `name_key` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `tags` ADD `idea_count` integer DEFAULT 0 NOT NULL;--> statement-breakpoint

-- Existing tags receive stable keys before the unique index is created.
UPDATE `tags` SET `name_key` = lower(`name`);--> statement-breakpoint

-- Discovery counts only linked tags and stays accurate through the triggers below.
UPDATE `tags`
SET `idea_count` = (
  SELECT count(*) FROM `idea_tags`
  WHERE `idea_tags`.`tag_id` = `tags`.`id`
);--> statement-breakpoint

CREATE INDEX `tags_idea_count_name_key_idx`
ON `tags` (`idea_count` DESC, `name_key`, `name`);--> statement-breakpoint

-- Older Worker versions only write name; fill the derived key for their rows.
CREATE TRIGGER `tags_after_insert_populate_name_key`
AFTER INSERT ON `tags`
WHEN new.`name_key` = ''
BEGIN
  UPDATE `tags` SET `name_key` = lower(new.`name`) WHERE `id` = new.`id`;
END;--> statement-breakpoint

CREATE TRIGGER `idea_tags_after_insert_update_tag_count`
AFTER INSERT ON `idea_tags`
BEGIN
  UPDATE `tags`
  SET `idea_count` = `idea_count` + 1
  WHERE `id` = new.`tag_id`;
END;--> statement-breakpoint

CREATE TRIGGER `idea_tags_after_delete_update_tag_count`
AFTER DELETE ON `idea_tags`
BEGIN
  UPDATE `tags`
  SET `idea_count` = `idea_count` - 1
  WHERE `id` = old.`tag_id`;
END;
