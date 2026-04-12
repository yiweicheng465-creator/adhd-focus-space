CREATE TABLE `agents` (
	`id` varchar(36) NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`task` text NOT NULL,
	`status` enum('running','paused','done','failed') NOT NULL DEFAULT 'running',
	`context` varchar(64) NOT NULL DEFAULT 'personal',
	`linkedTaskId` varchar(36),
	`notes` text,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`endedAt` timestamp,
	CONSTRAINT `agents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `brain_dump_entries` (
	`id` varchar(36) NOT NULL,
	`userId` int NOT NULL,
	`text` text NOT NULL,
	`tags` text NOT NULL DEFAULT ('[]'),
	`converted` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `brain_dump_entries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `daily_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`dateKey` varchar(32) NOT NULL,
	`wrapUpDone` boolean NOT NULL DEFAULT false,
	`dumpCount` int NOT NULL DEFAULT 0,
	`winsCount` int NOT NULL DEFAULT 0,
	`tasksCompleted` int NOT NULL DEFAULT 0,
	`mood` int,
	`score` int NOT NULL DEFAULT 0,
	`focusSessions` int NOT NULL DEFAULT 0,
	`blocksCompleted` int NOT NULL DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `daily_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `focus_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`sessionNumber` int NOT NULL,
	`duration` int NOT NULL,
	`dateKey` varchar(32) NOT NULL,
	`completedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `focus_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `goals` (
	`id` varchar(36) NOT NULL,
	`userId` int NOT NULL,
	`text` text NOT NULL,
	`progress` float NOT NULL DEFAULT 0,
	`context` varchar(64) NOT NULL DEFAULT 'personal',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `goals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` varchar(36) NOT NULL,
	`userId` int NOT NULL,
	`text` text NOT NULL,
	`priority` enum('focus','urgent','normal') NOT NULL DEFAULT 'normal',
	`context` varchar(64) NOT NULL DEFAULT 'personal',
	`done` boolean NOT NULL DEFAULT false,
	`goalId` varchar(36),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `wins` (
	`id` varchar(36) NOT NULL,
	`userId` int NOT NULL,
	`text` text NOT NULL,
	`iconIdx` int NOT NULL DEFAULT 0,
	`archived` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `wins_id` PRIMARY KEY(`id`)
);
