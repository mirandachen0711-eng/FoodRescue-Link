CREATE TABLE `members` (
	`org_id` text NOT NULL,
	`user_id` text NOT NULL,
	`display_name` text NOT NULL,
	`role` text DEFAULT 'staff' NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created` text NOT NULL,
	PRIMARY KEY(`org_id`, `user_id`),
	FOREIGN KEY (`org_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `member_user_idx` ON `members` (`user_id`,`status`);--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`kind` text NOT NULL,
	`listing_title` text NOT NULL,
	`created` text NOT NULL,
	`seen` integer DEFAULT 0 NOT NULL,
	`email_sent` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `notification_user_idx` ON `notifications` (`user_id`,`created`);--> statement-breakpoint
CREATE TABLE `organizations` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`name` text NOT NULL,
	`kind` text NOT NULL,
	`website` text NOT NULL,
	`phone` text NOT NULL,
	`address` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`review_note` text DEFAULT '' NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
ALTER TABLE `listings` ADD `org_id` text;--> statement-breakpoint
ALTER TABLE `listings` ADD `status` text DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE `listings` ADD `pickup_start` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `listings` ADD `per_person` integer DEFAULT 5 NOT NULL;--> statement-breakpoint
ALTER TABLE `listings` ADD `allergens` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `listings` ADD `dietary` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `listings` ADD `instructions` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `listings` ADD `version` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
CREATE INDEX `listing_org_idx` ON `listings` (`org_id`);--> statement-breakpoint
ALTER TABLE `profiles` ADD `email` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `profiles` ADD `org_id` text;--> statement-breakpoint
ALTER TABLE `profiles` ADD `reminders` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `reservations` ADD `reserver_org` text;--> statement-breakpoint
ALTER TABLE `reservations` ADD `assisted_label` text;--> statement-breakpoint
CREATE INDEX `reservation_org_idx` ON `reservations` (`reserver_org`);