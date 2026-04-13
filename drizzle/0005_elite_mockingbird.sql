CREATE TABLE `quick_replies` (
	`id` varchar(36) NOT NULL,
	`userId` int NOT NULL,
	`text` varchar(255) NOT NULL,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `quick_replies_id` PRIMARY KEY(`id`)
);
