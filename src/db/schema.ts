import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  index,
  varchar,
  boolean,
  integer,
} from "drizzle-orm/pg-core";

export const jobs = pgTable(
  "jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    type: varchar("type", { length: 255 }).notNull(),
    status: varchar("status", { length: 50 }).notNull().default("pending"),
    input: jsonb("input"),
    output: jsonb("output"),
    error: text("error"),
    screenshotViewport: text("screenshot_viewport"),
    screenshotFull: text("screenshot_full"),
    topIssues: jsonb("top_issues"),
    executiveSummary: text("executive_summary"),
    deleted: boolean("deleted").notNull().default(false),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("jobs_status_idx").on(table.status),
    index("jobs_type_idx").on(table.type),
  ]
);

export const expertAnalyses = pgTable(
  "expert_analyses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    jobId: uuid("job_id").notNull().references(() => jobs.id, { onDelete: "cascade" }),
    expertName: varchar("expert_name", { length: 100 }).notNull(),
    expertArchetype: varchar("expert_archetype", { length: 100 }).notNull(),
    friction: integer("friction").notNull(),
    emotionalEngagement: integer("emotional_engagement").notNull(),
    persuasiveness: integer("persuasiveness").notNull(),
    clarity: integer("clarity").notNull(),
    trust: integer("trust").notNull(),
    keyQuote: text("key_quote").notNull(),
    fullAnalysis: text("full_analysis").notNull(),
    deleted: boolean("deleted").notNull().default(false),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("expert_analyses_job_id_idx").on(table.jobId),
  ]
);

export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title"),
  content: text("content"),
  metadata: jsonb("metadata"),
  deleted: boolean("deleted").notNull().default(false),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
