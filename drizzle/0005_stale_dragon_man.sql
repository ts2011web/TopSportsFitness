CREATE TABLE `monthly_stats` (
	`period` text PRIMARY KEY NOT NULL,
	`config` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
INSERT INTO monthly_stats (period,config,updated_at)
SELECT json_extract(config,'$.period'),config,updated_at FROM dashboard WHERE id=1;
