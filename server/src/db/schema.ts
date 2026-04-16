import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  decimal,
  boolean,
  json,
  check,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

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

export const Wallet = pgTable("wallet", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").unique().references(() => User.id), // Null for House Wallet
  balance: decimal("balance").default("0"),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const Group = pgTable("group", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  description: text("description"),
  invite_code: varchar("invite_code"),
  created_at: timestamp("created_at").defaultNow(),
});

export const GroupMembership = pgTable("group_membership", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => User.id).notNull(),
  group_id: integer("group_id").references(() => Group.id).notNull(),
  role: varchar("role").notNull(), // OWNER, MEMBER
  joined_at: timestamp("joined_at").defaultNow(),
});

export const Category = pgTable("category", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
});

export const Wager = pgTable("wager", {
  id: serial("id").primaryKey(),
  title: varchar("title").notNull(),
  description: text("description"),
  status: varchar("status").default("OPEN"), // OPEN, PENDING, CLOSED
  category_id: integer("category_id").references(() => Category.id).notNull(),
  created_by_id: integer("created_by_id").references(() => User.id).notNull(),
  is_public: boolean("is_public").default(false),
  created_at: timestamp("created_at").defaultNow(),
  // Extended UI fields
  pool: varchar("pool"), 
  group: varchar("group"), 
  outcomeSplit: json("outcome_split"),
});

export const WagerVisibility = pgTable("wager_visibility", {
  id: serial("id").primaryKey(),
  wager_id: integer("wager_id").references(() => Wager.id).notNull(),
  user_id: integer("user_id").references(() => User.id).notNull(),
  invited_at: timestamp("invited_at").defaultNow(),
});

export const Outcome = pgTable("outcome", {
  id: serial("id").primaryKey(),
  wager_id: integer("wager_id").references(() => Wager.id).notNull(),
  title: varchar("title").notNull(),
  odds: decimal("odds"),
  is_winner: boolean("is_winner").default(false),
});

export const Bet = pgTable("bet", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => User.id).notNull(),
  outcome_id: integer("outcome_id").references(() => Outcome.id).notNull(),
  amount: decimal("amount").notNull(),
  created_at: timestamp("created_at").defaultNow(),
});

export const Transaction = pgTable("transaction", {
  id: serial("id").primaryKey(),
  from_wallet_id: integer("from_wallet_id").references(() => Wallet.id),
  to_wallet_id: integer("to_wallet_id").references(() => Wallet.id),
  type: varchar("type").notNull(),
  amount: decimal("amount").notNull(),
  reference_id: integer("reference_id"), 
  created_at: timestamp("created_at").defaultNow(),
});

export const Notification = pgTable("notification", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => User.id).notNull(),
  message: text("message").notNull(),
  type: varchar("type").notNull(),
  is_read: boolean("is_read").default(false),
  created_at: timestamp("created_at").defaultNow(),
});

export const Comment = pgTable("comment", {
  id: serial("id").primaryKey(),
  wager_id: integer("wager_id").references(() => Wager.id).notNull(),
  user_id: integer("user_id").references(() => User.id).notNull(),
  content: text("content").notNull(),
  created_at: timestamp("created_at").defaultNow(),
});

export const Friendship = pgTable(
  "friendship",
  {
    id: serial("id").primaryKey(),
    requester_id: integer("requester_id").references(() => User.id).notNull(),
    addressee_id: integer("addressee_id").references(() => User.id).notNull(),
    status: varchar("status").notNull(), // PENDING | ACCEPTED | REJECTED
    created_at: timestamp("created_at").defaultNow(),
    responded_at: timestamp("responded_at"),
  },
  (table) => [
    check("friendship_not_self_check", sql`${table.requester_id} <> ${table.addressee_id}`),
    uniqueIndex("friendship_requester_addressee_unique").on(table.requester_id, table.addressee_id),
  ],
);


// Relationships configuration
export const UserRelations = relations(User, ({ one, many }) => ({
  role: one(Role, { fields: [User.role_id], references: [Role.id] }),
  wallet: one(Wallet),
  memberships: many(GroupMembership),
  created_wagers: many(Wager),
  bets: many(Bet),
  notifications: many(Notification),
  comments: many(Comment),
  wager_invites: many(WagerVisibility),
  sent_friend_requests: many(Friendship, { relationName: "friendship_requester" }),
  received_friend_requests: many(Friendship, { relationName: "friendship_addressee" }),
}));

export const WalletRelations = relations(Wallet, ({ one, many }) => ({
  user: one(User, { fields: [Wallet.user_id], references: [User.id] }),
  outgoing_transactions: many(Transaction, { relationName: "from_wallet" }),
  incoming_transactions: many(Transaction, { relationName: "to_wallet" }),
}));

export const TransactionRelations = relations(Transaction, ({ one }) => ({
  from_wallet: one(Wallet, { fields: [Transaction.from_wallet_id], references: [Wallet.id], relationName: "from_wallet" }),
  to_wallet: one(Wallet, { fields: [Transaction.to_wallet_id], references: [Wallet.id], relationName: "to_wallet" }),
}));

export const RoleRelations = relations(Role, ({ many }) => ({
  users: many(User),
}));

export const GroupRelations = relations(Group, ({ many }) => ({
  memberships: many(GroupMembership),
}));

export const GroupMembershipRelations = relations(GroupMembership, ({ one }) => ({
  user: one(User, { fields: [GroupMembership.user_id], references: [User.id] }),
  group: one(Group, { fields: [GroupMembership.group_id], references: [Group.id] }),
}));

export const CategoryRelations = relations(Category, ({ many }) => ({
  wagers: many(Wager),
}));

export const WagerRelations = relations(Wager, ({ one, many }) => ({
  category: one(Category, { fields: [Wager.category_id], references: [Category.id] }),
  creator: one(User, { fields: [Wager.created_by_id], references: [User.id] }),
  visibilities: many(WagerVisibility),
  outcomes: many(Outcome),
  comments: many(Comment),
}));

export const WagerVisibilityRelations = relations(WagerVisibility, ({ one }) => ({
  wager: one(Wager, { fields: [WagerVisibility.wager_id], references: [Wager.id] }),
  user: one(User, { fields: [WagerVisibility.user_id], references: [User.id] }),
}));

export const OutcomeRelations = relations(Outcome, ({ one, many }) => ({
  wager: one(Wager, { fields: [Outcome.wager_id], references: [Wager.id] }),
  bets: many(Bet),
}));

export const BetRelations = relations(Bet, ({ one }) => ({
  user: one(User, { fields: [Bet.user_id], references: [User.id] }),
  outcome: one(Outcome, { fields: [Bet.outcome_id], references: [Outcome.id] }),
}));

export const NotificationRelations = relations(Notification, ({ one }) => ({
  user: one(User, { fields: [Notification.user_id], references: [User.id] }),
}));

export const CommentRelations = relations(Comment, ({ one }) => ({
  wager: one(Wager, { fields: [Comment.wager_id], references: [Wager.id] }),
  user: one(User, { fields: [Comment.user_id], references: [User.id] }),
}));

export const FriendshipRelations = relations(Friendship, ({ one }) => ({
  requester: one(User, {
    fields: [Friendship.requester_id],
    references: [User.id],
    relationName: "friendship_requester",
  }),
  addressee: one(User, {
    fields: [Friendship.addressee_id],
    references: [User.id],
    relationName: "friendship_addressee",
  }),
}));
