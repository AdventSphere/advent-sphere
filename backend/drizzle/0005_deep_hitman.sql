PRAGMA foreign_keys=OFF;--> statement-breakpoint
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
	FOREIGN KEY (`owner_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_room`("id", "edit_id", "created_at", "owner_id", "password", "is_anonymous", "start_at", "item_get_time", "generate_count") SELECT "id", "edit_id", "created_at", "owner_id", "password", "is_anonymous", "start_at", "item_get_time", "generate_count" FROM `room`;--> statement-breakpoint
DROP TABLE `room`;--> statement-breakpoint
ALTER TABLE `__new_room` RENAME TO `room`;--> statement-breakpoint
PRAGMA foreign_keys=ON;