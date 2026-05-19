import { pgTable, serial, varchar, text, timestamp, integer, decimal, boolean, unique, index } from "drizzle-orm/pg-core";
import { User } from "./users";
import { Group } from "./groups";

export const Category = pgTable("category", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
});

export const Wager = pgTable(
  "wager",
  {
    id: serial("id").primaryKey(),
    title: varchar("title").notNull(),
    description: text("description"),
    status: varchar("status").default("OPEN"),
    category_id: integer("category_id").references(() => Category.id).notNull(),
    created_by_id: integer("created_by_id").references(() => User.id, { onDelete: "cascade" }).notNull(),
    group_id: integer("group_id").references(() => Group.id, { onDelete: "set null" }),
    is_public: boolean("is_public").default(false),
    created_at: timestamp("created_at").defaultNow(),
    pool: varchar("pool"),
  },
  (table) => [
    index("wager_status_created_at_idx").on(table.status, table.created_at),
    index("wager_group_status_idx").on(table.group_id, table.status),
  ],
);

export const WagerVisibility = pgTable("wager_visibility", {
  id: serial("id").primaryKey(),
  wager_id: integer("wager_id").references(() => Wager.id, { onDelete: "cascade" }).notNull(),
  user_id: integer("user_id").references(() => User.id, { onDelete: "cascade" }).notNull(),
  invited_at: timestamp("invited_at").defaultNow(),
});

export const Outcome = pgTable(
  "outcome",
  {
    id: serial("id").primaryKey(),
    wager_id: integer("wager_id").references(() => Wager.id, { onDelete: "cascade" }).notNull(),
    title: varchar("title").notNull(),
    is_winner: boolean("is_winner").default(false),
  },
  (table) => [index("outcome_wager_idx").on(table.wager_id)],
);

export const Bet = pgTable(
  "bet",
  {
    id: serial("id").primaryKey(),
    user_id: integer("user_id").references(() => User.id, { onDelete: "cascade" }).notNull(),
    outcome_id: integer("outcome_id").references(() => Outcome.id, { onDelete: "cascade" }).notNull(),
    amount: decimal("amount").notNull(),
    created_at: timestamp("created_at").defaultNow(),
  },
  (table) => [
    unique("bet_user_outcome_unique").on(table.user_id, table.outcome_id),
    index("bet_user_idx").on(table.user_id),
    index("bet_outcome_idx").on(table.outcome_id),
    index("bet_created_at_idx").on(table.created_at),
  ],
);

export const Comment = pgTable("comment", {
  id: serial("id").primaryKey(),
  wager_id: integer("wager_id").references(() => Wager.id, { onDelete: "cascade" }).notNull(),
  user_id: integer("user_id").references(() => User.id, { onDelete: "cascade" }).notNull(),
  content: text("content").notNull(),
  created_at: timestamp("created_at").defaultNow(),
});