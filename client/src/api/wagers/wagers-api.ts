import {
  getWagerResponseSchema,
  paginatedCategoriesResponseSchema,
  paginatedWagersResponseSchema,
} from "@pb138/shared/schemas/wager";
import { readJsonOrThrow } from "../http";
import { WAGERS_PAGE_SIZE } from "../../features/wagers/utils/wagers-search";

export interface WagersListParams {
  page: number;
  search: string;
  status: string;
  category: string;
  involvement: string;
}

export async function fetchWagersList(params: WagersListParams) {
  const offset = (params.page - 1) * WAGERS_PAGE_SIZE;
  const query = new URLSearchParams({
    limit: String(WAGERS_PAGE_SIZE),
    offset: String(offset),
    q: params.search,
    status: params.status,
    category: params.category,
    involvement: params.involvement,
  });

  const response = await fetch(`/api/wagers?${query.toString()}`, {
    credentials: "same-origin",
  });

  return paginatedWagersResponseSchema.parse(
    await readJsonOrThrow(response, "Unable to load wagers"),
  );
}

export async function fetchWagerDetail(wagerId: number) {
  const response = await fetch(`/api/wagers/${wagerId}`, {
    credentials: "same-origin",
  });

  return getWagerResponseSchema.parse(
    await readJsonOrThrow(response, "Wager not found"),
  );
}

export async function fetchWagerCategories() {
  const response = await fetch("/api/wagers/categories?limit=50&offset=0", {
    credentials: "same-origin",
  });

  return paginatedCategoriesResponseSchema.parse(
    await readJsonOrThrow(response, "Unable to load categories"),
  );
}
