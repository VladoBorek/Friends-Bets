import { pgTable, serial, varchar, timestamp, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { User } from "./users";

export const Notification = pgTable("notification", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => User.id, { onDelete: "cascade" }).notNull(),
  type: varchar("type").notNull(),
  data: jsonb("data").notNull().$type<Record<string, unknown>>().default({}),
  source_key: varchar("source_key").unique(),
  is_read: boolean("is_read").default(false),
  created_at: timestamp("created_at").defaultNow(),
});