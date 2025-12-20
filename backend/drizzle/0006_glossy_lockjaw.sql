PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_calendar_item` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`room_id` text NOT NULL,
	`user_id` text NOT NULL,
	`open_date` integer NOT NULL,
	`position` text,
	`rotation` text,
	`is_opened` integer DEFAULT false NOT NULL,
	`item_id` text NOT NULL,
	`image_id` text,
	FOREIGN KEY (`room_id`) REFERENCES `room`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`item_id`) REFERENCES `item`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_calendar_item`("id", "created_at", "room_id", "user_id", "open_date", "position", "rotation", "is_opened", "item_id", "image_id") SELECT "id", "created_at", "room_id", "user_id", "open_date", "position", "rotation", "is_opened", "item_id", "image_id" FROM `calendar_item`;--> statement-breakpoint
DROP TABLE `calendar_item`;--> statement-breakpoint
ALTER TABLE `__new_calendar_item` RENAME TO `calendar_item`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_room` (
	`id` text PRIMARY KEY NOT NULL,
	`edit_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`owner_id` text NOT NULL,
	`password` text,
	`is_anonymous` integer DEFAULT false NOT NULL,
	`start_at` integer NOT NULL,
	`item_get_time` integer,
	`generate_count` integer DEFAULT 0 NOT NULL,
	`snow_dome_parts_last_date` integer,
	FOREIGN KEY (`owner_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_room`("id", "edit_id", "created_at", "owner_id", "password", "is_anonymous", "start_at", "item_get_time", "generate_count", "snow_dome_parts_last_date") SELECT "id", "edit_id", "created_at", "owner_id", "password", "is_anonymous", "start_at", "item_get_time", "generate_count", "snow_dome_parts_last_date" FROM `room`;--> statement-breakpoint
DROP TABLE `room`;--> statement-breakpoint
ALTER TABLE `__new_room` RENAME TO `room`;