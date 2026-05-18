// server/src/db/schema/groups.ts
import { pgTable, serial, varchar, text, timestamp, integer, check, uniqueIndex, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { User } from "./users";

export const Group = pgTable(
  "group",
  {
    id: serial("id").primaryKey(),
    name: varchar("name").notNull(),
    description: text("description"),
    invite_code: varchar("invite_code"),
    created_at: timestamp("created_at").defaultNow(),
  },
  (table) => [
    uniqueIndex("group_invite_code_unique").on(table.invite_code),
    index("group_created_at_idx").on(table.created_at),
  ],
);

export const GroupMembership = pgTable(
  "group_membership",
  {
    id: serial("id").primaryKey(),
    user_id: integer("user_id").references(() => User.id, { onDelete: "cascade" }).notNull(),
    group_id: integer("group_id").references(() => Group.id, { onDelete: "cascade" }).notNull(),
    role: varchar("role").notNull(),
    joined_at: timestamp("joined_at").defaultNow(),
  },
  (table) => [
    check("group_membership_role_check", sql`${table.role} in ('OWNER', 'MEMBER')`),
    uniqueIndex("group_membership_user_group_unique").on(table.user_id, table.group_id),
    index("group_membership_user_idx").on(table.user_id),
    index("group_membership_group_idx").on(table.group_id),
  ],
);

export const GroupInvitation = pgTable(
  "group_invitation",
  {
    id: serial("id").primaryKey(),
    group_id: integer("group_id").references(() => Group.id, { onDelete: "cascade" }).notNull(),
    requester_id: integer("requester_id").references(() => User.id, { onDelete: "cascade" }).notNull(),
    addressee_id: integer("addressee_id").references(() => User.id, { onDelete: "cascade" }).notNull(),
    status: varchar("status").notNull(),
    created_at: timestamp("created_at").defaultNow(),
    responded_at: timestamp("responded_at"),
  },
  (table) => [
    check("group_invitation_status_check", sql`${table.status} in ('PENDING', 'ACCEPTED', 'REJECTED')`),
    check("group_invitation_not_self_check", sql`${table.requester_id} <> ${table.addressee_id}`),
    uniqueIndex("group_invitation_group_addressee_unique").on(table.group_id, table.addressee_id),
    index("group_invitation_requester_idx").on(table.requester_id),
    index("group_invitation_addressee_idx").on(table.addressee_id),
  ],
);