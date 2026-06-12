CREATE TABLE `launch_history` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`preset_id` text,
	`duration_sec` integer NOT NULL,
	`started_at` integer NOT NULL,
	`source` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `meta` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `presets` (
	`id` text PRIMARY KEY NOT NULL,
	`icon` text NOT NULL,
	`color` text NOT NULL,
	`duration_sec` integer NOT NULL,
	`in_widget` integer DEFAULT false NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `running_timers` (
	`id` text PRIMARY KEY NOT NULL,
	`preset_id` text,
	`icon` text NOT NULL,
	`color` text NOT NULL,
	`duration_sec` integer NOT NULL,
	`end_at` integer NOT NULL,
	`state` text DEFAULT 'running' NOT NULL,
	`paused_remaining_sec` integer,
	`created_at` integer NOT NULL
);
