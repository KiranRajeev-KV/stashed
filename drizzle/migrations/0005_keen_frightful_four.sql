CREATE TABLE `collection_collaborators` (
	`collection_id` text NOT NULL,
	`user_id` text NOT NULL,
	`role` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	PRIMARY KEY(`collection_id`, `user_id`),
	FOREIGN KEY (`collection_id`) REFERENCES `collections`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `collection_collaborators_user_role_collection_idx` ON `collection_collaborators` (`user_id`,`role`,`collection_id`);--> statement-breakpoint
CREATE TABLE `collection_ideas` (
	`collection_id` text NOT NULL,
	`idea_id` text NOT NULL,
	`added_by_user_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	PRIMARY KEY(`collection_id`, `idea_id`),
	FOREIGN KEY (`collection_id`) REFERENCES `collections`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`idea_id`) REFERENCES `ideas`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`added_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `collection_ideas_idea_collection_idx` ON `collection_ideas` (`idea_id`,`collection_id`);--> statement-breakpoint
CREATE TABLE `collections` (
	`row_id` integer PRIMARY KEY NOT NULL,
	`id` text NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`icon` text DEFAULT 'folder' NOT NULL,
	`visibility` text DEFAULT 'PUBLIC' NOT NULL,
	`owner_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `collections_id_unique` ON `collections` (`id`);--> statement-breakpoint
CREATE INDEX `collections_visibility_updated_row_id_idx` ON `collections` (`visibility`,"updated_at" desc,"row_id" desc);--> statement-breakpoint
CREATE INDEX `collections_visibility_created_row_id_idx` ON `collections` (`visibility`,"created_at" desc,"row_id" desc);--> statement-breakpoint
CREATE INDEX `collections_owner_updated_row_id_idx` ON `collections` (`owner_id`,"updated_at" desc,"row_id" desc);--> statement-breakpoint
CREATE INDEX `collections_name_row_id_idx` ON `collections` (`name`,`row_id`);--> statement-breakpoint
CREATE VIRTUAL TABLE collections_fts USING fts5(
  name,
  description,
  content = 'collections',
  content_rowid = 'row_id',
  tokenize = "unicode61 tokenchars '+#'"
);--> statement-breakpoint
CREATE TRIGGER collections_fts_after_insert AFTER INSERT ON collections BEGIN
  INSERT INTO collections_fts(rowid, name, description) VALUES (new.row_id, new.name, new.description);
END;--> statement-breakpoint
CREATE TRIGGER collections_fts_after_delete AFTER DELETE ON collections BEGIN
  INSERT INTO collections_fts(collections_fts, rowid, name, description) VALUES ('delete', old.row_id, old.name, old.description);
END;--> statement-breakpoint
CREATE TRIGGER collections_fts_after_searchable_update AFTER UPDATE OF name, description ON collections BEGIN
  INSERT INTO collections_fts(collections_fts, rowid, name, description) VALUES ('delete', old.row_id, old.name, old.description);
  INSERT INTO collections_fts(rowid, name, description) VALUES (new.row_id, new.name, new.description);
END;--> statement-breakpoint
INSERT INTO collections_fts(collections_fts) VALUES ('rebuild');
