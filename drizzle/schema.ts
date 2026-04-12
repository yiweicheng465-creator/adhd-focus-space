import {
  boolean,
  float,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  apiKey: text("apiKey"),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ── Tasks ─────────────────────────────────────────────────────────────────────
export const tasks = mysqlTable("tasks", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: int("userId").notNull(),
  text: text("text").notNull(),
  priority: mysqlEnum("priority", ["focus", "urgent", "normal"]).default("normal").notNull(),
  context: varchar("context", { length: 64 }).default("personal").notNull(),
  done: boolean("done").default(false).notNull(),
  goalId: varchar("goalId", { length: 36 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;

// ── Wins ──────────────────────────────────────────────────────────────────────
export const wins = mysqlTable("wins", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: int("userId").notNull(),
  text: text("text").notNull(),
  iconIdx: int("iconIdx").default(0).notNull(),
  archived: boolean("archived").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Win = typeof wins.$inferSelect;
export type InsertWin = typeof wins.$inferInsert;

// ── Goals ─────────────────────────────────────────────────────────────────────
export const goals = mysqlTable("goals", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: int("userId").notNull(),
  text: text("text").notNull(),
  progress: float("progress").default(0).notNull(),
  context: varchar("context", { length: 64 }).default("personal").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Goal = typeof goals.$inferSelect;
export type InsertGoal = typeof goals.$inferInsert;

// ── AI Agents ─────────────────────────────────────────────────────────────────
export const agents = mysqlTable("agents", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  task: text("task").notNull(),
  status: mysqlEnum("status", ["running", "paused", "done", "failed"]).default("running").notNull(),
  context: varchar("context", { length: 64 }).default("personal").notNull(),
  linkedTaskId: varchar("linkedTaskId", { length: 36 }),
  notes: text("notes"),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  endedAt: timestamp("endedAt"),
});

export type Agent = typeof agents.$inferSelect;
export type InsertAgent = typeof agents.$inferInsert;

// ── Brain Dump Entries ────────────────────────────────────────────────────────
export const brainDumpEntries = mysqlTable("brain_dump_entries", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: int("userId").notNull(),
  text: text("text").notNull(),
  tags: text("tags").notNull().default("[]"), // JSON array of strings
  converted: boolean("converted").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BrainDumpEntry = typeof brainDumpEntries.$inferSelect;
export type InsertBrainDumpEntry = typeof brainDumpEntries.$inferInsert;

// ── Daily Logs ────────────────────────────────────────────────────────────────
export const dailyLogs = mysqlTable("daily_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  dateKey: varchar("dateKey", { length: 32 }).notNull(), // "Mon Apr 07 2026"
  wrapUpDone: boolean("wrapUpDone").default(false).notNull(),
  dumpCount: int("dumpCount").default(0).notNull(),
  winsCount: int("winsCount").default(0).notNull(),
  tasksCompleted: int("tasksCompleted").default(0).notNull(),
  mood: int("mood"),
  score: int("score").default(0).notNull(),
  focusSessions: int("focusSessions").default(0).notNull(),
  blocksCompleted: int("blocksCompleted").default(0).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DailyLog = typeof dailyLogs.$inferSelect;
export type InsertDailyLog = typeof dailyLogs.$inferInsert;

// ── AI Chat Messages ─────────────────────────────────────────────────────────
export const aiMessages = mysqlTable("ai_messages", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  role: mysqlEnum("role", ["user", "assistant"]).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AiMessage = typeof aiMessages.$inferSelect;
export type InsertAiMessage = typeof aiMessages.$inferInsert;

// ── Focus Sessions ────────────────────────────────────────────────────────────
export const focusSessions = mysqlTable("focus_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  sessionNumber: int("sessionNumber").notNull(),
  duration: int("duration").notNull(), // minutes
  dateKey: varchar("dateKey", { length: 32 }).notNull(),
  completedAt: timestamp("completedAt").defaultNow().notNull(),
});

export type FocusSession = typeof focusSessions.$inferSelect;
export type InsertFocusSession = typeof focusSessions.$inferInsert;
