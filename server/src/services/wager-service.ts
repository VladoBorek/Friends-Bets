import { desc, eq } from "drizzle-orm";
import { db } from "../db/db";
import { Category, Outcome, User, Wager } from "../db/schema";
import type { CreateWagerRequest, WagerDetail, WagerSummary } from "../../../shared/src/schemas/wager";
import { HttpError } from "../errors";

function normalizeStatus(value: string | null): "OPEN" | "PENDING" | "CLOSED" {
  if (value === "OPEN" || value === "PENDING" || value === "CLOSED") {
    return value;
  }

  return "OPEN";
}

function mapWagerSummary(row: {
  id: number;
  title: string;
  description: string | null;
  status: string | null;
  categoryId: number;
  categoryName: string;
  createdById: number;
  creatorName: string;
  isPublic: boolean | null;
  createdAt: Date | null;
}): WagerSummary {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: normalizeStatus(row.status),
    categoryId: row.categoryId,
    categoryName: row.categoryName,
    createdById: row.createdById,
    creatorName: row.creatorName,
    isPublic: row.isPublic ?? false,
    createdAt: row.createdAt?.toISOString() ?? null,
  };
}

export async function listWagers(): Promise<WagerSummary[]> {
  const rows = await db
    .select({
      id: Wager.id,
      title: Wager.title,
      description: Wager.description,
      status: Wager.status,
      categoryId: Category.id,
      categoryName: Category.name,
      createdById: User.id,
      creatorName: User.username,
      isPublic: Wager.is_public,
      createdAt: Wager.created_at,
    })
    .from(Wager)
    .innerJoin(Category, eq(Wager.category_id, Category.id))
    .innerJoin(User, eq(Wager.created_by_id, User.id))
    .orderBy(desc(Wager.created_at));

  return rows.map(mapWagerSummary);
}

export async function getWagerById(id: number): Promise<WagerDetail> {
  const [row] = await db
    .select({
      id: Wager.id,
      title: Wager.title,
      description: Wager.description,
      status: Wager.status,
      categoryId: Category.id,
      categoryName: Category.name,
      createdById: User.id,
      creatorName: User.username,
      isPublic: Wager.is_public,
      createdAt: Wager.created_at,
    })
    .from(Wager)
    .innerJoin(Category, eq(Wager.category_id, Category.id))
    .innerJoin(User, eq(Wager.created_by_id, User.id))
    .where(eq(Wager.id, id));

  if (!row) {
    throw new HttpError(404, "Wager not found");
  }

  const outcomes = await db
    .select({
      id: Outcome.id,
      title: Outcome.title,
      odds: Outcome.odds,
      isWinner: Outcome.is_winner,
    })
    .from(Outcome)
    .where(eq(Outcome.wager_id, id));

  return {
    ...mapWagerSummary(row),
    outcomes,
  };
}

export async function createWager(input: CreateWagerRequest): Promise<WagerDetail> {
  const [category, creator] = await Promise.all([
    db.select({ id: Category.id }).from(Category).where(eq(Category.id, input.categoryId)).limit(1),
    db.select({ id: User.id }).from(User).where(eq(User.id, input.createdById)).limit(1),
  ]);

  if (!category[0]) {
    throw new HttpError(400, "Unknown categoryId");
  }

  if (!creator[0]) {
    throw new HttpError(400, "Unknown createdById");
  }

  const created = await db.transaction(async (tx) => {
    const [newWager] = await tx
      .insert(Wager)
      .values({
        title: input.title,
        description: input.description ?? null,
        status: "OPEN",
        category_id: input.categoryId,
        created_by_id: input.createdById,
        is_public: input.isPublic,
      })
      .returning({ id: Wager.id });

    await tx.insert(Outcome).values(
      input.outcomes.map((outcome) => ({
        wager_id: newWager.id,
        title: outcome.title,
        odds: outcome.odds?.toFixed(2),
      })),
    );

    return newWager;
  });

  return getWagerById(created.id);
}
