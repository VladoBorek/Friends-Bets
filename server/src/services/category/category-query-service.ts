import type {
  CategoriesListQuery,
  CategoryAdminSummary,
  CategorySummary,
} from "@pb138/shared/schemas/wager";
import * as categoryRepository from "../../repositories/wagers/category-repository";

export async function listCategories(query: CategoriesListQuery) {
  const [total, rows] = await Promise.all([
    categoryRepository.countCategories(query.q),
    categoryRepository.listCategoriesPaginated(query.limit, query.offset, query.q),
  ]);

  const data: CategorySummary[] = rows.map((row) => ({
    id: row.id,
    name: row.name,
  }));

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

export async function listCategoriesWithUsage(query: CategoriesListQuery) {
  const [total, data] = await Promise.all([
    categoryRepository.countCategories(query.q),
    categoryRepository.listCategoriesWithUsagePaginated(query.limit, query.offset, query.q),
  ]);

  return {
    data: data satisfies CategoryAdminSummary[],
    pagination: {
      total,
      limit: query.limit,
      offset: query.offset,
      hasMore: query.offset + data.length < total,
    },
  };
}