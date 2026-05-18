import { pgTable, serial, varchar, timestamp, integer, boolean } from "drizzle-orm/pg-core";

export const Role = pgTable("role", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
});

export const User = pgTable("user", {
  id: serial("id").primaryKey(),
  username: varchar("username").notNull(),
  email: varchar("email").unique().notNull(),
  password_hash: varchar("password_hash").notNull(),
  avatar_url: varchar("avatar_url"),
  role_id: integer("role_id").references(() => Role.id).notNull(),
  is_verified: boolean("is_verified").default(false),
  suspended_until: timestamp("suspended_until"),
  created_at: timestamp("created_at").defaultNow(),
});