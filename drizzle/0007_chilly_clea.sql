ALTER TABLE `users` ADD `manusCallsTotal` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `manusCallsThisMonth` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `openaiCallsTotal` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `openaiCallsThisMonth` int DEFAULT 0 NOT NULL;