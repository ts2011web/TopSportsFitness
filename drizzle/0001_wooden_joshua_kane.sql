CREATE TABLE `memberships` (
	`id` text PRIMARY KEY NOT NULL,
	`club_id` text NOT NULL,
	`employee` text NOT NULL,
	`reference` text NOT NULL,
	`signed_on` text NOT NULL,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL,
	`cancelled_at` text,
	`cancelled_by` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `memberships_club_reference` ON `memberships` (`club_id`,`reference`);--> statement-breakpoint
CREATE INDEX `memberships_date_club` ON `memberships` (`signed_on`,`club_id`);
--> statement-breakpoint
UPDATE dashboard SET config = json_insert(config, '$.tools[#]', json('{"id": "club-overview", "name": "CÜ (Clubübersicht)", "description": "Mitgliedschaften erfassen und Club-Ziele verfolgen", "url": "", "icon": "contracts", "color": "orange", "kind": "memberships"}')), revision = revision + 1 WHERE NOT EXISTS (SELECT 1 FROM json_each(dashboard.config, '$.tools') WHERE json_extract(value, '$.kind') = 'memberships');
