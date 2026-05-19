import { pgTable, serial, varchar, timestamp, integer, check, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { User } from "./users";

export const Friendship = pgTable(
  "friendship",
  {
    id: serial("id").primaryKey(),
    requester_id: integer("requester_id").references(() => User.id).notNull(),
    addressee_id: integer("addressee_id").references(() => User.id).notNull(),
    status: varchar("status").notNull(),
    created_at: timestamp("created_at").defaultNow(),
    responded_at: timestamp("responded_at"),
  },
  (table) => [
    check("friendship_not_self_check", sql`${table.requester_id} <> ${table.addressee_id}`),
    uniqueIndex("friendship_requester_addressee_unique").on(table.requester_id, table.addressee_id),
  ],
);