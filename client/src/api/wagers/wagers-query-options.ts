import { queryOptions } from "@tanstack/react-query";
import { fetchWagerCategories, fetchWagerDetail, fetchWagersList, type WagersListParams } from "./wagers-api";

export const wagersKeys = {
  all: ["wagers"] as const,
  lists: () => ["wagers", "list"] as const,
  list: (params: WagersListParams) => ["wagers", "list", params] as const,
  details: () => ["wagers", "detail"] as const,
  detail: (wagerId: number) => ["wagers", "detail", wagerId] as const,
  categories: () => ["wagers", "categories"] as const,
};

export const wagersQueries = {
  list: (params: WagersListParams) =>
    queryOptions({
      queryKey: wagersKeys.list(params),
      queryFn: () => fetchWagersList(params),
      staleTime: 30_000,
    }),

  detail: (wagerId: number) =>
    queryOptions({
      queryKey: wagersKeys.detail(wagerId),
      queryFn: () => fetchWagerDetail(wagerId),
      staleTime: 30_000,
    }),

  categories: () =>
    queryOptions({
      queryKey: wagersKeys.categories(),
      queryFn: fetchWagerCategories,
      staleTime: 5 * 60_000,
    }),
};
