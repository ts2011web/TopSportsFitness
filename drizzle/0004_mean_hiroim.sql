CREATE TABLE `club_reports` (
	`id` text PRIMARY KEY NOT NULL,
	`club_id` text NOT NULL,
	`signed_on` text NOT NULL,
	`counts` text NOT NULL,
	`online` integer NOT NULL,
	`total` integer NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL,
	`cancelled_at` text,
	`cancelled_by` text
);

--> statement-breakpoint
CREATE UNIQUE INDEX club_reports_active_day ON club_reports(club_id,signed_on) WHERE cancelled_at IS NULL;
