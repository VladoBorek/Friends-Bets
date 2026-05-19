import { pgTable, serial, text, varchar, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { User } from "./users";

export const Notification = pgTable("notification", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => User.id, { onDelete: "cascade" }).notNull(),
  message: text("message").notNull(),
  type: varchar("type").notNull(),
  is_read: boolean("is_read").default(false),
  created_at: timestamp("created_at").defaultNow(),
});