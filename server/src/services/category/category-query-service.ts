import type { CategorySummary } from "@pb138/shared/schemas/wager";
import * as categoryRepository from "../../repositories/wagers/category-repository";

export type CategoryAdminSummary = CategorySummary & {
  wagerCount: number;
  betCount: number;
};

export async function listCategories(): Promise<CategorySummary[]> {
  const rows = await categoryRepository.listAllCategories();
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
  }));
}

export async function listCategoriesWithUsage(): Promise<CategoryAdminSummary[]> {
  return categoryRepository.listAllCategoriesWithUsage();
}
