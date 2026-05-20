import { asc, eq, ilike, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { db } from "../../db/db";
import { Bet, Category, Outcome, Wager } from "../../db/schema";

export type CategoryRow = {
  id: number;
  name: string;
};

export type CategoryUsageRow = CategoryRow & {
  wagerCount: number;
  betCount: number;
};

function buildCategorySearchCondition(q: string): SQL | undefined {
  return q ? ilike(Category.name, `%${q}%`) : undefined;
}

export async function countCategories(q = ""): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(Category)
    .where(buildCategorySearchCondition(q));

  return Number(row?.count ?? 0);
}

export async function listCategoriesPaginated(
  limit: number,
  offset: number,
  q = "",
): Promise<CategoryRow[]> {
  return db
    .select({
      id: Category.id,
      name: Category.name,
    })
    .from(Category)
    .where(buildCategorySearchCondition(q))
    .orderBy(asc(Category.name))
    .limit(limit)
    .offset(offset);
}

export async function listAllCategories(): Promise<CategoryRow[]> {
  return db
    .select({
      id: Category.id,
      name: Category.name,
    })
    .from(Category)
    .orderBy(asc(Category.name));
}

export async function listCategoriesWithUsagePaginated(
  limit: number,
  offset: number,
  q = "",
): Promise<CategoryUsageRow[]> {
  const rows = await db
    .select({
      id: Category.id,
      name: Category.name,
      wagerCount: sql<number>`COUNT(DISTINCT ${Wager.id})`.mapWith(Number),
      betCount: sql<number>`COUNT(${Bet.id})`.mapWith(Number),
    })
    .from(Category)
    .leftJoin(Wager, eq(Wager.category_id, Category.id))
    .leftJoin(Outcome, eq(Outcome.wager_id, Wager.id))
    .leftJoin(Bet, eq(Bet.outcome_id, Outcome.id))
    .where(buildCategorySearchCondition(q))
    .groupBy(Category.id, Category.name)
    .orderBy(asc(Category.name))
    .limit(limit)
    .offset(offset);

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    wagerCount: row.wagerCount ?? 0,
    betCount: row.betCount ?? 0,
  }));
}

export async function listAllCategoriesWithUsage(): Promise<CategoryUsageRow[]> {
  const rows = await db
    .select({
      id: Category.id,
      name: Category.name,
      wagerCount: sql<number>`COUNT(DISTINCT ${Wager.id})`.mapWith(Number),
      betCount: sql<number>`COUNT(${Bet.id})`.mapWith(Number),
    })
    .from(Category)
    .leftJoin(Wager, eq(Wager.category_id, Category.id))
    .leftJoin(Outcome, eq(Outcome.wager_id, Wager.id))
    .leftJoin(Bet, eq(Bet.outcome_id, Outcome.id))
    .groupBy(Category.id, Category.name)
    .orderBy(asc(Category.name));

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    wagerCount: row.wagerCount ?? 0,
    betCount: row.betCount ?? 0,
  }));
}

export async function findCategoryById(categoryId: number): Promise<CategoryRow | null> {
  const [row] = await db
    .select({
      id: Category.id,
      name: Category.name,
    })
    .from(Category)
    .where(eq(Category.id, categoryId))
    .limit(1);

  return row ?? null;
}

export async function findCategoryByNameCaseInsensitive(name: string): Promise<CategoryRow | null> {
  const [row] = await db
    .select({
      id: Category.id,
      name: Category.name,
    })
    .from(Category)
    .where(sql`LOWER(${Category.name}) = LOWER(${name})`)
    .limit(1);

  return row ?? null;
}

export async function createCategory(name: string): Promise<CategoryRow> {
  const [row] = await db
    .insert(Category)
    .values({ name })
    .returning({
      id: Category.id,
      name: Category.name,
    });

  return row;
}

export async function deleteCategoryById(categoryId: number): Promise<void> {
  await db.delete(Category).where(eq(Category.id, categoryId));
}

export async function hasAnyWagersInCategory(categoryId: number): Promise<boolean> {
  const [row] = await db
    .select({ id: Wager.id })
    .from(Wager)
    .where(eq(Wager.category_id, categoryId))
    .limit(1);

  return Boolean(row);
}

export async function hasAnyBetsInCategory(categoryId: number): Promise<boolean> {
  const [row] = await db
    .select({ id: Bet.id })
    .from(Bet)
    .innerJoin(Outcome, eq(Outcome.id, Bet.outcome_id))
    .innerJoin(Wager, eq(Wager.id, Outcome.wager_id))
    .where(eq(Wager.category_id, categoryId))
    .limit(1);

  return Boolean(row);
}