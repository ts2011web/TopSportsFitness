CREATE TABLE `dashboard` (
	`id` integer PRIMARY KEY NOT NULL,
	`config` text NOT NULL,
	`owner` text NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`updated_at` text NOT NULL
);
