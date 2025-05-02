import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  isPremium: boolean("is_premium").default(false).notNull(),
});

export const databaseConnections = pgTable("database_connections", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  host: text("host").notNull(),
  port: integer("port").notNull(),
  database: text("database").notNull(),
  username: text("username").notNull(),
  password: text("password"),
  table: text("table"),
});

export const extractionJobs = pgTable("extraction_jobs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  url: text("url").notNull(),
  timestamp: integer("timestamp").notNull(),
  status: text("status", { enum: ["completed", "in-progress", "failed"] }).notNull(),
  paginationUsed: boolean("pagination_used").default(false).notNull(),
  totalPages: integer("total_pages").default(1).notNull(),
});

export const detectedElements = pgTable("detected_elements", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").references(() => extractionJobs.id).notNull(),
  name: text("name").notNull(),
  type: text("type", { enum: ["text", "price", "image", "rating", "url", "custom"] }).notNull(),
  selector: text("selector").notNull(),
  icon: text("icon").notNull(),
  selected: boolean("selected").default(true).notNull(),
});

export const scrapedItems = pgTable("scraped_items", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").references(() => extractionJobs.id).notNull(),
  data: jsonb("data").notNull(),
  page: integer("page").default(1).notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  connections: many(databaseConnections),
  jobs: many(extractionJobs),
}));

export const extractionJobsRelations = relations(extractionJobs, ({ one, many }) => ({
  user: one(users, { fields: [extractionJobs.userId], references: [users.id] }),
  elements: many(detectedElements),
  items: many(scrapedItems),
}));

export const detectedElementsRelations = relations(detectedElements, ({ one }) => ({
  job: one(extractionJobs, { fields: [detectedElements.jobId], references: [extractionJobs.id] }),
}));

export const scrapedItemsRelations = relations(scrapedItems, ({ one }) => ({
  job: one(extractionJobs, { fields: [scrapedItems.jobId], references: [extractionJobs.id] }),
}));

export const databaseConnectionsRelations = relations(databaseConnections, ({ one }) => ({
  user: one(users, { fields: [databaseConnections.userId], references: [users.id] }),
}));

// Schemas
export const userInsertSchema = createInsertSchema(users);
export const databaseConnectionInsertSchema = createInsertSchema(databaseConnections);
export const extractionJobInsertSchema = createInsertSchema(extractionJobs);
export const detectedElementInsertSchema = createInsertSchema(detectedElements);
export const scrapedItemInsertSchema = createInsertSchema(scrapedItems);

// Types
export type User = typeof users.$inferSelect;
export type DatabaseConnection = typeof databaseConnections.$inferSelect;
export type ExtractionJob = typeof extractionJobs.$inferSelect;
export type DetectedElement = typeof detectedElements.$inferSelect;
export type ScrapedItem = typeof scrapedItems.$inferSelect;
export type ExtractedData = {
  id?: number;
  jobId: number;
  data: Record<string, any>;
  page: number;
  timestamp?: Date;
};
