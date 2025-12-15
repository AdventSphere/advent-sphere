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
	`item_id` integer NOT NULL,
	`image_id` integer,
	FOREIGN KEY (`room_id`) REFERENCES `room`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`item_id`) REFERENCES `item`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_calendar_item`("id", "created_at", "room_id", "user_id", "open_date", "position", "rotation", "is_opened", "item_id", "image_id") SELECT "id", "created_at", "room_id", "user_id", "open_date", "position", "rotation", "is_opened", "item_id", "image_id" FROM `calendar_item`;--> statement-breakpoint
DROP TABLE `calendar_item`;--> statement-breakpoint
ALTER TABLE `__new_calendar_item` RENAME TO `calendar_item`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
ALTER TABLE `room` ADD `item_get_time` integer;