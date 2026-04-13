ALTER TABLE `users` ADD `aiCallsTotal` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `aiCallsThisMonth` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `aiCallsMonthKey` varchar(7);