CREATE TABLE `listings` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`publisher` text NOT NULL,
	`publisher_role` text NOT NULL,
	`title` text NOT NULL,
	`category` text NOT NULL,
	`audience` text NOT NULL,
	`total` integer NOT NULL,
	`weight` real NOT NULL,
	`temp` real,
	`deadline` text NOT NULL,
	`address` text NOT NULL,
	`town` text NOT NULL,
	`notes` text NOT NULL,
	`source` text,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `listing_owner_idx` ON `listings` (`owner`);--> statement-breakpoint
CREATE TABLE `profiles` (
	`user_id` text PRIMARY KEY NOT NULL,
	`role` text NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `reservations` (
	`id` text PRIMARY KEY NOT NULL,
	`listing_id` text NOT NULL,
	`user_id` text NOT NULL,
	`quantity` integer NOT NULL,
	`status` text NOT NULL,
	`code` text NOT NULL,
	`created` text NOT NULL,
	FOREIGN KEY (`listing_id`) REFERENCES `listings`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `reservation_listing_idx` ON `reservations` (`listing_id`);--> statement-breakpoint
CREATE INDEX `reservation_user_idx` ON `reservations` (`user_id`);