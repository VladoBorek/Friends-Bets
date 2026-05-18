import { HttpError } from "../../errors";
import {
  findWagerById,
  findWagerByIdWithDetails,
  countWagersWithFilters,
  listWagersWithDetails,
  listWagerOutcomes,
} from "../../repositories/wagers/wager-repository";
import {
  findWagerVisibility,
  listWagerVisibilityUsers,
} from "../../repositories/wagers/wager-visibility-repository";
import { listAllCategories } from "../../repositories/wagers/category-repository";
import { mapWagerDetail, mapWagerSummary } from "./mappers/wager-mapper";
import type { CategorySummary, WagerDetail, WagersListQuery, PaginatedWagersResponse } from "@pb138/shared/schemas/wager";

export async function listWagers(
  query: WagersListQuery,
  currentUserId?: number,
): Promise<PaginatedWagersResponse> {
  const options = { ...query, currentUserId };
  const [total, rows] = await Promise.all([
    countWagersWithFilters(options),
    listWagersWithDetails(options),
  ]);

  const data = await Promise.all(
    rows.map(async (row) => {
      const outcomes = await listWagerOutcomes(row.id);
      return mapWagerSummary(row, outcomes);
    }),
  );

  return {
    data,
    pagination: {
      total,
      limit: query.limit,
      offset: query.offset,
      hasMore: query.offset + data.length < total,
    },
  };
}

export async function getWagerById(id: number, currentUserId?: number): Promise<WagerDetail> {
  const wagerRow = await findWagerByIdWithDetails(id, currentUserId);

  if (!wagerRow) {
    throw new HttpError(404, "Wager not found");
  }

  if (!wagerRow.isPublic) {
    if (!currentUserId || wagerRow.createdById !== currentUserId) {
      const visibility = await findWagerVisibility(id, currentUserId ?? 0);

      if (!visibility) {
        throw new HttpError(404, "Wager not found");
      }
    }
  }

  const outcomes = await listWagerOutcomes(id);
  return mapWagerDetail(wagerRow, outcomes);
}

export async function listWagerInvitations(
  wagerId: number,
  requestingUserId: number,
): Promise<{ id: number; username: string; email: string }[]> {
  const wagerRow = await findWagerById(wagerId);
  if (!wagerRow) throw new HttpError(404, "Wager not found");
  if (wagerRow.createdById !== requestingUserId) throw new HttpError(403, "Only the wager creator can view invitations");
  return listWagerVisibilityUsers(wagerId);
}

export async function listCategoriesForQuery(): Promise<CategorySummary[]> {
  const rows = await listAllCategories();
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
  }));
}
