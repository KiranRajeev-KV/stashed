CREATE TABLE `tag_suggestion_attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`utc_day` text NOT NULL,
	`utc_month` text NOT NULL,
	`created_at` integer NOT NULL,
	`input_tokens` integer,
	`provider_status` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `tag_suggestion_attempts_user_day_idx` ON `tag_suggestion_attempts` (`user_id`,`utc_day`);--> statement-breakpoint
CREATE TABLE `tag_suggestion_control` (
	`id` integer PRIMARY KEY NOT NULL,
	`enabled` integer DEFAULT 0 NOT NULL,
	`user_daily_limit` integer DEFAULT 10 NOT NULL,
	`global_monthly_limit` integer DEFAULT 1500 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tag_suggestion_global_usage` (
	`utc_month` text PRIMARY KEY NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`input_tokens` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tag_suggestion_user_usage` (
	`user_id` text NOT NULL,
	`utc_day` text NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`user_id`, `utc_day`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO tag_suggestion_control (id, enabled, user_daily_limit, global_monthly_limit)
VALUES (1, 0, 10, 1500);
--> statement-breakpoint
CREATE TRIGGER tag_suggestion_attempts_before_insert BEFORE INSERT ON tag_suggestion_attempts BEGIN
  SELECT (CASE WHEN NOT EXISTS (
    SELECT 1 FROM tag_suggestion_control
    WHERE id = 1 AND enabled = 1 AND user_daily_limit > 0 AND global_monthly_limit > 0
  ) THEN RAISE(ABORT, 'SUGGESTIONS_DISABLED') END);
  SELECT (CASE WHEN COALESCE((
    SELECT attempts FROM tag_suggestion_user_usage
    WHERE user_id = NEW.user_id AND utc_day = NEW.utc_day
  ), 0) >= (SELECT user_daily_limit FROM tag_suggestion_control WHERE id = 1)
  THEN RAISE(ABORT, 'USER_QUOTA_REACHED') END);
  SELECT (CASE WHEN COALESCE((
    SELECT attempts FROM tag_suggestion_global_usage WHERE utc_month = NEW.utc_month
  ), 0) >= (SELECT global_monthly_limit FROM tag_suggestion_control WHERE id = 1)
  THEN RAISE(ABORT, 'GLOBAL_QUOTA_REACHED') END);
END;
--> statement-breakpoint
CREATE TRIGGER tag_suggestion_attempts_after_insert AFTER INSERT ON tag_suggestion_attempts BEGIN
  INSERT INTO tag_suggestion_user_usage (user_id, utc_day, attempts)
  VALUES (NEW.user_id, NEW.utc_day, 1)
  ON CONFLICT (user_id, utc_day) DO UPDATE SET attempts = attempts + 1;
  INSERT INTO tag_suggestion_global_usage (utc_month, attempts, input_tokens)
  VALUES (NEW.utc_month, 1, 0)
  ON CONFLICT (utc_month) DO UPDATE SET attempts = attempts + 1;
END;
--> statement-breakpoint
CREATE TRIGGER tag_suggestion_attempts_after_usage AFTER UPDATE OF input_tokens ON tag_suggestion_attempts
WHEN OLD.input_tokens IS NULL AND NEW.input_tokens IS NOT NULL AND NEW.input_tokens >= 0 BEGIN
  UPDATE tag_suggestion_global_usage
  SET input_tokens = input_tokens + NEW.input_tokens
  WHERE utc_month = NEW.utc_month;
END;
