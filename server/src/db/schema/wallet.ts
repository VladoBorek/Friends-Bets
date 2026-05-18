import { pgTable, serial, timestamp, integer, decimal, varchar, index } from "drizzle-orm/pg-core";
import { User } from "./users";
import { Outcome } from "./wagers";

export const Wallet = pgTable("wallet", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").unique().references(() => User.id, { onDelete: "cascade" }),
  balance: decimal("balance").default("0"),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const Transaction = pgTable(
  "transaction",
  {
    id: serial("id").primaryKey(),
    wallet_id: integer("wallet_id").references(() => Wallet.id, { onDelete: "cascade" }).notNull(),
    outcome_id: integer("outcome_id").references(() => Outcome.id, { onDelete: "set null" }),
    type: varchar("type").notNull(),
    amount: decimal("amount").notNull(),
    created_at: timestamp("created_at").defaultNow(),
  },
  (table) => [
    index("transaction_wallet_idx").on(table.wallet_id),
    index("transaction_outcome_type_idx").on(table.outcome_id, table.type),
  ],
);