#!/usr/bin/env node

import { asc, count, desc, eq } from "drizzle-orm";
import { db, closeConnection } from "../src/db/db";
import { Bet, Category, Outcome, Transaction, User, Wallet, Wager } from "../src/db/schema";

const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const BLUE = "\x1b[36m";
const RESET = "\x1b[0m";

async function showStats() {
  try {
    console.log(`${BLUE}╭──────────────────────────────────────╮${RESET}`);
    console.log(`${BLUE}│  Database Query Report               │${RESET}`);
    console.log(`${BLUE}╰──────────────────────────────────────╯${RESET}\n`);

    console.log(`${GREEN}Open Wagers:${RESET}`);
    const openWagers = await db
      .select({
        id: Wager.id,
        title: Wager.title,
        status: Wager.status,
        creator: User.username,
        category: Category.name,
      })
      .from(Wager)
      .innerJoin(User, eq(Wager.created_by_id, User.id))
      .innerJoin(Category, eq(Wager.category_id, Category.id))
      .where(eq(Wager.status, "OPEN"))
      .orderBy(desc(Wager.created_at));

    if (openWagers.length === 0) {
      console.log("  (No open wagers found)\n");
    } else {
      openWagers.slice(0, 5).forEach((wager, i) => {
        console.log(`  ${i + 1}. [${wager.id}] ${wager.title}`);
        console.log(`     Creator: ${wager.creator} | Category: ${wager.category}`);
      });
      console.log(openWagers.length > 5 ? `  ... and ${openWagers.length - 5} more\n` : "");
    }

    console.log(`${GREEN}Recent Bets:${RESET}`);
    const recentBets = await db
      .select({
        betId: Bet.id,
        user: User.username,
        outcome: Outcome.title,
        amount: Bet.amount,
        wagerId: Wager.id,
        wagerTitle: Wager.title,
      })
      .from(Bet)
      .innerJoin(User, eq(Bet.user_id, User.id))
      .innerJoin(Outcome, eq(Bet.outcome_id, Outcome.id))
      .innerJoin(Wager, eq(Outcome.wager_id, Wager.id))
      .orderBy(desc(Bet.created_at));

    if (recentBets.length === 0) {
      console.log("  (No bets found)\n");
    } else {
      recentBets.slice(0, 5).forEach((bet, i) => {
        console.log(`  ${i + 1}. ${bet.user} bet ${bet.amount} on "${bet.outcome}"`);
        console.log(`     Wager: [${bet.wagerId}] ${bet.wagerTitle}`);
      });
      console.log(recentBets.length > 5 ? `  ... and ${recentBets.length - 5} more\n` : "");
    }

    console.log(`${GREEN}Users & Wallet Balances:${RESET}`);
    const userWallets = await db
      .select({
        userId: User.id,
        username: User.username,
        walletId: Wallet.id,
        walletBalance: Wallet.balance,
      })
      .from(User)
      .leftJoin(Wallet, eq(Wallet.user_id, User.id))
      .orderBy(asc(User.id));

    if (userWallets.length === 0) {
      console.log("  (No users found)\n");
    } else {
      userWallets.forEach((userWallet, i) => {
        const walletId = userWallet.walletId ?? "n/a";
        const balance = userWallet.walletBalance ?? "0";
        console.log(`  ${i + 1}. [${userWallet.userId}] ${userWallet.username}`);
        console.log(`     Wallet: ${walletId} | Balance: ${balance}`);
      });
      console.log("");
    }

    console.log(`${GREEN}Recent Transactions:${RESET}`);
    const recentTransactions = await db
      .select({
        username: User.username,
        walletId: Transaction.wallet_id,
        outcomeId: Transaction.outcome_id,
        amount: Transaction.amount,
        createdAt: Transaction.created_at,
      })
      .from(User)
      .innerJoin(Wallet, eq(Wallet.user_id, User.id))
      .innerJoin(Transaction, eq(Transaction.wallet_id, Wallet.id))
      .orderBy(desc(Transaction.created_at));

    if (recentTransactions.length === 0) {
      console.log("  (No transactions found)\n");
    } else {
      recentTransactions.slice(0, 10).forEach((tx, i) => {
        console.log(`  ${i + 1}. ${tx.username}`);
        console.log(
          `     wallet_id: ${tx.walletId} | outcome_id: ${tx.outcomeId ?? "n/a"} | amount: ${tx.amount} | created_at: ${tx.createdAt?.toISOString() ?? "n/a"}`,
        );
      });
      console.log(recentTransactions.length > 10 ? `  ... and ${recentTransactions.length - 10} more\n` : "");
    }

    const [wagerCount] = await db.select({ count: count() }).from(Wager);
    const [betCount] = await db.select({ count: count() }).from(Bet);
    const [userCount] = await db.select({ count: count() }).from(User);

    console.log(`${BLUE}Summary:${RESET}`);
    console.log(`  Total wagers: ${wagerCount?.count ?? 0}`);
    console.log(`  Total bets: ${betCount?.count ?? 0}`);
    console.log(`  Total users: ${userCount?.count ?? 0}\n`);
  } catch (error) {
    console.error(`${RED}Query failed:${RESET}`, error);
    process.exitCode = 1;
  } finally {
    await closeConnection();
  }
}

showStats();
